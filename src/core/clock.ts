import { TUNING } from '../config/tuning';
import type { GameState } from './state';
import type { Segment } from './types';

/**
 * [변경 1] The day clock. Time is minutes since midnight in `state.time`.
 * Scenes call `tickClock` every frame with their speed; anything modal
 * (dialogue, menus, minigames, letters, sorting) holds the clock.
 */
const holds = new Set<object>();

/** Something modal is open (dialogue, menu, overlay). Pass a token and release it later. */
export function holdClock(token: object): void {
  holds.add(token);
}

export function releaseClock(token: object): void {
  holds.delete(token);
}

/** Every scene start clears stale holds (see core/view.initView). */
export function resetClockHolds(): void {
  holds.clear();
}

export function clockHeld(): boolean {
  return holds.size > 0;
}

export type ClockMode = 'sea' | 'land';

/** Advances the clock; returns the minutes advanced (0 when held). */
export function tickClock(s: GameState, deltaMs: number, mode: ClockMode, limit?: number): number {
  if (holds.size > 0) return 0;
  const rate = mode === 'sea' ? TUNING.clock.seaSpeed : TUNING.clock.landSpeed;
  const before = s.time;
  let t = s.time + (deltaMs / 1000) * rate;
  if (limit !== undefined) t = Math.min(t, limit);
  s.time = t;
  return t - before;
}

export function fmtTime(min: number): string {
  const m = Math.floor(min) % (24 * 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Clock value at the start of each segment. */
export function segmentStartTime(seg: Segment, day: number): number {
  const c = TUNING.clock;
  switch (seg) {
    case 'dawn':
      return c.wake;
    case 'morning':
      return day === 1 ? 10 * 60 : c.seaEnd;
    case 'afternoon':
      return day === 1 ? 13 * 60 : c.afternoon;
    case 'evening':
      return c.dusk;
    case 'night':
      return c.night;
  }
}

/** When the sea time ends today (Day 1's tutorial trip is an afternoon trip). */
export function seaEndTime(day: number): number {
  return day === 1 ? 16 * 60 : TUNING.clock.seaEnd;
}

export function crossed(before: number, after: number, mark: number): boolean {
  return before < mark && after >= mark;
}

/** [변경 1] small label under the clock, from the actual time of day */
export function timeOfDayLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  if (h < 4) return '밤';
  if (h < 8) return '새벽';
  if (h < 12) return '오전';
  if (h < 19) return '오후';
  return '저녁';
}
