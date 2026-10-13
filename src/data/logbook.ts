import { check, type Cond } from '../core/conditions';
import type { GameState } from '../core/state';
import type { GroundId } from '../core/types';

/** Ground tips written in Walt's hand. Unlocked one at a time (letters, events, logbook pages). */
export const GROUND_TIPS: Record<Exclude<GroundId, 'theSpot'>, string> = {
  oyster: '보름 썰물엔 굴 양식장 남쪽. 말뚝 세 번째 줄 바깥.',
  sandbar: '모래톱은 밀물 때. 잔챙이 많아도 무게로 먹고 산다.',
  wreck: '흐린 날 난파선. 큰 놈들 모인다. 오래 끌면 그물 찢긴다.',
  river: '비 온 다음 날 강 하구. 게가 따라 올라온다.',
  channel: '바람 없는 날 깊은 수로. 적게 잡혀도 다 큰 놈.',
  gusSpot: '거스 자리는 거스한테 물어봐라. 안 알려줄 거다.',
};

/**
 * Logbook entries (DESIGN §8.10). `hand: 'walt'` is the father's handwriting, `hand: 'eli'` is
 * Eli's pen. Entries without `unlock` are written only by event/quest effects (`{ logbook: id }`).
 * Entries with `unlock` appear by themselves once the condition holds — Eli reads further into
 * the book, or writes down what he found out — the next time the logbook is opened
 * (`syncLogbook`). Eli's wrong guesses are struck through when `strikeWhen` holds (D20).
 */
export interface LogbookEntry {
  hand: 'walt' | 'eli';
  text: string;
  /** appears by itself once this holds (and the logbook has been found) */
  unlock?: Cond | Cond[];
  /** also requires this fish species in the fish log */
  caught?: string;
  /** reading this page teaches this ground tip (shown on the sea map) */
  tip?: Exclude<GroundId, 'theSpot'>;
  /** Eli strikes this line through once this holds */
  strikeWhen?: Cond | Cond[];
}

/** The father's rule. Always the first page. */
export const FIRST_PAGE = 'LB_RULE';

const days = (gte: number, lte?: number): Cond => (lte === undefined ? { day: { gte } } : { day: { gte, lte } });

