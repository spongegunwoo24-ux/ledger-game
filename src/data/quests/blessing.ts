import type { Cond } from '../../core/conditions';
import type { QuestDef } from './types';

/** Everything must be ready before the festival (Day 34, Thursday afternoon). */
const BEFORE_FESTIVAL: Cond = { day: { lte: 33 } };
const FESTIVAL_WAIT = '축복제 날이다. 준비는 여기까지.';

/**
 * Q_BLESSING — get Mary Lou blessed at the Blessing of the Fleet (week 5). DESIGN §11, §9 W5_FESTIVAL.
 * Repaint Mary Lou at dawn → carry wreaths at the church and ask Father Matthew → decorate the
 * church boats on the dock (2 days). Rewards sit on the last step (not on `complete`) so that the
 * festival can close an unfinished quest without paying out.
 * Sets `blessingPainted` (Gus deck line) and `blessingReady`.
 */
export const Q_BLESSING: QuestDef = {
  id: 'Q_BLESSING',
  title: '축복제 준비: 메리 루 단장',
  giver: 'matthew',
  steps: [
    {
      task: '출항 전에 메리 루 닦고 칠하기',
      button: '메리 루 단장하기',
      loc: 'dock',
      seg: 'dawn',
      minDay: 30,
      requires: BEFORE_FESTIVAL,
      waitingText: FESTIVAL_WAIT,
      bg: 'dock',
      actors: [
        { who: 'eli', at: { x: 420, y: 548 } },
        { who: 'gus', at: { x: 800, y: 548 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '새벽 네 시. 페인트 통과 솔, 철수세미를 들고 메리 루 옆에 섰다.' },
          { t: 'say', who: 'gus', text: '…뭐 하냐.' },
          { t: 'say', who: 'eli', text: '축복제요. 명단엔 없지만.' },
          { t: 'say', who: 'gus', text: '…' },
          { t: 'narrate', text: '거스는 아무 말 없이 장화를 벗더니 철수세미 하나를 집어 들었다.' },
          { t: 'say', who: 'gus', text: '이물부터. 따개비는 결 따라 긁어. 거꾸로 하면 나무 상한다.' },
          { t: 'sfx', id: 'brush' },
          { t: 'narrate', text: '한 시간 동안 둘이서 말없이 긁었다.' },
          { t: 'narrate', text: '따개비가 갑판에 우수수 떨어지고, 장부가 그걸 하나씩 쪼아 보다 뱉었다.' },
          {
            t: 'if',
            cond: { flag: 'graffiti' },
            then: [
              { t: 'narrate', text: '월요일 밤에 또 누가 다녀갔다. 빨간 글씨가 아직 다 마르지도 않았다.' },
              { t: 'say', who: 'gus', text: '…그것부터 덮어.' },
              { t: 'minigame', id: 'paint', params: { word: 'KILLER' } },
              { t: 'effect', effects: [{ clearFlag: 'graffiti' }] },
            ],
            else: [
              {
                t: 'if',
                cond: { flag: 'paintedOver', eq: 'good' },
                then: [
                  { t: 'narrate', text: '좋은 페인트는 버텼다. 대신 난간 밑으로 녹물이 줄줄 흘러내렸다.' },
                  { t: 'minigame', id: 'paint', params: { word: '녹물' } },
                ],
                else: [
                  { t: 'narrate', text: '해가 뜨자 지난번에 덮은 자리에서 글씨가 희미하게 비친다. 싼 페인트의 한계다.' },
                  { t: 'minigame', id: 'paint', params: { word: 'KILLER' } },
                  { t: 'think', text: '남은 페인트도 싼 거다. 맑은 날엔 또 비치겠지. 목요일까지만 버텨라.' },
                ],
              },
            ],
          },
          { t: 'narrate', text: '해가 올라올 무렵, 메리 루가 조금 덜 늙어 보였다.' },
          { t: 'say', who: 'gus', text: '…이름도.' },
          { t: 'narrate', text: '거스가 가는 붓으로 뱃머리의 이름 글자를 덧칠했다. MARY의 R 자 앞에서 붓이 한참 멈췄다.' },
          { t: 'narrate', text: 'R 자는 조금 기울어 있다. 거스는 고치지 않고 그대로 따라 칠했다.' },
          {
            t: 'if',
            cond: { lettersReadGte: 4 },
            then: [{ t: 'think', text: '아버지 편지에 있었다. 이름 칠하던 날 엄마가 R 자가 삐뚤다고 웃었다고. 고치지 말라고.' }],
            else: [{ t: 'think', text: '삐뚤어진 걸 굳이 삐뚤게 칠한다. 이유는 안 물어봤다.' }],
          },
          { t: 'say', who: 'gus', text: '됐다. 나가자. 물때 놓친다.' },
          { t: 'think', text: '오후에 성당에 가 보자. 칠한 배로는 부탁이라도 해 볼 수 있겠지.' },
          { t: 'effect', effects: [{ flag: 'blessingPainted' }, { feel: 'gus', delta: 2 }] },
        ],
      ],
    },
    {
      task: '성당에서 축복제 화환 상자 나르고 신부님께 부탁하기',
      button: '화환 상자 나르기',
      loc: 'church',
      seg: 'afternoon',
      requires: BEFORE_FESTIVAL,
      waitingText: FESTIVAL_WAIT,
      bg: 'church',
      actors: [
        { who: 'eli', at: { x: 400, y: 548 } },
        { who: 'matthew', at: { x: 760, y: 540 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '성당. 제단 옆에 종이꽃 화환이 담긴 상자가 산처럼 쌓여 있다.' },
          { t: 'say', who: 'matthew', text: '아, 일라이 씨. 마침 잘 오셨어요. 이거 부두로 가는 수레에 실어야 하는데요.' },
          { t: 'say', who: 'matthew', text: '제 허리가 성가대 아이들보다 먼저 은퇴하고 싶어 해서요.' },
          { t: 'minigame', id: 'carry', params: { label: '화환 상자', count: 3 } },
          { t: 'say', who: 'matthew', text: '고마워요. 덕분에 오늘 저녁 기도는 허리 얘기 말고 다른 걸 할 수 있겠어요.' },
          { t: 'say', who: 'eli', text: '신부님. 부탁이 있어요.' },
          { t: 'say', who: 'eli', text: '메리 루도… 축복받을 수 있을까요. 명단엔 없는데요.' },
          { t: 'narrate', text: '신부님은 화환에서 떨어진 종이꽃 한 송이를 주워 상자에 도로 꽂았다.' },
          { t: 'say', who: 'matthew', text: '행렬 명단은 어부 조합이 정해요. 저는 그 명단을 고칠 수가 없어요.' },
          { t: 'think', text: '그렇겠지.' },
          { t: 'say', who: 'matthew', text: '그런데 성당 배 두 척은 제 거예요. 그 뒤에 한 척이 더 따라오는 걸 제가 막을 이유는 없죠.' },
          { t: 'say', who: 'matthew', text: '맨 끝자리예요. 괜찮으시겠어요?' },
          {
            t: 'choice',
            options: [
              {
                text: '"맨 끝이면 충분해요."',
                effects: [{ feel: 'matthew', delta: 3 }],
                then: [{ t: 'say', who: 'matthew', text: '맨 끝은 물이 제일 많이 남는 자리예요. 제가 손이 좀 커서요.', mood: 'smile' }],
              },
              {
                text: '"사람들이 신부님 욕할 텐데요."',
                then: [{ t: 'say', who: 'matthew', text: '욕하는 분들도 일요일엔 제 앞에 앉으세요. 저는 그걸로 충분해요.' }],
              },
            ],
          },
          { t: 'say', who: 'matthew', text: '대신 저도 부탁이 있어요. 성당 배를 꾸며야 하는데, 제가 묶은 매듭은 아이들이 보고 웃어요.' },
          { t: 'say', who: 'matthew', text: '내일부터 부두에서 깃발이랑 화환 다는 것 좀 도와주시겠어요? 이틀이면 될 거예요.' },
          { t: 'think', text: '부탁하러 왔다가 일거리를 받았다. 이 동네 방식인가 보다.' },
        ],
      ],
    },
    {
      task: '부두에서 성당 배 두 척 꾸미기',
      button: '성당 배 꾸미기',
      loc: 'dock',
      seg: 'afternoon',
      nextDay: true,
      repeat: 2,
      requires: BEFORE_FESTIVAL,
      waitingText: FESTIVAL_WAIT,
      bg: 'dock',
      actors: [
        { who: 'eli', at: { x: 420, y: 548 } },
        { who: 'matthew', at: { x: 760, y: 540 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '부두. 성당 배 두 척이 나란히 묶여 있다.' },
          { t: 'narrate', text: '페인트가 벗겨진 하얀 나룻배. "성 베드로"와 "성 안드레아".' },
          { t: 'say', who: 'matthew', text: '어부 성인 두 분이에요. 둘 다 그물을 버리고 따라가셨죠. 그래서 배가 이 모양인가 봐요.' },
          { t: 'say', who: 'matthew', text: '깃발 줄을 뱃머리에서 고물까지요. 매듭은 일라이 씨한테 맡길게요.' },
          { t: 'minigame', id: 'knot', params: { points: 6 } },
          {
            t: 'if',
            cond: { flag: 'mg_knot_good' },
            then: [{ t: 'say', who: 'matthew', text: '와. 거스 씨한테 배우셨죠? 매듭에서 고집이 느껴져요.', mood: 'smile' }],
            else: [{ t: 'say', who: 'matthew', text: '…바람이 세게 불면 저랑 같이 붙잡고 있어요. 기도하면서.' }],
          },
          { t: 'narrate', text: '지나가던 어부 하나가 걸음을 멈추고 매듭을 들여다봤다. 아무 말 없이 고개를 한 번 끄덕이고 갔다.' },
          { t: 'think', text: '방금 그거, 인사였나.' },
          { t: 'say', who: 'matthew', text: '내일은 화환이에요. 오늘 나른 그 상자들요. 또 만나요.' },
        ],
        [
          { t: 'narrate', text: '부두. 어제 묶은 깃발 줄이 바람에 팽팽하게 울고 있다. 한 코도 안 풀렸다.' },
          {
            t: 'if',
            cond: { quest: 'Q_BOTTLE', state: 'done' },
            then: [
              { t: 'enter', who: 'maisie', at: { x: 1060, y: 560 }, face: -1 },
              { t: 'say', who: 'maisie', text: '일라이 아저씨! 나 종이배 만들었어요. 축복제 때 띄울 거예요. 비스킷 이름 써 놨어요!' },
              { t: 'exit', who: 'maisie', to: { x: 1400, y: 560 }, ms: 1200 },
            ],
          },
          { t: 'say', who: 'matthew', text: '화환은 성모님 쪽이 위로 오게요. 거꾸로 달면 성모님이 멀미하세요.' },
          { t: 'minigame', id: 'carry', params: { label: '화환', count: 2 } },
          { t: 'narrate', text: '다 달고 보니 하얀 나룻배 두 척이 꽃밭처럼 떠 있다.' },
          { t: 'narrate', text: '그 옆에 메리 루가 묶여 있다. 깃발도 화환도 없이. 그래도 새 페인트가 햇빛에 반짝인다.' },
          { t: 'say', who: 'matthew', text: '목요일 두 시예요. 성 안드레아 바로 뒤. 늦으면 물이 다 떨어져요.' },
          { t: 'say', who: 'matthew', text: '그리고 일라이 씨. 축복은 배한테만 하는 게 아니에요. 타는 사람한테도 해요.' },
          { t: 'think', text: '…그 말은 못 들은 걸로 하자. 괜히 목이 멘다.' },
          {
            t: 'if',
            cond: { feel: 'fishermen', gte: 40 },
            then: [{ t: 'think', text: '부두 끝에서 어부 몇이 이쪽을 보고 있다. 예전처럼 등을 돌리지는 않는다.' }],
            else: [{ t: 'think', text: '부두 끝 어부들은 여전히 이쪽을 안 본다. 목요일에 저 사람들 앞을 지나가야 한다.' }],
          },
        ],
      ],
      effects: [{ feel: 'matthew', delta: 15 }, { feel: 'fishermen', delta: 5 }, { flag: 'blessingReady' }],
    },
  ],
};
