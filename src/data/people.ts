import type { Cond } from '../core/conditions';
import type { CharId, FeelId } from '../core/types';

/** [변경 1] "만난 사람" in the notebook: one-line intros, shown once met. */
export interface PersonDef {
  id: CharId;
  feel?: FeelId;
  intro: string;
  met: Cond | Cond[];
}

export const PEOPLE: PersonDef[] = [
  { id: 'gus', feel: 'gus', intro: '아버지 배에서 30년 일한 갑판원. 말이 거의 없다. 빨간 털모자.', met: { eventDone: 'W1_FUNERAL' } },
  { id: 'calvin', feel: 'calvin', intro: '은퇴한 주 수사관. 아버지 사건을 맡았던 사람. 마을에서 제일 친절하다.', met: { eventDone: 'W1_FUNERAL' } },
  { id: 'toby', feel: 'toby', intro: '젊은 보안관보. 늘 휘파람을 분다. 캘빈을 "선배님"이라고 부른다.', met: { eventDone: 'W1_FUNERAL' } },
  { id: 'matthew', feel: 'matthew', intro: '성당 신부님. 아무것도 묻지 않는다.', met: { eventDone: 'W1_FUNERAL' } },
  { id: 'priya', feel: 'priya', intro: '은행 대출 담당. 금요일 오후 5시 상환을 받는 사람.', met: { eventDone: 'W1_BANK' } },
  { id: 'dewey', intro: '통조림 공장 트럭 운전사. 누구 새우든 사 준다.', met: { eventDone: 'W1_FIRST_SALE' } },
  { id: 'ledger', intro: '메리 루를 따라다니는 펠리컨. 새우를 훔친다. 잡어를 던져 주면 덜 훔친다.', met: { flag: 'ledgerAboard' } },
  { id: 'maisie', feel: 'maisie', intro: '여덟 살. 병에 쪽지를 넣어 띄운 아이. 개 이름은 비스킷.', met: { quest: 'Q_BOTTLE', state: 'started' } },
  { id: 'joanne', feel: 'joanne', intro: '메이지의 엄마. 나를 보면 문고리를 꽉 쥔다.', met: { questStepGte: 'Q_BOTTLE', step: 3 } },
  { id: 'hank', feel: 'hank', intro: '늙은 어부. 새벽 부두에서 미끼 가판대를 연다. 나한테 말은 안 건다.', met: { flag: 'metHank' } },
  { id: 'rosa', feel: 'rosa', intro: '식당 주인. 마을에서 나를 제일 대놓고 미워한다.', met: { flag: 'metRosa' } },
  { id: 'lee', intro: '수산 단속관. 경고장에 웃는 거북을 그려 준다.', met: { eventDone: 'LEE_FINE' } },
];
