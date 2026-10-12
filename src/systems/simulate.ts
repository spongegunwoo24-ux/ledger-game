import { TUNING } from '../config/tuning';
import { isMonday, isPaymentDay, isSunday } from '../core/calendar';
import { hash32, makeRng, type Rng } from '../core/rng';
import { newGame, type GameState } from '../core/state';
import type { GroundId } from '../core/types';
import { GROUNDS, isBest } from '../data/grounds';
import { fishDef } from '../data/fish';
import { addTallyToHold, executeSale, fridayPayment, gusCanOffer, overdueDeadline, payDebt, quoteSale, spend } from './economy';
import { conditionsFor, groundAvailable, rollHaul, snagChancePerMinute } from './fishing';
import { applyOvernight } from './overnight';
import { emptyTally, soldAs } from './sorting';

/**
 * [변경 1] Economy simulation over the new day structure: a morning at sea until 08:00 with
 * several net hauls, some rod fishing, sorting accuracy, Ledger theft, combo bonus,
 * and the Friday/Monday payment rules.
 */
export type Profile = 'poor' | 'average' | 'great';

interface ProfileDef {
  /** minutes the net stays down per haul */
  tow: number;
  /** minutes lost at the dock before sailing */
  dawdle: number;
  wrongBasket: number;
  stolenPerHaul: number;
  /** combo + freshness bonus as a share of shrimp value */
  comboBonus: number;
  /** average dollars per morning from the rod */
  rodDollars: number;
  /** dollars of bait bought for the rod each morning */
  rodBait: number;
  restDays: number[]; // weekday indexes (0 = Sat)
  smartGround: boolean;
  acceptsGusMoney: boolean;
  useMarket: boolean;
  rosaFromWeek: number;
  dailySpend: number;
  prepayAbove: number | null;
}

export const PROFILES: Record<Profile, ProfileDef> = {
  poor: {
    tow: 40,
    dawdle: 50,
    wrongBasket: 0.3,
    stolenPerHaul: 7,
    comboBonus: 0,
    rodDollars: 0,
    rodBait: 0,
    restDays: [1],
    smartGround: false,
    acceptsGusMoney: true,
    useMarket: false,
    rosaFromWeek: 99,
    dailySpend: 0,
    prepayAbove: null,
  },
  average: {
    tow: 62,
    dawdle: 20,
    wrongBasket: 0.1,
    stolenPerHaul: 4,
    comboBonus: 0.05,
    rodDollars: 14,
    rodBait: 6,
    restDays: [1],
    smartGround: true,
    acceptsGusMoney: false,
    useMarket: false,
    rosaFromWeek: 99,
    dailySpend: 2,
    prepayAbove: null,
  },
  great: {
    tow: 66,
    dawdle: 10,
    wrongBasket: 0.04,
    stolenPerHaul: 2,
    comboBonus: 0.08,
    rodDollars: 22,
    rodBait: 9,
    restDays: [1],
    smartGround: true,
    acceptsGusMoney: false,
    useMarket: true,
    rosaFromWeek: 4,
    dailySpend: 4,
    prepayAbove: 150,
  },
};

const HARBOR = { x: 185, y: 627 };

function chooseGround(s: GameState, p: ProfileDef, rng: Rng): GroundId {
  const c = conditionsFor(s.day, s.seed);
  const options = GROUNDS.filter((g) => g.id !== 'theSpot' && groundAvailable(s, g.id));
  if (!p.smartGround) return options[Math.floor(rng() * options.length)].id;
  if (groundAvailable(s, 'gusSpot')) return 'gusSpot';
  const best = options.filter((g) => isBest(g.id, c) && g.snag !== 'high');
  if (best.length) return best.sort((a, b) => b.baseShrimp - a.baseShrimp)[0].id;
  return 'oyster';
}

function sailMinutes(g: GroundId): number {
  const d = GROUNDS.find((x) => x.id === g)!.pos;
  return Math.round((Math.hypot(d.x - HARBOR.x, d.y - HARBOR.y) / 100) * TUNING.clock.sailPer100px);
}

