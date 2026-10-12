import { adjustFeel, feelStateOf } from '../systems/feelings';
import { questOp, type QuestOp } from '../systems/quests';
import { EVIDENCE_NAMES } from '../data/evidenceNames';
import { CHAR_NAMES } from '../data/names';
import { LOGBOOK_ENTRIES } from '../data/logbook';
import { GROUND_NAMES } from '../data/groundNames';
import type { FlagValue, GameState } from './state';
import type { FeelId, GroundId } from './types';

export type Effect =
  | { flag: string; value?: FlagValue }
  | { clearFlag: string }
  | { addFlag: string; n: number }
  | { money: number; quiet?: boolean }
  | { feel: FeelId; delta: number }
  | { item: string; n?: number }
  | { evidence: string }
  | { quest: string; op: QuestOp }
  | { logbook: string }
  | { strike: string }
  | { tip: GroundId }
  | { remember: string }
  | { curiosity: string }
  | { netTorn: boolean };

/** Applies effects and returns short human-readable toasts (Korean). */
export function applyEffects(s: GameState, effects: Effect[] | undefined): string[] {
  const out: string[] = [];
  if (!effects) return out;
  for (const e of effects) {
    if ('flag' in e) s.flags[e.flag] = e.value ?? true;
    else if ('clearFlag' in e) delete s.flags[e.clearFlag];
    else if ('addFlag' in e) s.flags[e.addFlag] = (Number(s.flags[e.addFlag]) || 0) + e.n;
    else if ('money' in e) {
      s.money = Math.round((s.money + e.money) * 100) / 100;
      if (!e.quiet) out.push(e.money >= 0 ? `+$${e.money}` : `-$${-e.money}`);
    } else if ('feel' in e) {
      const before = feelStateOf(s.feelings[e.feel] ?? 0);
      const v = adjustFeel(s, e.feel, e.delta);
      const after = feelStateOf(v);
      if (before !== after && e.feel !== 'calvin') out.push(`${CHAR_NAMES[e.feel] ?? e.feel}: ${before} → ${after}`);
    } else if ('item' in e) {
      const n = e.n ?? 1;
      s.items[e.item] = Math.max(0, (s.items[e.item] ?? 0) + n);
    } else if ('evidence' in e) {
      if (!s.evidence.includes(e.evidence)) {
        s.evidence.push(e.evidence);
        out.push(`단서: ${EVIDENCE_NAMES[e.evidence] ?? e.evidence}`);
      }
    } else if ('quest' in e) {
      const msg = questOp(s, e.quest, e.op);
      if (msg) out.push(msg);
    } else if ('logbook' in e) {
      if (!s.logbook.includes(e.logbook)) {
        s.logbook.push(e.logbook);
        if (LOGBOOK_ENTRIES[e.logbook]) out.push('일지에 적었다');
      }
    } else if ('strike' in e) {
      if (!s.logbookStruck.includes(e.strike)) s.logbookStruck.push(e.strike);
    } else if ('tip' in e) {
      if (!s.tips.includes(e.tip)) {
        s.tips.push(e.tip);
        out.push(`일지 팁: ${GROUND_NAMES[e.tip]}`);
      }
    } else if ('remember' in e) {
      if (!s.calvinMemory.includes(e.remember)) s.calvinMemory.push(e.remember);
    } else if ('curiosity' in e) {
      s.curiosities.push(e.curiosity);
    } else if ('netTorn' in e) {
      s.netTorn = e.netTorn;
    }
  }
  return out;
}
