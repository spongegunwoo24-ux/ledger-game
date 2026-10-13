import { check } from '../core/conditions';
import { SNAG_PER_MINUTE, TUNING } from '../config/tuning';
import { moonOf, tideOf, weatherOf } from '../core/calendar';
import { hash32, makeRng, pick, range, type Rng } from '../core/rng';
import type { GameState } from '../core/state';
import type { GroundId, ShrimpSize } from '../core/types';
import { CURIOSITIES, SHRIMP_SPECIES, STORY_CATCH, TRASH_VARIANTS, type CatchItem } from '../data/catch';
import { fishDef } from '../data/fish';
import { pickFish, rollSize } from './fishSpawn';
import { conditionMultiplier, groundDef, type Conditions } from '../data/grounds';

export function conditionsFor(day: number, seed: number): Conditions {
  return {
    tide: tideOf(day, seed),
    moon: moonOf(day),
    weather: weatherOf(day, seed),
    rainedYesterday: day > 1 && weatherOf(day - 1, seed) === '비',
  };
}

/** [변경 1] Net fill 0..1 after `minutes` of towing (game minutes). */
export function towCurve(minutes: number): number {
  const m = Math.max(0, minutes);
  return Math.min(1, m / TUNING.trawl.netFullMinutes) ** 0.85;
}

/** Snag probability for one game minute of towing at minute `t`. */
export function snagChancePerMinute(ground: GroundId, t: number): number {
  const g = groundDef(ground);
  const over = t - TUNING.trawl.snagGraceMinutes;
  if (over <= 0) return 0;
  return SNAG_PER_MINUTE[g.snag] * (over / TUNING.trawl.snagRampMinutes);
}

export interface NetFish {
  id: string;
  inches: number;
}

export interface HaulOptions {
  ground: GroundId;
  /** game minutes the net was down */
  minutes: number;
  conditions: Conditions;
  netTornAtStart: boolean;
  snagged: boolean;
  /** 0..1 loss fraction if snagged */
  snagLoss: number;
  day: number;
  /** haul index within the trip (0 = first); story items only appear in the first */
  towIndex: number;
  rng: Rng;
  /** story item ids already obtained (never duplicated) */
  storyTaken: string[];
  /** [변경 2] story items to put in this tow (from storyCatchFor) */
  storyItems?: string[];
  /** fish that actually swam into the net (sea scene); generated from the spawn table when omitted */
  netFish?: NetFish[];
  /** Ledger's dive marked this ground */
  hot?: boolean;
}

let uidCounter = 1;
const nextUid = () => uidCounter++;

function pickSize(rng: Rng, mix: { small: number; medium: number; large: number }): ShrimpSize {
  const r = rng() * (mix.small + mix.medium + mix.large);
  if (r < mix.small) return 'small';
  if (r < mix.small + mix.medium) return 'medium';
  return 'large';
}

/** Builds the deck items for one haul. */
/** [변경 2] condition-based story items (quest finds) that belong in a tow on this ground */
export function storyCatchFor(s: GameState, ground: GroundId): string[] {
  return STORY_CATCH.filter(
    (sc) => sc.day === undefined && sc.requires !== undefined && (!sc.ground || sc.ground === ground) && s.flags[`story_${sc.id}`] !== 'kept' && check(s, sc.requires),
  ).map((sc) => sc.id);
}

