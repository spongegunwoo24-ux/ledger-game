import { check } from '../core/conditions';
import { applyEffects } from '../core/effects';
import type { GameState } from '../core/state';
import type { LocId, Segment } from '../core/types';
import { QUESTS } from '../data/quests';
import type { QuestDef, QuestStepDef } from '../data/quests/types';

export type QuestOp = 'start' | 'advance' | 'complete';

export function questDef(id: string): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function questOp(s: GameState, id: string, op: QuestOp): string | null {
  const def = questDef(id);
  if (!def) return null;
  if (op === 'start') {
    if (s.quests[id]) return null;
    s.quests[id] = { state: 'active', step: 0, progress: 0, startedDay: s.day, lastDay: -1 };
    return `새 할 일: ${def.title}`;
  }
  const q = s.quests[id];
  if (!q || q.state === 'done') return null;
  if (op === 'complete') {
    q.state = 'done';
    q.step = def.steps.length;
    applyEffects(s, def.complete);
    return `완료: ${def.title}`;
  }
  // advance
  const step = def.steps[q.step];
  if (step) applyEffects(s, step.effects);
  q.step += 1;
  q.progress = 0;
  q.lastDay = s.day;
  if (q.step >= def.steps.length) {
    q.state = 'done';
    applyEffects(s, def.complete);
    return `완료: ${def.title}`;
  }
  return step ? `단계 완료: ${step.task}` : null;
}

export function currentStep(s: GameState, id: string): QuestStepDef | undefined {
  const q = s.quests[id];
  const def = questDef(id);
  if (!q || !def || q.state !== 'active') return undefined;
  return def.steps[q.step];
}

/** Whether the current step can be done right now (place, segment, day rules). */
export function stepAvailableNow(s: GameState, id: string, loc?: LocId, seg?: Segment): boolean {
  const q = s.quests[id];
  const st = currentStep(s, id);
  if (!q || !st) return false;
  if (loc !== undefined && st.loc !== loc) return false;
  if (seg !== undefined && st.seg !== seg) return false;
  return stepAvailableToday(s, id);
}

export function stepAvailableToday(s: GameState, id: string): boolean {
  const q = s.quests[id];
  const st = currentStep(s, id);
  if (!q || !st) return false;
  if (st.minDay !== undefined && s.day < st.minDay) return false;
  // one repetition per day; 'nextDay' steps wait for a day after the previous step
  if (q.lastDay === s.day && (st.nextDay || q.progress > 0)) return false;
  if (!check(s, st.requires)) return false;
  return true;
}

/** Records one repetition of the current step; advances when all repetitions are done. */
export function performStep(s: GameState, id: string): string[] {
  const q = s.quests[id];
  const st = currentStep(s, id);
  if (!q || !st) return [];
  q.progress += 1;
  q.lastDay = s.day;
  if (q.progress >= (st.repeat ?? 1)) {
    const msg = questOp(s, id, 'advance');
    return msg ? [msg] : [];
  }
  return [];
}

export function stepScene(s: GameState, id: string) {
  const q = s.quests[id];
  const st = currentStep(s, id);
  if (!q || !st) return [];
  return st.scenes[Math.min(q.progress, st.scenes.length - 1)];
}

/** [변경 2] quest steps that can be done right now at this place and part of the day */
export function stepsHere(s: GameState, loc: LocId, seg: Segment): { qid: string; step: QuestStepDef }[] {
  return activeQuestIds(s)
    .filter((qid) => stepAvailableNow(s, qid, loc, seg))
    .map((qid) => ({ qid, step: currentStep(s, qid)! }));
}

export function activeQuestIds(s: GameState): string[] {
  return Object.keys(s.quests).filter((k) => s.quests[k].state === 'active');
}
