import { TUNING } from '../config/tuning';
import { weekdayIndex } from '../core/calendar';
import { hash32, makeRng, pick, range } from '../core/rng';
import type { GameState } from '../core/state';
import type { FeelId, ShrimpSize } from '../core/types';
import { FISH } from '../data/fish';
import { feel } from './feelings';
import { heldFishPrice } from './economy';

/**
 * [변경 2] Harbor board (DESIGN §8.17 #4): today's orders and this week's fishermen ranking.
 * Orders are filled at the morning market from what is on ice. People who hate Eli get theirs
 * anonymously (through Dewey): paid, but no feeling change.
 */
export type OrderWant = { kind: 'shrimp'; size: ShrimpSize; lbs: number } | { kind: 'crabs'; n: number } | { kind: 'fish'; id: string };

export interface Order {
  idx: number;
  from: string;
  /** who it counts for (feelings); null = a business */
  who: FeelId | null;
  want: OrderWant;
  bonus: number;
}

const PEOPLE: { name: string; who: FeelId }[] = [
  { name: '로사 식당', who: 'rosa' },
  { name: '에이다 할머니', who: 'ada' },
  { name: '매슈 신부', who: 'matthew' },
  { name: '메이블', who: 'mabel' },
  { name: '노라 퀸', who: 'nora' },
  { name: '조앤 (메이지 엄마)', who: 'joanne' },
];

const SIZE_NAME: Record<ShrimpSize, string> = { small: '소', medium: '중', large: '대' };

export function todaysOrders(s: GameState): Order[] {
  if (s.day < 2) return [];
  const rng = makeRng(hash32(s.seed, 'orders', s.day));
  const out: Order[] = [];
  // the diner always wants big shrimp
  out.push({ idx: 0, from: '로사 식당', who: 'rosa', want: { kind: 'shrimp', size: rng() < 0.6 ? 'large' : 'medium', lbs: Math.round(range(rng, 5, 10)) }, bonus: 6 });
  if (rng() < 0.6) out.push({ idx: 1, from: '통조림 공장', who: null, want: { kind: 'crabs', n: Math.round(range(rng, 4, 9)) }, bonus: 5 });
  const fishable = FISH.filter((f) => (f.rarity === 'common' || f.rarity === 'uncommon') && !f.netOnly && f.places.some((p) => p !== 'any'));
  const p = pick(rng, PEOPLE.filter((x) => x.who !== 'rosa'));
  out.push({ idx: out.length, from: p.name, who: p.who, want: { kind: 'fish', id: pick(rng, fishable).id }, bonus: 8 });
  return out.map((o, i) => ({ ...o, idx: i }));
}

export function orderDone(s: GameState, o: Order): boolean {
  return !!s.flags[`order_${s.day}_${o.idx}`];
}

export function orderLabel(o: Order): string {
  const w = o.want;
  if (w.kind === 'shrimp') return `새우 ${SIZE_NAME[w.size]} ${w.lbs} lb`;
  if (w.kind === 'crabs') return `게 ${w.n}마리`;
  return `${FISH.find((f) => f.id === w.id)?.name.split(' · ')[0] ?? w.id} 1마리`;
}

/** money the order pays (what the truck would pay for the goods + the bonus), or null if the hold can't fill it */
export function orderValue(s: GameState, o: Order): number | null {
  const w = o.want;
  const p = TUNING.prices;
  let base = 0;
  if (w.kind === 'shrimp') {
    if (s.hold[w.size] + 0.001 < w.lbs) return null;
    base = w.lbs * p[w.size];
  } else if (w.kind === 'crabs') {
    if (s.hold.crabs < w.n) return null;
    base = w.n * p.crab;
  } else {
    const f = s.hold.fish.filter((x) => x.id === w.id).sort((a, b) => b.inches - a.inches)[0];
    if (!f) return null;
    base = heldFishPrice(s, f);
  }
  return Math.round((base + o.bonus) * 100) / 100;
}

/** Hated people still take the goods, but only anonymously. */
export function isAnonymous(s: GameState, o: Order): boolean {
  return o.who !== null && feel(s, o.who) < 20;
}

export function fillOrder(s: GameState, o: Order): number {
  const v = orderValue(s, o);
  if (v === null || orderDone(s, o)) return 0;
  const w = o.want;
  if (w.kind === 'shrimp') s.hold[w.size] = Math.round((s.hold[w.size] - w.lbs) * 100) / 100;
  else if (w.kind === 'crabs') s.hold.crabs -= w.n;
  else {
    const f = s.hold.fish.filter((x) => x.id === w.id).sort((a, b) => b.inches - a.inches)[0];
    s.hold.fish = s.hold.fish.filter((x) => x.uid !== f.uid);
  }
  s.flags[`order_${s.day}_${o.idx}`] = isAnonymous(s, o) ? 'anon' : true;
  if (o.who && !isAnonymous(s, o)) s.feelings[o.who] = Math.min(100, (s.feelings[o.who] ?? 0) + 3);
  s.money = Math.round((s.money + v) * 100) / 100;
  s.today.earned = Math.round((s.today.earned + v) * 100) / 100;
  s.week.earned = Math.round((s.week.earned + v) * 100) / 100;
  s.totals.earned = Math.round((s.totals.earned + v) * 100) / 100;
  return v;
}

// ---------------- ranking ----------------
const FISHERMEN: { name: string; perDay: number }[] = [
  { name: '행크 들라크루아', perDay: 58 },
  { name: '버드 리', perDay: 50 },
  { name: '레이 소토', perDay: 44 },
  { name: '오티스 그랜트', perDay: 40 },
  { name: '무어 형제', perDay: 36 },
  { name: '짐 테일러', perDay: 31 },
  // he is out at "his place" every dawn, and never seems to catch much there
  { name: '캘빈 쇼', perDay: 6 },
];

export interface RankRow {
  name: string;
  lbs: number;
  eli: boolean;
}

/** this week's pounds so far (Saturday = day 0 of the week) */
export function ranking(s: GameState): RankRow[] {
  const daysIn = weekdayIndex(s.day) + (s.segment === 'dawn' ? 0 : 1);
  const rows: RankRow[] = FISHERMEN.map((f, i) => {
    let lbs = 0;
    for (let d = 0; d < daysIn; d++) {
      const r = makeRng(hash32(s.seed, 'rank', s.day - weekdayIndex(s.day) + d, i));
      lbs += f.perDay * range(r, 0.7, 1.25);
    }
    return { name: f.name, lbs: Math.round(lbs), eli: false };
  });
  rows.push({ name: '일라이 할로우', lbs: Math.round(s.week.lbsCaught), eli: true });
  return rows.sort((a, b) => b.lbs - a.lbs);
}

export function eliRank(s: GameState): number {
  return ranking(s).findIndex((r) => r.eli) + 1;
}

/** Eli's name on the board is scribbled out until the fishermen stop hating him or he climbs high */
export function eliNameScribbled(s: GameState): boolean {
  return feel(s, 'fishermen') < 40 && !s.flags.rankTop3;
}

/** Friday night: the week's ranking counts. Returns notes for the summary. */
export function settleWeekRanking(s: GameState): string[] {
  const r = eliRank(s);
  const notes: string[] = [];
  if (r <= 3) {
    s.flags.rankTop3 = true;
    s.feelings.fishermen = Math.min(100, (s.feelings.fishermen ?? 0) + 3);
    notes.push(`어부 순위 ${r}위`);
  }
  if (r === 1 && !s.flags.hankAsked) s.flags.hankAskPending = true;
  return notes;
}
