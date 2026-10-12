import type { Cond } from './conditions';
import { check } from './conditions';
import type { Effect } from './effects';
import type { GameState } from './state';
import type { CharId, LocId, Mood, Point, Segment } from './types';

export type BackdropKey =
  | 'cemetery'
  | 'bank'
  | 'dock'
  | 'dockDusk'
  | 'deck'
  | 'diner'
  | 'church'
  | 'home'
  | 'homeNight'
  | 'wheelhouse'
  | 'sheriff'
  | 'fishMarket'
  | 'secondhand'
  | 'pawn'
  | 'pharmacy'
  | 'calvinCabin'
  | 'calvinYard'
  | 'gusHouse'
  | 'edithHouse'
  | 'board'
  | 'lighthouse'
  | 'dunes'
  | 'boathouse'
  | 'courthouse'
  | 'sea'
  | 'black';

export type MinigameId = 'knot' | 'paint' | 'carry' | 'search' | 'photo';

export interface ChoiceOption {
  text: string;
  then?: Step[];
  effects?: Effect[];
  /** stores the line so Calvin can quote it back later (D05) */
  remember?: string;
  cond?: Cond | Cond[];
}

export type Step =
  | { t: 'say'; who: CharId; text: string; mood?: Mood }
  | { t: 'think'; text: string }
  | { t: 'narrate'; text: string }
  | { t: 'choice'; options: ChoiceOption[] }
  | { t: 'move'; who: CharId; to: Point; ms?: number }
  | { t: 'camera'; to: Point; zoom?: number; ms?: number }
  | { t: 'fade'; dir: 'in' | 'out'; ms?: number }
  | { t: 'sfx'; id: string }
  | { t: 'music'; id: string | null }
  | { t: 'wait'; ms: number }
  | { t: 'effect'; effects: Effect[] }
  | { t: 'showItem'; item: string; caption?: string }
  | { t: 'bg'; key: BackdropKey; tint?: Segment }
  | { t: 'enter'; who: CharId; at: Point; face?: 1 | -1 }
  | { t: 'exit'; who: CharId; to?: Point; ms?: number }
  | { t: 'if'; cond: Cond | Cond[]; then: Step[]; else?: Step[] }
  | { t: 'minigame'; id: MinigameId; params?: Record<string, unknown> }
  | { t: 'card'; title: string; sub?: string }
  | { t: 'letter'; title?: string; text: string }
  | { t: 'shake'; who: CharId }
  | { t: 'notes'; who: CharId; on: boolean }
  | { t: 'face'; who: CharId; dir: 1 | -1 };

export interface Trigger {
  day?: number;
  /** inclusive [from, to] */
  days?: [number, number];
  segment: Segment;
  /** 'start' (default) plays when the segment begins, 'end' when it finishes */
  when?: 'start' | 'end';
  location?: LocId;
  requires?: Cond | Cond[];
  /** defaults to true */
  once?: boolean;
}

export interface ActorPlacement {
  who: CharId;
  at: Point;
  face?: 1 | -1;
}

export type NextScene =
  | { scene: 'Trawl'; ground: string; tutorial?: boolean }
  | { scene: 'Harbor' }
  | { scene: 'Title' };

export interface EventDef {
  id: string;
  trigger: Trigger;
  bg: BackdropKey;
  tint?: Segment;
  actors?: ActorPlacement[];
  steps: Step[];
  /** after the event, continue with this scene instead of the normal segment flow */
  next?: NextScene;
  /** priority among events in the same slot (lower first) */
  order?: number;
}

export function eventMatches(
  s: GameState,
  ev: EventDef,
  segment: Segment,
  when: 'start' | 'end',
  location?: string,
): boolean {
  const tr = ev.trigger;
  if (tr.segment !== segment) return false;
  if ((tr.when ?? 'start') !== when) return false;
  if ((tr.location ?? undefined) !== location) return false;
  if (tr.day !== undefined && tr.day !== s.day) return false;
  if (tr.days && (s.day < tr.days[0] || s.day > tr.days[1])) return false;
  if ((tr.once ?? true) && s.eventsDone.includes(ev.id)) return false;
  if (!check(s, tr.requires)) return false;
  return true;
}

export function pendingEvents(
  s: GameState,
  all: EventDef[],
  segment: Segment,
  when: 'start' | 'end' = 'start',
  location?: string,
): EventDef[] {
  return all
    .filter((e) => eventMatches(s, e, segment, when, location))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Collect every say/narrate/think/choice text in a step list (for content tests). */
export function collectTexts(steps: Step[], out: string[] = []): string[] {
  for (const st of steps) {
    switch (st.t) {
      case 'say':
      case 'think':
      case 'narrate':
        out.push(st.text);
        break;
      case 'letter':
        out.push(st.text);
        break;
      case 'card':
        out.push(st.title);
        if (st.sub) out.push(st.sub);
        break;
      case 'showItem':
        if (st.caption) out.push(st.caption);
        break;
      case 'choice':
        for (const o of st.options) {
          out.push(o.text);
          if (o.then) collectTexts(o.then, out);
        }
        break;
      case 'if':
        collectTexts(st.then, out);
        if (st.else) collectTexts(st.else, out);
        break;
      default:
        break;
    }
  }
  return out;
}