export function rollHaul(o: HaulOptions): CatchItem[] {
  const g = groundDef(o.ground);
  const rng = o.rng;
  const fill = towCurve(o.minutes);
  let mult = conditionMultiplier(o.ground, o.conditions) * range(rng, 0.9, 1.1) * (o.hot ? 1.15 : 1);
  if (o.netTornAtStart) mult *= TUNING.trawl.tornNetYieldMult;
  if (o.snagged) mult *= 1 - o.snagLoss;
  const keep = o.snagged ? 1 - o.snagLoss : 1;

  const items: CatchItem[] = [];
  const shrimpCount = Math.round(g.baseShrimp * fill * mult);
  for (let i = 0; i < shrimpCount; i++) {
    items.push({ uid: nextUid(), kind: 'shrimp', size: pickSize(rng, g.sizeMix), id: pick(rng, SHRIMP_SPECIES) });
  }
  if (fill > 0.4 && rng() < 0.04) items.push({ uid: nextUid(), kind: 'shrimp', size: 'large', id: 'pink', golden: true });

  const crabMult = o.ground === 'river' && o.conditions.rainedYesterday ? 1.5 : 1;
  const crabs = Math.round(range(rng, g.crabs[0], g.crabs[1] + 0.99) * fill * crabMult * keep);
  for (let i = 0; i < crabs; i++) items.push({ uid: nextUid(), kind: 'crab' });

  // fish: the ones that really swam in, or a draw from the same spawn table
  let netFish = o.netFish;
  if (!netFish) {
    netFish = [];
    const n = Math.round(range(rng, 0.6, 2.6) * Math.max(0.3, fill));
    const ctx = { place: o.ground, conditions: o.conditions, time: 300, minutesSinceSail: 60, day: o.day, hot: o.hot };
    for (let i = 0; i < n; i++) {
      const f = pickFish(rng, ctx, (d) => !!d.netProof);
      if (f) netFish.push({ id: f.id, inches: rollSize(rng, f) });
    }
  }
  for (const nf of netFish) if (rng() < keep) items.push({ uid: nextUid(), kind: 'fish', id: nf.id, inches: nf.inches });
  if (fill > 0.3 && rng() < 0.05) {
    const sh = fishDef('seahorse')!;
    items.push({ uid: nextUid(), kind: 'fish', id: 'seahorse', inches: rollSize(rng, sh) });
  }

  const trash = Math.round(range(rng, 1, 4) * Math.max(0.4, fill));
  for (let i = 0; i < trash; i++) items.push({ uid: nextUid(), kind: 'trash', id: pick(rng, TRASH_VARIANTS) });

  if (fill > 0.35 && rng() < 0.16) items.push({ uid: nextUid(), kind: 'turtle' });

  if (fill > 0.3 && rng() < 0.09) {
    items.push({ uid: nextUid(), kind: 'curio', id: pick(rng, CURIOSITIES).id });
  }

  if (o.towIndex === 0) {
    for (const sc of STORY_CATCH) {
      if (sc.day !== undefined && sc.day === o.day && !o.storyTaken.includes(sc.id)) items.push({ uid: nextUid(), kind: 'story', id: sc.id });
    }
  }
  for (const id of o.storyItems ?? []) if (!items.some((i) => i.kind === 'story' && i.id === id)) items.push({ uid: nextUid(), kind: 'story', id });

  // Keep the deck readable and fast: trim shrimp first if over the cap.
  while (items.length > TUNING.trawl.maxItemsPerTow) {
    const idx = items.findIndex((x) => x.kind === 'shrimp' && !x.golden);
    if (idx < 0) break;
    items.splice(idx, 1);
  }
  return items;
}

export type HaulGrade = '보통' | '풍어' | '대박' | '전설의 그물';

/** [변경 1] The grade shown when the net spills (addictive device 2). */
export function haulGrade(items: CatchItem[], ground: GroundId): HaulGrade {
  const g = groundDef(ground);
  const shrimp = items.filter((i) => i.kind === 'shrimp').length;
  const ratio = shrimp / Math.max(1, g.baseShrimp);
  const fishRarities = items.filter((i) => i.kind === 'fish' && i.id).map((i) => fishDef(i.id!)?.rarity);
  const golden = items.some((i) => i.golden);
  if (fishRarities.includes('veryRare') || (golden && ratio > 0.9)) return '전설의 그물';
  if (ratio > 1.0 || golden || fishRarities.includes('rare')) return '대박';
  if (ratio > 0.8) return '풍어';
  return '보통';
}

export function haulRng(s: GameState, towIndex: number): Rng {
  return makeRng(hash32(s.seed, 'haul', s.day, towIndex, s.today.trips));
}

/** The spot is locked until Day 67. */
export function theSpotOpen(s: GameState): boolean {
  return s.day >= 67;
}

/** gusSpot: Gus guides you there on Day 1 and Day 6 only, then it unlocks from Day 15. */
export function groundAvailable(s: GameState, id: GroundId): boolean {
  if (id === 'theSpot') return theSpotOpen(s);
  if (id === 'gusSpot') return s.day === 1 || s.day === 6 || s.day >= 15;
  return true;
}

/** Expected shrimp pounds of a haul — used by the economy simulation. */
export function expectedShrimpLbs(id: GroundId, minutes: number, c: Conditions): number {
  const g = groundDef(id);
  return g.baseShrimp * towCurve(minutes) * conditionMultiplier(id, c) * TUNING.trawl.lbsPerShrimpItem;
}
