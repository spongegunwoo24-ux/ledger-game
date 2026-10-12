import { TUNING } from '../config/tuning';
import { cumulativeDue, isPaymentDay, paymentDueForWeek, weekOf } from '../core/calendar';
import type { CatchHold, GameState } from '../core/state';
import type { SortTally } from './sorting';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function addTallyToHold(s: GameState, t: SortTally): void {
  s.hold.small = round2(s.hold.small + t.lbs.small);
  s.hold.medium = round2(s.hold.medium + t.lbs.medium);
  s.hold.large = round2(s.hold.large + t.lbs.large);
  s.hold.crabs += t.crabs;
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
  return { seller, lbs, crabs, total: round2(total), oversupplyLbs: round2(oversupplyLbs) };
}

export function executeSale(s: GameState, q: SaleQuote): number {
  s.hold.small = round2(s.hold.small - q.lbs.small);
  s.hold.medium = round2(s.hold.medium - q.lbs.medium);
  s.hold.large = round2(s.hold.large - q.lbs.large);
  s.hold.crabs -= q.crabs;
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

export const paidTotal = (s: GameState) => TUNING.debt.total - s.debt;

/** What still has to be paid this Friday to be on schedule (0 if prepaid). */
export function dueNow(s: GameState): number {
  if (s.debt <= 0) return 0;
  const w = weekOf(s.day);
  if (w > TUNING.debt.lastPaymentWeek) return 0;
  return Math.max(0, Math.min(s.debt, cumulativeDue(w) - paidTotal(s)));
}

export function thisWeekScheduled(s: GameState): number {
  return paymentDueForWeek(weekOf(s.day));
}

/** Pay toward the debt (prepayment or Friday). Returns the amount actually paid. */
export function payDebt(s: GameState, amount: number): number {
  const pay = round2(Math.max(0, Math.min(amount, s.money, s.debt)));
  s.money = round2(s.money - pay);
  s.debt = round2(s.debt - pay);
  s.paidThisWeek = round2(s.paidThisWeek + pay);
  s.week.paid = round2(s.week.paid + pay);
  if (s.debt <= 0 && !s.flags.debtPaidOffDay) s.flags.debtPaidOffDay = s.day;
  return pay;
}

export function gusCanOffer(s: GameState): boolean {
  const g = TUNING.gusCan;
  if (s.flags.gusCanOffered) return false;
  if (s.day < g.firstDay || s.day > g.lastDay) return false;
  if (!isPaymentDay(s.day)) return false;
  const due = dueNow(s);
  return due > 0 && s.money < due * g.thresholdRatio;
}

export interface FridayResult {
  due: number;
  paid: number;
  short: number;
  /** total paid this week including prepayments */
  weekPaid: number;
  extensionGranted: boolean;
  zeroStreak: number;
  warning: 0 | 1 | 2;
  repossess: boolean;
  paidOff: boolean;
}

/** Automatic Friday payment at the end of the afternoon. */
export function fridayPayment(s: GameState): FridayResult {
  const due = dueNow(s);
  const paid = payDebt(s, due);
  const short = round2(due - paid);
  const weekPaid = s.paidThisWeek;
  let extensionGranted = false;
  if (short > 0 && !s.extensionUsed) {
    s.extensionUsed = true;
    extensionGranted = true;
  }
  if (due > 0 && weekPaid <= 0 && !extensionGranted) s.zeroStreak += 1;
  else if (weekPaid > 0 || due <= 0) s.zeroStreak = 0;
  s.payments.push({ day: s.day, due, paid, short });
  s.paidThisWeek = 0;
  const z = s.zeroStreak;
  return {
    due,
    paid,
    short,
    weekPaid,
    extensionGranted,
    zeroStreak: z,
    warning: z === 1 ? 1 : z === 2 ? 2 : 0,
    repossess: z >= TUNING.debt.repossessZeroFridays,
    paidOff: s.debt <= 0,
  };
}

export function spend(s: GameState, amount: number): boolean {
  if (s.money < amount) return false;
  s.money = round2(s.money - amount);
  s.week.spent = round2(s.week.spent + amount);
  return true;
}

export { holdLbs };
