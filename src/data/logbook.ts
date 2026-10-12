import type { GroundId } from '../core/types';

/** Ground tips written in Walt's hand. Unlocked one at a time. */
export const GROUND_TIPS: Record<Exclude<GroundId, 'theSpot'>, string> = {
  oyster: '보름 썰물엔 굴 양식장 남쪽. 말뚝 세 번째 줄 바깥.',
  sandbar: '모래톱은 밀물 때. 잔챙이 많아도 무게로 먹고 산다.',
  wreck: '흐린 날 난파선. 큰 놈들 모인다. 오래 끌면 그물 찢긴다.',
  river: '비 온 다음 날 강 하구. 게가 따라 올라온다.',
  channel: '바람 없는 날 깊은 수로. 적게 잡혀도 다 큰 놈.',
  gusSpot: '거스 자리는 거스한테 물어봐라. 안 알려줄 거다.',
};

/**
 * Logbook entries. `hand: 'walt'` is the father's handwriting, `hand: 'eli'` is Eli's pen.
 * Eli's wrong guesses can be struck through later (D20).
 */
export interface LogbookEntry {
  hand: 'walt' | 'eli';
  text: string;
}

export const LOGBOOK_ENTRIES: Record<string, LogbookEntry> = {
  LB_RULE: { hand: 'walt', text: '등대 앞 그 자리에는 절대 그물을 내리지 마라.' },
  LB_TORN: { hand: 'eli', text: '7년 전 늦여름, 한 장이 찢겨 나갔다. 날짜가 비어 있다.' },
  LB_CALVIN_NOFISH: { hand: 'eli', text: '캘빈 씨 말로는 등대 앞엔 고기가 없다고 함.' },
  LB_X_WRECK: { hand: 'eli', text: '아버지 X 표시 = 난파선 위험 때문?' },
  LB_GUS_SPOT: { hand: 'eli', text: '거스 자리. 등대 남쪽, 부표 두 개 사이. 영감이 알려준 게 아니라 내가 본 거임.' },
  LB_LEDGER: { hand: 'eli', text: '펠리컨이 계속 따라온다. 새우를 훔친다. 이름이 장부라고 함. 누가 이런 이름을.' },
  LB_TURTLE: { hand: 'eli', text: '거북은 난간 너머로. 쓰레기통에 넣으면 벌금. 거북한테도 미안하고.' },
  LB_SPOT_TRY: { hand: 'eli', text: '등대 앞으로 키를 돌리려 하면 손이 멈춘다. 영감도 안 된다고 한다.' },
};