/** One simulated morning at sea using the real haul and sorting rules. */
function simulateMorning(s: GameState, p: ProfileDef, rng: Rng) {
  const ground = chooseGround(s, p, rng);
  let minutes = TUNING.clock.seaEnd - TUNING.clock.wake - p.dawdle - sailMinutes(ground);
  let haul = 0;
  while (minutes >= 20) {
    const tow = Math.min(p.tow, minutes);
    minutes -= tow + 6;
    let snagged = false;
    for (let t = 1; t <= tow; t++) {
      if (rng() < snagChancePerMinute(ground, t)) {
        snagged = true;
        break;
      }
    }
    const items = rollHaul({
      ground,
      minutes: tow,
      conditions: conditionsFor(s.day, s.seed),
      netTornAtStart: false,
      snagged,
      snagLoss: snagged ? 0.3 + rng() * 0.3 : 0,
      day: s.day,
      towIndex: haul,
      rng,
      storyTaken: [],
    });
    const t = emptyTally();
    let stolen = p.stolenPerHaul;
    let shrimpValue = 0;
    for (const it of items) {
      if (it.kind === 'shrimp') {
        if (it.golden) {
          t.golden++;
          continue;
        }
        if (stolen > 0 && rng() < 0.5) {
          stolen--;
          t.stolen++;
          continue;
        }
        const wrong = rng() < p.wrongBasket && it.size !== 'small';
        const bin = wrong ? (it.size === 'large' ? 'medium' : 'small') : it.size!;
        const sz = soldAs(it, bin);
        t.lbs[sz] += TUNING.trawl.lbsPerShrimpItem;
        shrimpValue += TUNING.prices[sz] * TUNING.trawl.lbsPerShrimpItem;
      } else if (it.kind === 'crab') t.crabs++;
      else if (it.kind === 'fish' && it.id && it.id !== 'pinfish' && fishDef(it.id)) t.fish.push({ id: it.id, inches: it.inches ?? 0 });
    }
    t.bonus = Math.round(shrimpValue * p.comboBonus * 100) / 100;
    addTallyToHold(s, t);
    haul++;
  }
  // rod: fish sold with the shrimp, bait bought at Hank's
  if (p.rodDollars > 0) {
    s.hold.bonus += p.rodDollars * (0.6 + rng() * 0.8);
    spend(s, Math.min(s.money, p.rodBait));
  }
  s.today.trips += 1;
  s.money -= TUNING.costs.fuel;
}

export interface SimResult {
  state: GameState;
  repossessed: boolean;
  paidOffDay: number | null;
  shortFridays: number;
  /** money left after each Friday payment */
  fridayMoney: number[];
  /** day of repossession, if any */
  repossessedDay: number | null;
  log: string[];
}

export function simulateSeason(profile: Profile, days = 63, seed = 12345): SimResult {
  const p = PROFILES[profile];
  const s = newGame(seed);
  s.day = 1;
  const rng = makeRng(hash32(seed, profile));
  const log: string[] = [];
  let repossessed = false;
  let short = 0;
  const fridayMoney: number[] = [];
  let repossessedDay: number | null = null;
  for (let d = 1; d <= days; d++) {
    s.day = d;
    const wd = (d - 1) % 7;
    if (Math.ceil(d / 7) >= p.rosaFromWeek) s.feelings.rosa = Math.max(s.feelings.rosa, 60);
    if (p.useMarket && Math.ceil(d / 7) >= 6) s.feelings.fishermen = Math.max(s.feelings.fishermen, 40);
    const fishes = d === 1 || !p.restDays.includes(wd) || (isSunday(d) && !p.restDays.includes(1));
    if (fishes) simulateMorning(s, p, rng);
    if (s.feelings.rosa >= 60) executeSale(s, quoteSale(s, 'rosa'));
    const marketOk = p.useMarket && Math.ceil(d / 7) >= 6;
    executeSale(s, quoteSale(s, marketOk ? 'market' : 'cannery'));
    spend(s, Math.min(p.dailySpend, Math.max(0, s.money - 20)));
    if (p.prepayAbove !== null && s.money > p.prepayAbove) payDebt(s, s.money - p.prepayAbove);
    if (isMonday(d) && s.overdue) {
      const r = overdueDeadline(s);
      log.push(`D${d} 연체 마감 ${r?.paid.toFixed(0)}/${r?.owed.toFixed(0)}`);
      if (r?.repossess) {
        repossessed = true;
        repossessedDay = d;
        log.push(`D${d} 압류`);
        break;
      }
    }
    if (isPaymentDay(d)) {
      if (gusCanOffer(s)) {
        s.flags.gusCanOffered = true;
        if (p.acceptsGusMoney) {
          s.money += TUNING.gusCan.amount;
          s.flags.tookGusMoney = true;
        }
      }
      const r = fridayPayment(s);
      if (r.short > 0) short++;
      fridayMoney.push(s.money);
      log.push(`D${d} 상환 ${r.paid.toFixed(0)}/${r.due.toFixed(0)} · 잔액 $${s.money.toFixed(0)} · 빚 $${s.debt.toFixed(0)}${r.short > 0 ? ` (부족 ${r.short.toFixed(0)})` : ''}`);
      if (r.repossess) {
        repossessed = true;
        repossessedDay = d;
        log.push(`D${d} 압류`);
        break;
      }
    }
    s.segment = 'night';
    applyOvernight(s);
  }
  const paidOffDay = typeof s.flags.debtPaidOffDay === 'number' ? (s.flags.debtPaidOffDay as number) : null;
  log.push(`결과: ${profile} · 압류 ${repossessed ? '예' : '아니오'} · 완납일 ${paidOffDay ?? '-'} · 총수입 $${s.totals.earned.toFixed(0)}`);
  return { state: s, repossessed, paidOffDay, shortFridays: short, fridayMoney, repossessedDay, log };
}
