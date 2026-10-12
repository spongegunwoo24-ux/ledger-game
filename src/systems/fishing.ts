import { SNAG_PER_SECOND, TUNING } from '../config/tuning';
import { moonOf, tideOf, weatherOf } from '../core/calendar';
import { hash32, makeRng, pick, range, type Rng } from '../core/rng';
import type { GameState } from '../core/state';
import type { GroundId, ShrimpSize } from '../core/types';
import {
  CURIOSITIES,
  FISH_VARIANTS,
  STORY_CATCH,
  TRASH_VARIANTS,
  type CatchItem,
} from '../data/catch';
import { conditionMultiplier, groundDef, type Conditions } from '../data/grounds';

export function conditionsFor(day: number, seed: number): Conditions {
  return {
    tide: tideOf(day, seed),
    moon: moonOf(day),
    weather: weatherOf(day, seed),
    rainedYesterday: day > 1 && weatherOf(day - 1, seed) === '비',
  };
}

/** 0..1 — how full the net gets after `seconds` of towing. */
export function towCurve(seconds: number): number {
  return 1 - Math.exp(-Math.max(0, seconds) / TUNING.trawl.tau);
}

/** Snag probability for one second of towing at time `t`. */
export function snagChancePerSecond(ground: GroundId, t: number): number {
  const g = groundDef(ground);
  const over = t - TUNING.trawl.snagGraceSeconds;
  if (over <= 0) return 0;
  return SNAG_PER_SECOND[g.snag] * (over / TUNING.trawl.snagRampSeconds);
}

export interface HaulOptions {
  ground: GroundId;
  seconds: number;
  conditions: Conditions;
  netTornAtStart: boolean;
  snagged: boolean;
  /** 0..1 loss fraction if snagged */
  snagLoss: number;
  day: number;
  /** tow index within the trip (0 = first); story items only appear in the first tow */
  towIndex: number;
  rng: Rng;
  /** story item ids already obtained (never duplicated) */
  storyTaken: string[];
}

let uidCounter = 1;
const nextUid = () => uidCounter++;

function pickSize(rng: Rng, mix: { small: number; medium: number; large: number }): ShrimpSize {
  const r = rng() * (mix.small + mix.medium + mix.large);
  if (r < mix.small) return 'small';
  if (r < mix.small + mix.medium) return 'medium';
  return 'large';
}

/** Builds the deck items for one tow. */
export function rollHaul(o: HaulOptions): CatchItem[] {
  const g = groundDef(o.ground);
  const rng = o.rng;
  const fill = towCurve(o.seconds);
  let mult = conditionMultiplier(o.ground, o.conditions) * range(rng, 0.9, 1.1);
  if (o.netTornAtStart) mult *= TUNING.trawl.tornNetYieldMult;
  if (o.snagged) mult *= 1 - o.snagLoss;

  const items: CatchItem[] = [];
  const shrimpCount = Math.round(g.baseShrimp * fill * mult);
  for (let i = 0; i < shrimpCount; i++) {
    items.push({ uid: nextUid(), kind: 'shrimp', size: pickSize(rng, g.sizeMix) });
  }

  const crabMult = o.ground === 'river' && o.conditions.rainedYesterday ? 1.5 : 1;
  const crabs = Math.round(range(rng, g.crabs[0], g.crabs[1] + 0.99) * fill * crabMult * (o.snagged ? 1 - o.snagLoss : 1));
  for (let i = 0; i < crabs; i++) items.push({ uid: nextUid(), kind: 'crab' });

  const fish = Math.round(range(rng, 3, 7) * Math.max(0.3, fill));
  for (let i = 0; i < fish; i++) items.push({ uid: nextUid(), kind: 'fish', id: pick(rng, FISH_VARIANTS) });

  const trash = Math.round(range(rng, 1, 4) * Math.max(0.4, fill));
  for (let i = 0; i < trash; i++) items.push({ uid: nextUid(), kind: 'trash', id: pick(rng, TRASH_VARIANTS) });

  if (fill > 0.35 && rng() < 0.16) items.push({ uid: nextUid(), kind: 'turtle' });

  if (fill > 0.3 && rng() < 0.09) {
    items.push({ uid: nextUid(), kind: 'curio', id: pick(rng, CURIOSITIES).id });
  }

  if (o.towIndex === 0) {
    for (const sc of STORY_CATCH) {
      if (sc.day === o.day && !o.storyTaken.includes(sc.id)) items.push({ uid: nextUid(), kind: 'story', id: sc.id });
    }
  }

  // Keep the deck readable and fast: trim shrimp first if over the cap.
  while (items.length > TUNING.trawl.maxItemsPerTow) {
    const idx = items.findIndex((x) => x.kind === 'shrimp');
    if (idx < 0) break;
    items.splice(idx, 1);
  }
  return items;
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

/** Expected value of a tow — used by the economy simulation. */
export function expectedShrimpLbs(id: GroundId, seconds: number, c: Conditions): number {
  const g = groundDef(id);
  return g.baseShrimp * towCurve(seconds) * conditionMultiplier(id, c) * TUNING.trawl.lbsPerShrimpItem;
}
