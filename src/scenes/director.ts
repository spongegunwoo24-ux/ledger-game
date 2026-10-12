import type Phaser from 'phaser';
import { isPaymentDay } from '../core/calendar';
import { pendingEvents, type EventDef } from '../core/events';
import { G } from '../core/game';
import type { Segment } from '../core/types';
import { ALL_EVENTS } from '../data/events';

export const SEGMENT_SCENE: Record<Segment, string> = {
  dawn: 'Harbor',
  morning: 'Market',
  afternoon: 'Town',
  evening: 'Home',
  night: 'Summary',
};

const NEXT: Record<Segment, Segment> = {
  dawn: 'morning',
  morning: 'afternoon',
  afternoon: 'evening',
  evening: 'night',
  night: 'dawn',
};

export interface CutsceneData {
  eventId?: string;
  /** a generated scene: 'payment' */
  special?: string;
  then: 'segment' | 'endSegment' | 'location' | 'return';
  /** for 'return': scene to resume */
  returnTo?: string;
  returnData?: object;
  location?: string;
}

export function eventById(id: string): EventDef | undefined {
  return ALL_EVENTS.find((e) => e.id === id);
}

function go(from: Phaser.Scene, key: string, data?: object) {
  from.scene.start(key, data);
}

/** Enter the current segment: play pending start events, then the segment's main scene. */
export function enterSegment(from: Phaser.Scene): void {
  const s = G.state;
  const evs = pendingEvents(s, ALL_EVENTS, s.segment, 'start');
  if (evs.length) {
    go(from, 'Cutscene', { eventId: evs[0].id, then: 'segment' } satisfies CutsceneData);
    return;
  }
  go(from, SEGMENT_SCENE[s.segment]);
}

/** Finish the current segment: end events, Friday payment, then the next segment. */
export function endSegment(from: Phaser.Scene): void {
  const s = G.state;
  const evs = pendingEvents(s, ALL_EVENTS, s.segment, 'end');
  if (evs.length) {
    go(from, 'Cutscene', { eventId: evs[0].id, then: 'endSegment' } satisfies CutsceneData);
    return;
  }
  if (s.segment === 'afternoon' && isPaymentDay(s.day) && !s.flags[`paid_${s.day}`]) {
    go(from, 'Cutscene', { special: 'payment', then: 'endSegment' } satisfies CutsceneData);
    return;
  }
  s.segment = NEXT[s.segment];
  enterSegment(from);
}

/** Location events play when a node is entered in the afternoon. */
export function locationEvents(loc: string): EventDef[] {
  const s = G.state;
  return pendingEvents(s, ALL_EVENTS, s.segment, 'start', loc);
}
