import { weekOf } from '../core/calendar';
import type { Rng } from '../core/rng';
import type { GroundId } from '../core/types';
import type { Conditions } from '../data/grounds';
import { FISH, RARITY_WEIGHT, type FishDef, type FishPlace } from '../data/fish';

/** [변경 1] The shared spawn table for the net and the rod (DESIGN §8.14). */
export interface SpawnContext {
  place: FishPlace;
  conditions: Conditions;
  /** clock minutes */
  time: number;
  minutesSinceSail: number;
  day: number;
  /** Ledger's dive marked this ground today (richer spawns) */
  hot?: boolean;
  /** [변경 2] land spots also see fish of the water next to them */
  also?: FishPlace[];
}

export function placeMatches(f: FishDef, place: FishPlace, also: FishPlace[] = []): boolean {
  if (also.some((p) => placeMatches(f, p))) return true;
  const sea: GroundId[] = ['oyster', 'sandbar', 'wreck', 'river', 'channel', 'gusSpot'];
  return f.places.includes(place) || (f.places.includes('any') && sea.includes(place as GroundId));
}

export function condMatches(f: FishDef, c: SpawnContext): boolean {
  const k = f.cond;
  const w = weekOf(c.day);
  if (k.tide && c.conditions.tide !== k.tide) return false;
  if (k.weather && !k.weather.includes(c.conditions.weather)) return false;
  if (k.notWeather && k.notWeather.includes(c.conditions.weather)) return false;
  if (k.moon && c.conditions.moon !== k.moon) return false;
  if (k.rainedYesterday && !c.conditions.rainedYesterday) return false;
  if (k.before !== undefined && c.time >= k.before) return false;
  if (k.withinMinutesOfSailing !== undefined && c.minutesSinceSail > k.withinMinutesOfSailing) return false;
  if (k.minWeek !== undefined && w < k.minWeek) return false;
  if (k.maxWeek !== undefined && w > k.maxWeek) return false;
  return true;
}

export function eligibleFish(c: SpawnContext, opts: { includeNetOnly?: boolean } = {}): FishDef[] {
  return FISH.filter((f) => (opts.includeNetOnly || !f.netOnly) && placeMatches(f, c.place, c.also) && condMatches(f, c));
}

export function spawnWeight(f: FishDef, c: SpawnContext): number {
  let w = RARITY_WEIGHT[f.rarity] * (f.cond.chance ?? 1);
  if (c.hot && (f.rarity === 'rare' || f.rarity === 'veryRare' || f.rarity === 'legendary')) w *= 2;
  return w;
}

export function pickFish(rng: Rng, c: SpawnContext, exclude: (f: FishDef) => boolean = () => false): FishDef | null {
  const list = eligibleFish(c).filter((f) => !exclude(f));
  if (!list.length) return null;
  const total = list.reduce((s, f) => s + spawnWeight(f, c), 0);
  let r = rng() * total;
  for (const f of list) {
    r -= spawnWeight(f, c);
    if (r < 0) return f;
  }
  return list[list.length - 1];
}

/** Length in inches, biased toward the middle of the range. */
export function rollSize(rng: Rng, f: FishDef): number {
  const t = (rng() + rng()) / 2;
  return Math.round((f.size[0] + (f.size[1] - f.size[0]) * t) * 10) / 10;
}
