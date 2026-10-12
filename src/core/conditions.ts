import type { FlagValue, GameState } from './state';
import type { FeelId, GroundId } from './types';

export type Cond =
  | { flag: string; eq?: FlagValue }
  | { notFlag: string }
  | { feel: FeelId; gte?: number; lt?: number }
  | { quest: string; state: 'none' | 'active' | 'done' | 'started' }
  | { questStepGte: string; step: number }
  | { evidence: string }
  | { noEvidence: string }
  | { day: { gte?: number; lte?: number } }
  | { owns: string }
  | { notOwns: string }
  | { item: string }
  | { money: { gte?: number; lt?: number } }
  | { eventDone: string }
  | { rewritten: string }
  | { lettersReadGte: number }
  | { tip: GroundId }
  | { any: Cond[] }
  | { not: Cond };

export function check(s: GameState, c: Cond | Cond[] | undefined): boolean {
  if (!c) return true;
  if (Array.isArray(c)) return c.every((x) => check(s, x));
  if ('flag' in c) {
    const v = s.flags[c.flag];
    if (c.eq !== undefined) return v === c.eq;
    return v !== undefined && v !== false && v !== 0 && v !== '';
  }
  if ('notFlag' in c) {
    const v = s.flags[c.notFlag];
    return v === undefined || v === false || v === 0 || v === '';
  }
  if ('feel' in c) {
    const v = s.feelings[c.feel] ?? 0;
    if (c.gte !== undefined && v < c.gte) return false;
    if (c.lt !== undefined && v >= c.lt) return false;
    return true;
  }
  if ('quest' in c) {
    const q = s.quests[c.quest];
    if (c.state === 'none') return !q;
    if (c.state === 'started') return !!q;
    return !!q && q.state === c.state;
  }
  if ('questStepGte' in c) {
    const q = s.quests[c.questStepGte];
    return !!q && (q.state === 'done' || q.step >= c.step);
  }
  if ('evidence' in c) return s.evidence.includes(c.evidence);
  if ('noEvidence' in c) return !s.evidence.includes(c.noEvidence);
  if ('day' in c) {
    if (c.day.gte !== undefined && s.day < c.day.gte) return false;
    if (c.day.lte !== undefined && s.day > c.day.lte) return false;
    return true;
  }
  if ('owns' in c) return (s.purchases[c.owns] ?? 0) > 0;
  if ('notOwns' in c) return !((s.purchases[c.notOwns] ?? 0) > 0);
  if ('item' in c) return (s.items[c.item] ?? 0) > 0;
  if ('money' in c) {
    if (c.money.gte !== undefined && s.money < c.money.gte) return false;
    if (c.money.lt !== undefined && s.money >= c.money.lt) return false;
    return true;
  }
  if ('eventDone' in c) return s.eventsDone.includes(c.eventDone);
  if ('rewritten' in c) return s.rewritten.includes(c.rewritten);
  if ('lettersReadGte' in c) return s.lettersRead.length >= c.lettersReadGte;
  if ('tip' in c) return s.tips.includes(c.tip);
  if ('any' in c) return c.any.some((x) => check(s, x));
  if ('not' in c) return !check(s, c.not);
  return true;
}
