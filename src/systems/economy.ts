import { TUNING } from '../config/tuning';
import { cumulativeDue, isPaymentDay, paymentDueForWeek, weekOf } from '../core/calendar';
import type { CatchHold, GameState } from '../core/state';
import type { SortTally } from './sorting';
import { fishDef, fishPrice } from '../data/fish';

/** [변경 1] records a caught fish in the log (encyclopedia, records). Returns flags for the card. */
export function logFish(s: GameState, id: string, inches: number): { isNew: boolean; record: boolean } {
  const e = s.fishLog[id];
  if (!e) {
    s.fishLog[id] = { count: 1, best: inches, firstDay: s.day };
    return { isNew: true, record: false };
  }
  e.count += 1;
  const record = inches > e.best;
  if (record) e.best = inches;
  return { isNew: false, record };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function addTallyToHold(s: GameState, t: SortTally): void {
  s.hold.small = round2(s.hold.small + t.lbs.small);
  s.hold.medium = round2(s.hold.medium + t.lbs.medium);
  s.hold.large = round2(s.hold.large + t.lbs.large);
  s.hold.crabs += t.crabs;
  s.hold.fishCount += t.fish.length;
  s.hold.fishValue = round2(s.hold.fishValue + t.fish.reduce((sum, f) => sum + fishPrice(fishDef(f.id)!, f.inches), 0));
  s.hold.golden += t.golden;
  s.hold.bonus = round2(s.hold.bonus + t.bonus);
  for (const f of t.fish) logFish(s, f.id, f.inches);
  const lbs = t.lbs.small + t.lbs.medium + t.lbs.large;
  s.today.lbsCaught += lbs;
  s.week.lbsCaught += lbs;
  s.totals.lbs += lbs;
  s.today.stolen += t.stolen;
  s.week.stolen += t.stolen;
  s.totals.stolen += t.stolen;
  s.today.turtlesSaved += t.turtlesSaved;
  s.week.turtlesSaved += t.turtlesSaved;
  s.totals.turtlesSaved += t.turtlesSaved;
  s.today.bycatchFed += t.fed;
  s.week.bycatchFed += t.fed;
}

export type Seller = 'cannery' | 'market' | 'rosa';

export interface SaleQuote {
  seller: Seller;
  lbs: { small: number; medium: number; large: number };
  crabs: number;
  fishCount: number;
  fishValue: number;
  golden: number;
  bonus: number;
  total: number;
  /** pounds sold at the oversupply price (cannery only) */
  oversupplyLbs: number;
}

function holdLbs(h: CatchHold): number {
  return h.small + h.medium + h.large;
}

/**
 * Quote selling (part of) the hold. Rosa takes at most 30 lb a day (largest first) and no crabs.
 * The cannery drops its price ×0.8 after 450 lb sold to it in one week.
 */
export function quoteSale(s: GameState, seller: Seller, hold: CatchHold = s.hold): SaleQuote {
  const p = TUNING.prices;
  const lbs = { small: hold.small, medium: hold.medium, large: hold.large };
  let crabs = hold.crabs;
  if (seller === 'rosa') {
    let cap = Math.max(0, p.rosaMaxLbsPerDay - (Number(s.flags.rosaLbsToday) || 0));
    for (const k of ['large', 'medium', 'small'] as const) {
      const take = Math.min(lbs[k], cap);
      lbs[k] = take;
      cap -= take;
    }
    crabs = 0;
  }
  const mult = seller === 'cannery' ? 1 : seller === 'market' ? p.marketMultiplier : p.rosaMultiplier;
  let total = 0;
  let oversupplyLbs = 0;
  let canneryUsed = s.week.canneryLbs;
  for (const k of ['small', 'medium', 'large'] as const) {
    const unit = p[k] * mult;
    if (seller === 'cannery') {
      const normal = Math.max(0, Math.min(lbs[k], p.canneryOversupplyLbs - canneryUsed));
      const over = lbs[k] - normal;
      canneryUsed += lbs[k];
      oversupplyLbs += over;
      total += normal * unit + over * unit * p.canneryOversupplyMult;
    } else {
      total += lbs[k] * unit;
    }
  }
  total += crabs * p.crab * mult;
  // fish, golden shrimp and the combo bonus go to the truck or the market (Rosa only takes shrimp)
  const extras = seller !== 'rosa';
  const fishValue = extras ? round2(hold.fishValue * mult) : 0;
  const golden = extras ? hold.golden : 0;
  const bonus = extras ? hold.bonus : 0;
  total += fishValue + golden * p.goldenShrimp + bonus;
  return {
    seller,
    lbs,
    crabs,
    fishCount: extras ? hold.fishCount : 0,
    fishValue,
    golden,
    bonus,
    total: round2(total),
    oversupplyLbs: round2(oversupplyLbs),
  };
}

export function executeSale(s: GameState, q: SaleQuote): number {
  s.hold.small = round2(s.hold.small - q.lbs.small);
  s.hold.medium = round2(s.hold.medium - q.lbs.medium);
  s.hold.large = round2(s.hold.large - q.lbs.large);
  s.hold.crabs -= q.crabs;
  if (q.seller !== 'rosa') {
    s.hold.fishCount = 0;
    s.hold.fishValue = 0;
    s.hold.golden = 0;
    s.hold.bonus = 0;
  }
  const sold = q.lbs.small + q.lbs.medium + q.lbs.large;
  if (q.seller === 'cannery') s.week.canneryLbs += sold;
  if (q.seller === 'rosa') s.flags.rosaLbsToday = (Number(s.flags.rosaLbsToday) || 0) + sold;
  s.money = round2(s.money + q.total);
  s.today.earned = round2(s.today.earned + q.total);
  s.week.earned = round2(s.week.earned + q.total);
  s.totals.earned = round2(s.totals.earned + q.total);
  return q.total;
}

export function holdValue(s: GameState): number {
  return quoteSale(s, 'cannery').total;
}

export const paidTotal = (s: GameState) => TUNING.debt.total + s.fees - s.debt;

/** What must be paid by this Friday 17:00 to be on schedule (includes any overdue amount and fees). */
export function dueNow(s: GameState): number {
  if (s.debt <= 0) return 0;
  const w = weekOf(s.day);
  const sched = w > TUNING.debt.lastPaymentWeek ? cumulativeDue(TUNING.debt.lastPaymentWeek) : cumulativeDue(w);
  const owed = Math.max(0, sched + s.fees - paidTotal(s));
  return round2(Math.min(s.debt, owed));
}

export function thisWeekScheduled(s: GameState): number {
  return paymentDueForWeek(weekOf(s.day));
}

/** Pay toward the debt (prepayment, Friday or overdue). Overdue money is paid first. */
export function payDebt(s: GameState, amount: number): number {
  const pay = round2(Math.max(0, Math.min(amount, s.money, s.debt)));
  if (pay <= 0) return 0;
  s.money = round2(s.money - pay);
  s.debt = round2(s.debt - pay);
  s.paidThisWeek = round2(s.paidThisWeek + pay);
  s.week.paid = round2(s.week.paid + pay);
  if (s.overdue) {
    s.overdue.amount = round2(s.overdue.amount - pay);
    if (s.overdue.amount <= 0.004) s.overdue = null;
  }
  if (s.debt <= 0 && !s.flags.debtPaidOffDay) s.flags.debtPaidOffDay = s.day;
  return pay;
}

/** Gus's coffee can: once per season, Days 1–44, when a Friday payment is going to fall short. */
export function gusCanOffer(s: GameState): boolean {
  const g = TUNING.gusCan;
  if (s.flags.gusCanOffered) return false;
  if (s.day < g.firstDay || s.day > g.lastDay) return false;
  if (!isPaymentDay(s.day)) return false;
  return dueNow(s) > s.money + 0.004;
}

export interface FridayResult {
  due: number;
  paid: number;
  short: number;
  fee: number;
  /** amount (short + fee) to pay by Monday 17:00 */
  overdue: number;
  repossess: boolean;
  paidOff: boolean;
}

/** Friday 17:00: the week's amount is taken automatically. */
export function fridayPayment(s: GameState): FridayResult {
  const due = dueNow(s);
  const paid = payDebt(s, due);
  const short = round2(due - paid);
  let fee = 0;
  let repossess = false;
  if (short > 0) {
    s.shortfalls += 1;
    if (s.shortfalls >= TUNING.debt.maxShortfalls) {
      repossess = true;
    } else {
      fee = round2(short * TUNING.debt.lateFee);
      s.fees = round2(s.fees + fee);
      s.debt = round2(s.debt + fee);
      s.overdue = { amount: round2(short + fee), deadlineDay: s.day + 3 };
    }
  }
  s.payments.push({ day: s.day, due, paid, short });
  s.paidThisWeek = 0;
  return { due, paid, short, fee, overdue: s.overdue?.amount ?? 0, repossess, paidOff: s.debt <= 0 };
}

export interface DeadlineResult {
  owed: number;
  paid: number;
  repossess: boolean;
}

/** Monday 17:00: whatever is still overdue is taken; anything left unpaid means repossession. */
export function overdueDeadline(s: GameState): DeadlineResult | null {
  if (!s.overdue || s.day < s.overdue.deadlineDay) return null;
  const owed = s.overdue.amount;
  const paid = payDebt(s, owed);
  const repossess = !!s.overdue && s.overdue.amount > 0.004;
  return { owed, paid, repossess };
}

/** For the HUD: 0 = fine, 1 = a bit short, 2 = far short. */
export function paymentPressure(s: GameState): 0 | 1 | 2 {
  if (s.overdue) return 2;
  const due = dueNow(s);
  if (due <= 0 || s.money >= due) return 0;
  const daysLeft = (6 - ((s.day - 1) % 7) + 7) % 7;
  if (daysLeft >= 3) return 1;
  return s.money >= due * 0.6 && daysLeft >= 1 ? 1 : 2;
}

export function spend(s: GameState, amount: number): boolean {
  if (s.money < amount) return false;
  s.money = round2(s.money - amount);
  s.week.spent = round2(s.week.spent + amount);
  return true;
}

export { holdLbs };