export const LOGBOOK_ENTRIES: Record<string, LogbookEntry> = {
  // ── fixed pages (written by the W1_LOGBOOK_X event) ──
  LB_RULE: { hand: 'walt', text: '등대 앞 그 자리에는 절대 그물을 내리지 마라.' },
  LB_TORN: { hand: 'eli', text: '7년 전 늦여름, 한 장이 찢겨 나갔다. 날짜가 비어 있다.' },
  LB_CALVIN_NOFISH: { hand: 'eli', text: '캘빈 씨 말로는 등대 앞엔 고기가 없다고 함.' },
  LB_X_WRECK: { hand: 'eli', text: '아버지 X 표시 = 난파선 위험 때문?', strikeWhen: { eventDone: 'W6_CABIN_FLOOR' } },
  LB_GUS_SPOT: { hand: 'eli', text: '거스 자리. 등대 남쪽, 부표 두 개 사이. 영감이 알려준 게 아니라 내가 본 거임.' },
  LB_LEDGER: { hand: 'eli', text: '펠리컨이 계속 따라온다. 새우를 훔친다. 이름이 장부라고 함. 누가 이런 이름을.', unlock: { flag: 'ledgerAboard' } },
  LB_TURTLE: { hand: 'eli', text: '거북은 난간 너머로. 쓰레기통에 넣으면 벌금. 거북한테도 미안하고.', unlock: { any: [{ eventDone: 'LEE_FINE' }, days(6)] } },
  LB_SPOT_TRY: { hand: 'eli', text: '등대 앞으로 키를 돌리려 하면 손이 멈춘다. 영감도 안 된다고 한다.' },

  // ── Walt's fishing guide: pages Eli reads further into, one at a time ──
  WG_TIDE: { hand: 'walt', text: '물때 보고 나가고, 날씨 보고 들어온다. 그거면 반은 한다.', unlock: days(4) },
  WG_NET: { hand: 'walt', text: '그물은 오래 끌수록 무겁다. 윈치 소리가 높아지면 올려라. 욕심내면 찢긴다.', unlock: days(5) },
  WG_SANDBAR: {
    hand: 'walt',
    text: '모래톱. 크로커, 스팟은 떼로 온다. 썰물엔 바닥에 플라운더가 납작 엎드려 있다. 미끼 흔들지 마라. 도망간다.',
    unlock: days(5),
  },
  WG_TROUT: {
    hand: 'walt',
    text: '얼룩송어는 새벽 다섯 시 전, 굴 양식장. 해 뜨면 숨는다. 겁쟁이라 미끼를 끌면 안 문다. 길목에 두고 기다려라.',
    unlock: days(6),
  },
  WG_CLOUDY: { hand: 'walt', text: '흐린 날은 바다메기 천지. 미끼만 뜯어 먹는다. 거스가 욕을 한다. 신경 쓰지 마라.', unlock: days(7) },
  WG_LEDGER: {
    hand: 'walt',
    text: '펠리컨한테 잡어 던져 줘라. 그놈이 내려앉는 데가 그날 고기 있는 데다. 이름은 내가 안 지었다.',
    unlock: [days(8), { flag: 'ledgerAboard' }],
  },
  WG_WRECK: {
    hand: 'walt',
    text: '흐린 날 난파선. 쉽스헤드는 이빨이 사람 이빨 같다. 놀라지 마라. 게 미끼를 써라.',
    unlock: days(9),
    tip: 'wreck',
  },
  WG_BAIT: {
    hand: 'walt',
    text: '미끼. 새우는 다 문다. 게는 쉽스헤드, 블랙드럼. 산 핀피시는 큰 놈들. 반짝이는 사냥꾼만 문다.',
    unlock: days(10),
  },
  WG_REDFISH: {
    hand: 'walt',
    text: '레드피시는 썰물. 굴 양식장 아니면 강 하구. 꼬리 점이 놈마다 다르다. 다섯 개짜리는 딱 한 번 봤다.',
    unlock: days(11),
  },
  WG_RIVER: {
    hand: 'walt',
    text: '비 온 다음 날 강 하구. 뱀장어가 바닥을 긴다. 흐린 날엔 블랙드럼. 배 밑에서 둥둥 소리 나면 그놈이다.',
    unlock: days(12),
    tip: 'river',
  },
  WG_COBIA: { hand: 'walt', text: '철 초반엔 깊은 수로에 코비아. 가오리를 따라 들어온다. 한 달 지나면 없다. 미루지 마라.', unlock: days(13) },
  WG_CHANNEL: {
    hand: 'walt',
    text: '바람 없는 날 깊은 수로. 잭 크레발은 미끼를 도망가게 해야 문다. 손목 조심해라.',
    unlock: days(14),
    tip: 'channel',
  },
  WG_GUSSPOT: { hand: 'walt', text: '거스 자리. 여기엔 안 적는다. 거스랑 약속했다.', unlock: days(15), tip: 'gusSpot' },
  WG_PIER: { hand: 'walt', text: '부두 끝. 맑은 날 동갈치, 복어. 복어는 부풀어도 놔줘라. 화난 게 아니라 무서운 거다.', unlock: days(16) },
  WG_BREAKWATER: { hand: 'walt', text: '바람 부는 날 방파제. 블루피시. 반짝이를 빨리 감아라. 도망가는 걸 쫓는 놈이다.', unlock: days(17) },
  WG_OLDRED: {
    hand: 'walt',
    text: '굴 양식장 남쪽 말뚝. 거스가 거기서 30년째 뭘 기다린다. 물어보지 마라. 삐친다.',
    unlock: [days(18), { feel: 'gus', gte: 40 }],
  },
  WG_KINGMACK: { hand: 'walt', text: '보름엔 깊은 수로에 킹고등어. 산 핀피시를 달고 빨리 끌어라.', unlock: days(19) },
  WG_OYSTER: {
    hand: 'walt',
    text: '굴 양식장은 썰물. 보름이면 더 좋다. 말뚝 가까이 끌면 그물 걸린다. 바깥으로 돌아라.',
    unlock: days(20),
    tip: 'oyster',
  },
  WG_SNAPPER: {
    hand: 'walt',
    text: '난파선 레드스내퍼는 겁이 많다. 미끼를 놔두고 숨죽여라. 맑은 날엔 바라쿠다가 먼저 채 간다.',
    unlock: days(21),
  },
  WG_GOLDCROAKER: { hand: 'walt', text: '크로커 떼에 금빛이 하나 섞여 있으면 그날은 일찍 들어가라. 운 다 쓴 거다.', unlock: days(23) },
  WG_TARPON: {
    hand: 'walt',
    text: '보름날 출항하고 반 시간. 수로에서 은빛이 뛰면 왕이다. 잡아도 놔줘라. 왕은 사진만 찍는 거다.',
    unlock: days(25),
  },
  WG_WHITECAT: { hand: 'walt', text: '비 오는 날 아주 가끔 하얀 바다메기. 재수 좋은 거다. 안 팔까 하다가 팔았다.', unlock: days(27) },
  WG_GOLIATH: { hand: 'walt', text: '흐린 보름, 난파선 제일 깊은 데. 문짝만 한 그루퍼가 산다. 끌어올릴 생각 마라.', unlock: days(30) },
  WG_SEAHORSE: { hand: 'walt', text: '해마가 그물에 걸리면 꼬리를 풀 때까지 기다려라. 억지로 떼면 죽는다.', caught: 'seahorse' },
  WG_STINGRAY: { hand: 'walt', text: '노랑가오리는 꼬리 조심. 장갑 끼고 놓아줘라. 팔 데도 없다.', caught: 'stingray' },

  // ── Eli's pen: weeks 1–5 ──
  LB_E_PAYDAY: { hand: 'eli', text: '금요일 다섯 시, 은행. 첫 주 250. 그다음부터 500.', unlock: { eventDone: 'W1_BANK' } },
  LB_E_GUS_HATES: {
    hand: 'eli',
    text: '거스 영감은 나를 싫어한다.',
    unlock: { eventDone: 'W1_FIRST_TRIP' },
    strikeWhen: { feel: 'gus', gte: 40 },
  },
  LB_E_GUS_HATES_FIX: { hand: 'eli', text: '→ 싫어하는 게 아니라 원래 저런 거였다. 아마도.', unlock: { feel: 'gus', gte: 40 } },
  LB_E_MARKET: {
    hand: 'eli',
    text: '어시장은 안 받는다. 통조림 트럭은 받는다. 듀이 씨는 새우가 어디서 왔는지 안 묻는다.',
    unlock: { eventDone: 'W1_FIRST_SALE' },
  },
  LB_E_SHRIMP: { hand: 'eli', text: '새우는 다리가 너무 많다. 여전히 싫다.', unlock: days(4), strikeWhen: days(15) },
  LB_E_SHRIMP_FIX: { hand: 'eli', text: '→ 크기별로 고르는 건 좀 재밌다. 먹는 건 아직.', unlock: days(15) },
  LB_E_LEDGER_ANY: {
    hand: 'eli',
    text: '장부는 아무 손에서나 받아먹는다. 줏대 없는 새.',
    unlock: { flag: 'ledgerAboard' },
    strikeWhen: { eventDone: 'W2_CALVIN_COOKOUT' },
  },
  LB_E_LEDGER_FIX: {
    hand: 'eli',
    text: '→ 캘빈 씨 손에서만은 안 받아먹는다. 캘빈 씨는 "저 녀석은 저를 안 좋아해요" 하고 웃었다.',
    unlock: { eventDone: 'W2_CALVIN_COOKOUT' },
  },
  LB_E_KNOT: { hand: 'eli', text: '거스 매듭: 위에서 아래로. 한 코도 건너뛰지 말 것.', unlock: { flag: 'knotLesson' } },
  LB_E_CALVIN_DAWN: {
    hand: 'eli',
    text: '캘빈 씨는 매일 새벽 혼자 낚시하러 나간다. "제 자리"가 있다고 함. 부럽다.',
    unlock: [days(5), { flag: 'calvinBeer' }],
  },
  LB_E_PAINT: {
    hand: 'eli',
    text: '선체 글자는 민트색으로 덮었다. 싸구려라 햇빛에 비친다. 월요일 밤마다 다시 생긴다.',
    unlock: [days(11), { flag: 'paintedOver' }],
  },
  LB_E_BOTTLE: { hand: 'eli', text: '병 속 쪽지. 메이지, 여덟 살. 개 이름 비스킷. 모래언덕.', unlock: { quest: 'Q_BOTTLE', state: 'started' } },
  LB_E_BISCUIT: {
    hand: 'eli',
    text: '비스킷 찾음. 보트하우스 판자 밑. 사례는 사탕. 이 동네에서 처음 받은 고맙다는 말.',
    unlock: { quest: 'Q_BOTTLE', state: 'done' },
  },
  LB_E_ROSA_HATE: {
    hand: 'eli',
    text: '로사 씨는 나를 죽도록 미워한다.',
    unlock: { any: [{ flag: 'metRosa' }, { flag: 'talk_rosa' }, { quest: 'Q_ROSA_ICE', state: 'started' }] },
    strikeWhen: { feel: 'rosa', gte: 40 },
  },
  LB_E_ROSA_FIX: { hand: 'eli', text: '→ 죽도록은 아니다. 그냥 미워한다. 파이는 잘라 준다.', unlock: { feel: 'rosa', gte: 40 } },
  LB_E_ICE: {
    hand: 'eli',
    text: '로사 식당 얼음 기계 고장. 듀이 씨 트럭에서 얼음 받아 나르기. 녹기 전에.',
    unlock: { quest: 'Q_ROSA_ICE', state: 'started' },
  },
  LB_E_SAL_SEA: {
    hand: 'eli',
    text: '재판 기록: 샐 모레티가 사라진 밤, 아버지 배는 바다에 있었다.',
    unlock: [{ flag: 'trialFile' }, days(8)],
    strikeWhen: { evidence: 'E_LOGBOOK_DOCKED' },
  },
  LB_E_SAL_DOCKED: {
    hand: 'eli',
    text: '→ 로사 씨가 말해 준 날짜. 아버지 일지 그날: "정박. 엔진 손봄." 바다에 안 나갔다.',
    unlock: { evidence: 'E_LOGBOOK_DOCKED' },
  },
  LB_E_CALVIN_KNOTS: {
    hand: 'eli',
    text: '캘빈 씨 매듭 수업. 보라인, 클로브 히치. 벽에 매듭 액자가 가득. "제 취미예요."',
    unlock: { quest: 'Q_CALVIN_KNOTS', state: 'done' },
  },
  LB_E_GUSSPOT: {
    hand: 'eli',
    text: '거스: "이제 거기 알지? 혼자 가." 혼자 갔다. 잡혔다. 영감한테는 말 안 했다.',
    unlock: { eventDone: 'W3_GUSSPOT_UNLOCK' },
  },
  LB_E_NORA: {
    hand: 'eli',
    text: '노라 퀸. 기자. 그 책 쓴 사람. 새우 철 사진 네 장 부탁받음. 카메라도 받음.',
    unlock: { quest: 'Q_NORA_PHOTO', state: 'started' },
  },
  LB_E_HANK: {
    hand: 'eli',
    text: '행크 영감 통발이 없어졌다. 영감이 말한 표지를 따라 그물로 건지기.',
    unlock: { quest: 'Q_HANK_TRAPS', state: 'started' },
  },
  LB_E_PIKE: {
    hand: 'eli',
    text: '파이크 박사 부탁: 노인분들 약 배달. 박사는 설명이 길다. 주소는 짧다.',
    unlock: { quest: 'Q_PIKE_ERRANDS', state: 'started' },
  },
  LB_E_BANK_NOTES: {
    hand: 'eli',
    text: '프리야 씨 부탁: 전임자 업무 노트 정리. 은행원이 물때를 적어 놨다. 이상한 은행원.',
    unlock: { quest: 'Q_BANK_LEDGER', state: 'started' },
  },
  LB_E_SAL_DAY: {
    hand: 'eli',
    text: '27일. 로사 식당 닫힘. "오늘은 쉽니다." 창문 너머 벽의 머그에 커피가 담겨 있었다.',
    unlock: { eventDone: 'W4_SAL_DAY' },
  },
  LB_E_BLESSING: {
    hand: 'eli',
    text: '선단 축복제 명단에 메리 루가 없다. 배를 칠하고, 신부님께 여쭤보기.',
    unlock: { any: [{ eventDone: 'W5_FESTIVAL_NEWS' }, { quest: 'Q_BLESSING', state: 'started' }] },
  },
  LB_E_FESTIVAL: {
    hand: 'eli',
    text: '축복제 밤. 거스 영감이 처음으로 웃었다. 아버지 얘기를 했다. 오래.',
    unlock: { eventDone: 'W5_FESTIVAL' },
  },
  LB_E_OLDRED: { hand: 'eli', text: '올드 레드. 영감이 아무 말 없이 나를 안았다. 생선 냄새가 났다.', unlock: { flag: 'oldRedHug' } },
  LB_E_GOLDCROAKER: {
    hand: 'eli',
    text: '황금 크로커. 아버지 일지대로면 오늘은 일찍 들어가야 한다. 안 들어갔다.',
    caught: 'goldcroaker',
  },
  LB_E_X_NOT_WRECK: {
    hand: 'eli',
    text: '난파선은 훨씬 남쪽이다. X는 난파선 때문이 아니다.',
    unlock: { eventDone: 'W6_CABIN_FLOOR' },
  },
};

