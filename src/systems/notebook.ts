import { isPaymentDay, SEGMENT_LABEL, weekOf, weekdayIndex } from '../core/calendar';
import type { GameState } from '../core/state';
import type { LocId, Segment } from '../core/types';
import { LOC_NAMES } from '../data/names';
import { TOTAL_LETTERS } from '../data/letters';
import { dueNow } from './economy';
import { activeQuestIds, currentStep, questDef, stepAvailableToday } from './quests';

export interface NotebookEntry {
  text: string;
  when: string;
  where: string;
  pinned: boolean;
  questId?: string;
  questTitle?: string;
  progress?: string;
  timeHint?: string;
  loc?: LocId;
  seg?: Segment;
  availableNow: boolean;
}

const SEG_ORDER: Segment[] = ['dawn', 'morning', 'afternoon', 'evening', 'night'];

/** [변경 1] clock hours for each part of the day */
export const SEG_HOURS: Record<Segment, string> = {
  dawn: '04~08시',
  morning: '08~09시',
  afternoon: '09~19시',
  evening: '19시 이후',
  night: '밤',
};

function whenLabel(s: GameState, seg: Segment, today: boolean): string {
  const segIdx = SEG_ORDER.indexOf(seg);
  const curIdx = SEG_ORDER.indexOf(s.segment);
  const isToday = today && segIdx >= curIdx;
  return `${isToday ? '오늘' : '내일'} ${SEGMENT_LABEL[seg]}`;
}

/** Days until the next payment Friday (0 = today). */
function daysToFriday(day: number): number {
  return (6 - weekdayIndex(day) + 7) % 7;
}

export function notebookEntries(s: GameState): NotebookEntry[] {
  const out: NotebookEntry[] = [];
  // main line: debt
  if (s.debt > 0 && weekOf(s.day) <= 9) {
    const due = dueNow(s);
    const d = daysToFriday(s.day);
    const when = d === 0 ? '오늘 오후' : d === 1 ? '내일 오후' : `${d}일 뒤 금요일 오후`;
    out.push({
      text: due > 0 ? `은행 납부 $${due.toFixed(0)} (자동)` : '이번 주 납부 끝. 미리 더 내도 된다.',
      when: isPaymentDay(s.day) || d > 0 ? when : '금요일 오후',
      where: LOC_NAMES.bank,
      pinned: true,
      loc: 'bank',
      seg: 'afternoon',
      availableNow: false,
    });
  }
  // main line: letters
  if (s.flags.letterBoxFound) {
    const left = TOTAL_LETTERS - s.lettersRead.length - s.lettersBurned.length;
    if (left > 0) {
      out.push({
        text: `아버지 편지 상자 (남은 편지 ${left}통)`,
        when: s.segment === 'night' ? '내일 저녁' : '오늘 저녁',
        where: LOC_NAMES.home,
        pinned: true,
        loc: 'home',
        seg: 'evening',
        availableNow: s.segment === 'evening',
      });
    }
  }
  // quests
  const qs = activeQuestIds(s);
  for (const id of qs) {
    const st = currentStep(s, id);
    const def = questDef(id);
    if (!st || !def) continue;
    const avail = stepAvailableToday(s, id);
    const segIdx = SEG_ORDER.indexOf(st.seg);
    const curIdx = SEG_ORDER.indexOf(s.segment);
    const today = avail && segIdx >= curIdx;
    const q = s.quests[id];
    const rep = st.repeat && st.repeat > 1 ? ` (${q.progress}/${st.repeat})` : '';
    out.push({
      text: avail || !st.waitingText ? `${st.task}${rep}` : st.waitingText,
      when: whenLabel(s, st.seg, today),
      where: LOC_NAMES[st.loc],
      pinned: false,
      questId: id,
      questTitle: def.title,
      progress: `${q.step + 1}/${def.steps.length}단계${rep}`,
      timeHint: SEG_HOURS[st.seg],
      loc: st.loc,
      seg: st.seg,
      availableNow: today && st.seg === s.segment,
    });
  }
  // always a concrete next step
  if (out.filter((e) => !e.pinned).length === 0) {
    if (s.netTorn) {
      out.push({ text: '찢어진 그물 수선', when: whenLabel(s, 'afternoon', true), where: LOC_NAMES.dock, pinned: false, loc: 'dock', seg: 'afternoon', availableNow: s.segment === 'afternoon' });
    } else {
      out.push({ text: '출항해서 새우 잡기', when: whenLabel(s, 'dawn', false), where: LOC_NAMES.dock, pinned: false, loc: 'dock', seg: 'dawn', availableNow: s.segment === 'dawn' });
    }
  }
  return out;
}

/** [변경 1] Quest tracker: the tracked quest first, then up to two more. */
export function trackerEntries(s: GameState): NotebookEntry[] {
  const qs = notebookEntries(s).filter((e) => e.questId);
  const tracked = qs.find((e) => e.questId === s.trackedQuest) ?? qs[0];
  if (!tracked) return [];
  return [tracked, ...qs.filter((e) => e !== tracked).slice(0, 2)];
}

/** [변경 1] "이번 주 상환 $500 · 모은 돈 $320 · 금요일까지 2일" */
export function paymentStatusLine(s: GameState): string {
  if (s.debt <= 0) return '빚 없음 · 메리 루는 내 배';
  if (s.overdue) {
    const d = s.overdue.deadlineDay - s.day;
    return `연체 $${s.overdue.amount.toFixed(0)} · ${d <= 0 ? '오늘' : d === 1 ? '내일' : '월요일'} 17시까지 · 모은 돈 $${s.money.toFixed(0)}`;
  }
  if (weekOf(s.day) > 9) return `남은 빚 $${s.debt.toFixed(0)} · 정기 상환 끝`;
  const due = dueNow(s);
  if (due <= 0) return `이번 주 상환 완료 · 모은 돈 $${s.money.toFixed(0)}`;
  const d = daysToFriday(s.day);
  return `이번 주 상환 $${due.toFixed(0)} · 모은 돈 $${s.money.toFixed(0)} · ${d === 0 ? '오늘 17시까지' : `금요일까지 ${d}일`}`;
}
