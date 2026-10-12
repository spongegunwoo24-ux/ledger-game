import { TUNING } from '../config/tuning';
import { isPaymentDay, isSunday, weekOf } from '../core/calendar';
import { hash32, makeRng, type Rng } from '../core/rng';
import { newGame, type GameState } from '../core/state';
import type { GroundId } from '../core/types';
import { GROUNDS, isBest } from '../data/grounds';
import { addTallyToHold, executeSale, fridayPayment, gusCanOffer, payDebt, quoteSale, spend } from './economy';
import { conditionsFor, groundAvailable, rollHaul, snagChancePerSecond } from './fishing';
import { applyOvernight } from './overnight';
import { emptyTally, soldAs } from './sorting';

export type Profile = 'poor' | 'average' | 'great';

interface ProfileDef {
  towSeconds: number;
  wrongBasket: number;
  stolenPerTrip: number;
  restDays: number[]; // weekday indexes (0 = Sat) on which they don't fish
  smartGround: boolean;
  acceptsGusMoney: boolean;
  useMarket: boolean;
  rosaFromWeek: number;
  dailySpend: number;
  prepayAbove: number | null;
}

export const PROFILES: Record<Profile, ProfileDef> = {
  poor: {
    towSeconds: 38,
    wrongBasket: 0.3,
    stolenPerTrip: 8,
    restDays: [1, 4],
    smartGround: false,
    acceptsGusMoney: true,
    useMarket: false,
    rosaFromWeek: 99,
    dailySpend: 4,
    prepayAbove: null,
  },
  average: {
    towSeconds: 68,
    wrongBasket: 0.1,
    stolenPerTrip: 4,
    restDays: [1],
    smartGround: true,
    acceptsGusMoney: false,
    useMarket: false,
    rosaFromWeek: 99,
    dailySpend: 8,
    prepayAbove: null,
  },
  great: {
    towSeconds: 82,
    wrongBasket: 0.02,
    stolenPerTrip: 1,
    restDays: [],
    smartGround: true,
    acceptsGusMoney: false,
    useMarket: true,
    rosaFromWeek: 3,
    dailySpend: 12,
    prepayAbove: 150,
  },
};

function chooseGround(s: GameState, p: ProfileDef, rng: Rng): GroundId {
  const c = conditionsFor(s.day, s.seed);
  const options = GROUNDS.filter((g) => g.id !== 'theSpot' && groundAvailable(s, g.id));
  if (!p.smartGround) return options[Math.floor(rng() * options.length)].id;
  if (groundAvailable(s, 'gusSpot')) return 'gusSpot';
  const best = options.filter((g) => isBest(g.id, c) && g.snag !== 'high');
  if (best.length) return best.sort((a, b) => b.baseShrimp - a.baseShrimp)[0].id;
  return 'oyster';
}

/** One simulated fishing trip + sort, using the real fishing and sorting systems. */
function simulateTrip(s: GameState, p: ProfileDef, rng: Rng) {
  const ground = chooseGround(s, p, rng);
  let snagged = false;
  for (let t = 1; t <= p.towSeconds; t++) {
    if (rng() < snagChancePerSecond(ground, t)) {
      snagged = true;
      break;
    }
  }
  const loss = snagged ? 0.3 + rng() * 0.3 : 0;
  const items = rollHaul({
    ground,
    seconds: p.towSeconds,
    conditions: conditionsFor(s.day, s.seed),
    netTornAtStart: s.netTorn,
    snagged,
    snagLoss: loss,
    day: s.day,
    towIndex: 0,
    rng,
    storyTaken: [],
  });
  if (snagged) s.netTorn = true;
  else if (s.netTorn) s.netTorn = false; // repaired in the afternoon at the dock
  const t = emptyTally();
  let stolen = p.stolenPerTrip;
  for (const it of items) {
    if (it.kind === 'shrimp') {
      if (stolen > 0 && rng() < 0.5) {
        stolen--;
        t.stolen++;
        continue;
      }
      const wrong = rng() < p.wrongBasket && it.size !== 'small';
      const bin = wrong ? (it.size === 'large' ? 'medium' : 'small') : it.size!;
      t.lbs[soldAs(it, bin)] += TUNING.trawl.lbsPerShrimpItem;
    } else if (it.kind === 'crab') t.crabs++;
  }
  addTallyToHold(s, t);
  s.today.trips += 1;
  s.money -= TUNING.costs.fuel;
}

export interface SimResult {
  state: GameState;
  repossessed: boolean;
  paidOffDay: number | null;
  missedFridays: number;
  log: string[];
}

export function simulateSeason(profile: Profile, days = 63, seed = 12345): SimResult {
  const p = PROFILES[profile];
  const s = newGame(seed);
  s.day = 1;
  const rng = makeRng(hash32(seed, profile));
  const log: string[] = [];
  let repossessed = false;
  let missed = 0;
  // Rosa's trust grows through her quest for players who do it
  for (let d = 1; d <= days; d++) {
    s.day = d;
    const wd = (d - 1) % 7;
    if (weekOf(d) >= p.rosaFromWeek) s.feelings.rosa = Math.max(s.feelings.rosa, 60);
    if (p.useMarket && weekOf(d) >= 6) s.feelings.fishermen = Math.max(s.feelings.fishermen, 40);
    const fishes = d === 1 || !p.restDays.includes(wd) || (isSunday(d) && !p.restDays.includes(1));
    if (fishes) simulateTrip(s, p, rng);
    // sell (morning): Rosa first, then market or cannery
    if (s.feelings.rosa >= 60) executeSale(s, quoteSale(s, 'rosa'));
    const marketOk = p.useMarket && weekOf(d) >= 6;
    executeSale(s, quoteSale(s, marketOk ? 'market' : 'cannery'));
    spend(s, Math.min(p.dailySpend, Math.max(0, s.money - 20)));
    if (p.prepayAbove !== null && s.money > p.prepayAbove) payDebt(s, s.money - p.prepayAbove);
    if (isPaymentDay(d)) {
      if (gusCanOffer(s)) {
        s.flags.gusCanOffered = true;
        if (p.acceptsGusMoney) {
          s.money += TUNING.gusCan.amount;
          s.flags.tookGusMoney = true;
        }
      }
      const r = fridayPayment(s);
      if (r.short > 0) missed++;
      log.push(`D${d} 납부 ${r.paid.toFixed(0)}/${r.due.toFixed(0)} · 잔액 $${s.money.toFixed(0)} · 빚 $${s.debt.toFixed(0)}${r.extensionGranted ? ' (연장)' : ''}${r.warning ? ` (경고${r.warning})` : ''}`);
      if (r.repossess) {
        repossessed = true;
        log.push(`D${d} 압류`);
        break;
      }
    }
    s.segment = 'night';
    applyOvernight(s);
  }
  const paidOffDay = typeof s.flags.debtPaidOffDay === 'number' ? (s.flags.debtPaidOffDay as number) : null;
  log.push(`결과: ${profile} · 압류 ${repossessed ? '예' : '아니오'} · 완납일 ${paidOffDay ?? '-'} · 총수입 $${s.totals.earned.toFixed(0)}`);
  return { state: s, repossessed, paidOffDay, missedFridays: missed, log };
}