/** True when an auto entry's conditions hold right now. */
function unlocked(s: GameState, e: LogbookEntry): boolean {
  if (!e.unlock && !e.caught) return false;
  if (e.caught && !(s.fishLog?.[e.caught]?.count > 0)) return false;
  return check(s, e.unlock);
}

/**
 * Writes newly unlocked pages into the logbook, learns their ground tips and strikes through
 * Eli's disproved guesses. Called when the logbook is opened. Returns the ids added.
 */
export function syncLogbook(s: GameState): string[] {
  if (!s.flags.logbookFound) return [];
  const added: string[] = [];
  for (const [id, e] of Object.entries(LOGBOOK_ENTRIES)) {
    if (!s.logbook.includes(id) && unlocked(s, e)) {
      s.logbook.push(id);
      added.push(id);
    }
    if (s.logbook.includes(id)) {
      if (e.tip && !s.tips.includes(e.tip)) s.tips.push(e.tip);
      if (e.strikeWhen && !s.logbookStruck.includes(id) && check(s, e.strikeWhen)) s.logbookStruck.push(id);
    }
  }
  return added;
}

/** The order the pages are shown in: the father's rule first, then the rest as written. */
export function logbookPages(s: GameState): string[] {
  const rest = s.logbook.filter((id) => id !== FIRST_PAGE && LOGBOOK_ENTRIES[id]);
  return s.logbook.includes(FIRST_PAGE) ? [FIRST_PAGE, ...rest] : rest;
}
