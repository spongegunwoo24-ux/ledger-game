import type { Cond } from '../../core/conditions';
import type { QuestDef } from './types';

/** The bank is closed on Sundays (Priya is not there). */
const SUNDAYS = [23, 30, 37, 44, 51, 58, 65];
const NOT_SUNDAY: Cond = { not: { any: SUNDAYS.map((d) => ({ day: { gte: d, lte: d } })) } };
const SUNDAY_WAIT = '일요일엔 은행이 쉰다. 월요일 오후에 가자.';

/**
 * Q_BANK_LEDGER — Daniel Webb's work notes (week 4). DESIGN §11, D19.
 * Carry Daniel's boxes → sort the notes by boat (find "W.") → Priya lets Eli keep the notebook
 * (E_DANIEL_NOTES) → read it at home. Plants: the swollen back cover (E_DANIEL_NOTE_UNSENT, Day 36+),
 * "G. 웃음" (pays off at the festival night), Daniel's festival note (leads into Q_BLESSING).
 */
export const Q_BANK_LEDGER: QuestDef = {
  id: 'Q_BANK_LEDGER',
  title: '대니얼 웹의 서류 상자',
  giver: 'priya',
  steps: [
    {
      task: '은행 창고에서 대니얼의 서류 상자 꺼내 오기',
      button: '서류 상자 나르기',
      loc: 'bank',
      seg: 'afternoon',
      minDay: 24,
      requires: NOT_SUNDAY,
      waitingText: SUNDAY_WAIT,
      bg: 'bank',
      actors: [
        { who: 'eli', at: { x: 420, y: 552 } },
        { who: 'priya', at: { x: 760, y: 556 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '은행 뒤 창고. 천장까지 쌓인 상자 맨 아래에 같은 글씨로 이름표를 붙인 상자 다섯 개.' },
          { t: 'think', text: '"D. 웹 — 어선 대출 1979~1981". 자로 잰 것 같은 글씨다.' },
          { t: 'say', who: 'priya', text: '맨 아래예요. 당연히 맨 아래죠. 필요한 서류 상자는 늘 맨 아래 있어요.' },
          { t: 'minigame', id: 'carry', params: { label: '서류 상자', count: 3 } },
          { t: 'say', who: 'priya', text: '다 됐어요! 나머지 두 개는 아까 제가 옮겼거든요. 허리가 나갈 뻔했어요.' },
          { t: 'narrate', text: '상자를 열자 종이 냄새가 확 올라온다. 파일마다 색깔 견출지가 붙어 있다.' },
          { t: 'say', who: 'priya', text: '대니얼 씨는 정리를 정말 잘하셨대요. 지점장님 말로는 연필도 길이순으로 꽂으셨대요.' },
          { t: 'say', who: 'priya', text: '저는 한 번도 못 뵀어요. 그런데 이 책상 서랍마다 그분이 남아 있는 것 같아서… 가끔 좀 이상해요.' },
          { t: 'think', text: '서랍마다 남은 사람. 우리 집도 그렇다.' },
          { t: 'say', who: 'priya', text: '오늘은 여기까지 해요. 내일은 배 이름별로 나눠요. 그건 할로우 씨 차례예요.' },
        ],
      ],
    },
    {
      task: '대니얼의 업무 노트, 배 이름별로 나누기',
      button: '노트 분류하기',
      loc: 'bank',
      seg: 'afternoon',
      nextDay: true,
      requires: NOT_SUNDAY,
      waitingText: SUNDAY_WAIT,
      bg: 'bank',
      actors: [
        { who: 'eli', at: { x: 420, y: 552 } },
        { who: 'priya', at: { x: 760, y: 556 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '은행 창고. 바닥에 배 이름을 쓴 종이를 깔고 서류를 한 묶음씩 올려놓는다.' },
          { t: 'think', text: '"세인트 엘모 호". "펠리컨 걸 호". "도러시 호". 부두에서 매일 보는 배들이다.' },
          { t: 'narrate', text: '대출 서류 사이사이에 손으로 쓴 메모가 끼어 있다. 물때표, 새우 철 그래프, 어장별 어획량.' },
          { t: 'think', text: '은행원이 왜 물때를 공부했지.' },
          { t: 'say', who: 'priya', text: '이것 좀 보세요. "갈색 새우 5~7월, 흰 새우 8~12월."' },
          { t: 'say', who: 'priya', text: '"보름 썰물에 많음 — 확인 필요." 이거 은행원 메모 맞아요?' },
          { t: 'say', who: 'eli', text: '…맞는 말이에요. 보름 썰물.' },
          { t: 'say', who: 'priya', text: '빌려준 사람이 어떻게 갚을지 알고 싶으셨나 봐요. 저는 숫자만 보는데, 그분은 바다를 보셨네요.' },
          { t: 'narrate', text: '마지막 상자 맨 밑에서 손바닥만 한 갈색 수첩이 나왔다. 표지에 "현장 메모".' },
          { t: 'narrate', text: '첫 장부터 같은 이니셜이 반복된다. "W."' },
          { t: 'say', who: 'priya', text: 'W.가 누굴까요? 고객 이름을 이니셜로 쓰셨나 봐요.' },
          { t: 'think', text: '"W. — 대출번호 1147". 메리 루 서류 표지에 있던 번호다.' },
          { t: 'say', who: 'eli', text: '…저희 아버지예요. 월트.' },
          { t: 'say', who: 'priya', text: '아.', mood: 'sad' },
          { t: 'narrate', text: '프리야는 한참 수첩을 내려다보다가 조심스럽게 한 장을 넘겼다.' },
          { t: 'letter', title: '대니얼의 수첩', text: 'W. 오늘 기분 나쁨. 날씨 탓인 듯.' },
          { t: 'say', who: 'priya', text: '…날씨 탓이래요.' },
          { t: 'think', text: '날씨 탓은 아니었을 거다. 아버지는 원래 그런 얼굴이었다.' },
          { t: 'say', who: 'priya', text: '이건 개인 메모라서 규정을 확인해 볼게요. 내일 정해요. 약속해요.' },
        ],
      ],
    },
    {
      task: '파쇄할 서류 정리하고 파쇄기 돌리기',
      button: '파쇄기 돌리기',
      loc: 'bank',
      seg: 'afternoon',
      nextDay: true,
      requires: NOT_SUNDAY,
      waitingText: SUNDAY_WAIT,
      bg: 'bank',
      actors: [
        { who: 'eli', at: { x: 420, y: 552 } },
        { who: 'priya', at: { x: 760, y: 556 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '은행 창고. 파쇄기가 종이를 먹을 때마다 이를 가는 소리를 낸다.' },
          { t: 'narrate', text: '본사로 보낼 건 상자 넷. 나머지는 파쇄. 다 쓴 영수증, 지난 물때표, 커피 얼룩 묻은 메모지.' },
          { t: 'think', text: '7년 전 물때표를 넣으려다 손이 멈췄다. 아무 쓸모 없다. 넣었다.' },
          { t: 'sfx', id: 'paper' },
          { t: 'say', who: 'priya', text: '규정을 찾아봤어요. 업무 중에 쓴 수첩은 은행 재산이래요. 개인 정보가 있으면 파쇄하고요.' },
          { t: 'narrate', text: '프리야가 갈색 수첩을 들고 파쇄기 앞에 섰다. 그리고 한참 그대로 서 있었다.' },
          { t: 'say', who: 'priya', text: '…이상하네요. 파쇄기가 고장 났나 봐요.' },
          { t: 'narrate', text: '파쇄기는 멀쩡히 웅웅거리고 있었다.' },
          { t: 'say', who: 'priya', text: '고장 난 파쇄기에는 넣을 수가 없죠. 규정상.' },
          { t: 'say', who: 'priya', text: '이 수첩 절반은 아버님 얘기예요. 본사 창고보다는 할로우 씨가 갖고 계시는 게 맞는 것 같아요.' },
          {
            t: 'choice',
            options: [
              {
                text: '"…고마워요, 프리야 씨."',
                then: [{ t: 'say', who: 'priya', text: '저는 아무것도 안 했어요. 파쇄기가 고장 났을 뿐이에요.', mood: 'smile' }],
              },
              {
                text: '"이러다 프리야 씨 잘리는 거 아니에요?"',
                effects: [{ feel: 'priya', delta: 2 }],
                then: [{ t: 'say', who: 'priya', text: '그럼 할로우 씨 배에서 새우나 고르죠, 뭐. 저 숫자는 잘 세요.', mood: 'smile' }],
              },
            ],
          },
          { t: 'showItem', item: 'prop_daniel_notebook', caption: '대니얼 웹의 현장 메모 수첩. 모서리가 닳아 둥글다.' },
          { t: 'say', who: 'priya', text: '대니얼 씨는 숫자도 사람도 끝까지 보셨대요. 저도 그러고 싶어요.' },
          { t: 'effect', effects: [{ evidence: 'E_DANIEL_NOTES' }, { item: 'danielNotebook', n: 1 }] },
          { t: 'think', text: '오늘 밤에 읽자. 아니, 읽을까. …읽자.' },
        ],
      ],
    },
    {
      task: '대니얼의 수첩 읽기',
      button: '대니얼의 수첩 펴기',
      loc: 'home',
      seg: 'evening',
      bg: 'homeNight',
      actors: [{ who: 'eli', at: { x: 640, y: 552 } }],
      scenes: [
        [
          { t: 'narrate', text: '저녁. 램프 아래에서 갈색 수첩을 폈다.' },
          { t: 'think', text: '죽은 사람의 수첩. 손끝이 저절로 조심스러워진다.' },
          { t: 'letter', title: '대니얼의 수첩 — 첫 장', text: '매달 1일 09:00 메리 루 호(W.) 상환 확인.\n미납. 사유: 엔진.\n사유는 사유일 뿐. 다음 달 1일 09:00 재확인.' },
          { t: 'think', text: '매달 1일 아침 9시 정각. 부두에 서 있는 은행원이 그려진다. 아버지가 엄청 싫어했겠다.' },
          { t: 'letter', title: '몇 장 뒤', text: '현장 검증. 메리 루 동승. 오전 4시 출항.\n구토 4회. 기록은 전부 함.\nW. 웃지 않음. G. 웃음. G.가 웃는 건 처음 봄.' },
          { t: 'think', text: 'G.는 거스다. 거스가 웃었다고? 상상이 안 된다.' },
          { t: 'letter', title: '그다음 장', text: '펠리컨 한 마리가 수첩을 계속 노려봄. 이름 붙임: 장부.\nW.가 반대함. "새한테 무슨 장부야."\n장부로 결정. 장부는 장부를 좋아함.' },
          { t: 'think', text: '…장부 이름을 이 사람이 지었구나.' },
          { t: 'letter', title: '그다음 장', text: 'W. 상환 유예 신청서 제출.\n본인에게는 말하지 않음. 안 될 수도 있으니까.\n되면 그때 말할 것.' },
          { t: 'letter', title: '그다음 장', text: '1일. W.와 아침. 새우 오믈렛.\n로사 씨가 커피를 두 번 리필해 줌. 기록할 필요 없음. 기록함.' },
          { t: 'letter', title: '그다음 장', text: '축복제. 메리 루 호, 명단에 없음.\nW.는 신청서를 낸 적이 없다고 함. 그런데 매년 행렬 맨 끝에 붙어 간다고 함.\n규정 위반인지 확인함 → 축복에는 규정이 없음.' },
          { t: 'think', text: '축복제. 깃발이랑 성가랑 물 냄새. 기억이 날 듯 말 듯하다.' },
          { t: 'narrate', text: '뒤로 갈수록 메모가 짧아진다. 마지막으로 쓴 장.' },
          { t: 'letter', title: '마지막으로 쓴 장', text: '본사 회신: 유예 반려.\n통지서는 담당자가 직접 전달할 것.' },
          { t: 'narrate', text: '그다음 장부터는 비어 있다.' },
          { t: 'think', text: '…' },
          { t: 'narrate', text: '수첩을 덮는데 뒤표지 안쪽이 살짝 부풀어 있다. 습기 탓이겠지. 7년이나 상자 속에 있었으니.' },
          { t: 'think', text: '이 사람은 아버지를 W.라고 불렀다. 아버지는 이 사람을 뭐라고 불렀을까.' },
          { t: 'effect', effects: [{ flag: 'danielNotebookRead' }] },
        ],
      ],
    },
  ],
  complete: [{ feel: 'priya', delta: 15 }],
};
