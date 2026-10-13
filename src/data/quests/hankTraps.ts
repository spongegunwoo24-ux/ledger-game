import type { QuestDef } from './types';

/**
 * Q_HANK_TRAPS — Hank's lost crab traps (week 3). DESIGN §11.
 * The traps come up in the net (STORY_CATCH s_hank_trap_river / s_hank_trap_oyster, from step 1 on);
 * keeping one on deck sets `story_<id>` = 'kept', which opens the matching cleaning step.
 * Plants: hankNightTrapper (Hank is out at 2 a.m. every night) → E_PIKE_CAR at Hank ≥ 60
 * (events/week2_3 HANK_NIGHT_CAR, week 4+); fishermen +10 toward market access.
 */
export const Q_HANK_TRAPS: QuestDef = {
  id: 'Q_HANK_TRAPS',
  title: '행크의 잃어버린 통발',
  giver: 'hank',
  steps: [
    {
      task: '등대 언덕에서 행크의 표지 맞춰 보기',
      button: '표지 맞춰 보기',
      loc: 'lighthouse',
      seg: 'afternoon',
      bg: 'lighthouse',
      actors: [{ who: 'eli', at: { x: 420, y: 560 } }],
      scenes: [
        [
          { t: 'narrate', text: '등대 언덕. 바람이 세다. 만 전체가 한눈에 들어온다.' },
          { t: 'think', text: '행크 말대로라면, 여기서 보면 표지가 겹쳐 보인다.' },
          { t: 'narrate', text: '강 하구 쪽. 빨간 지붕 통조림 창고. 그 뒤로 성당 종탑 꼭대기.' },
          {
            t: 'choice',
            options: [
              {
                text: '창고 지붕과 종탑이 겹치는 자리를 찾는다.',
                then: [{ t: 'narrate', text: '한 걸음 옆으로. 또 한 걸음. 종탑이 창고 지붕 위에 딱 올라앉는다.' }],
              },
              {
                text: '일단 물 위의 부표부터 센다.',
                then: [
                  { t: 'narrate', text: '부표는 열한 개. 행크 것은 하나도 없다. 부표가 있어야 할 자리가 비어 있다.' },
                  { t: 'think', text: '…행크가 시킨 대로 하자. 지붕이랑 종탑.' },
                ],
              },
            ],
          },
          { t: 'narrate', text: '그 선을 따라 내려가면 강 하구 바로 앞. 물빛이 조금 진한 데.' },
          { t: 'narrate', text: '굴 양식장 쪽. 말뚝이 줄지어 박혀 있다. 세 번째 줄 바깥, 거기도 부표가 없다.' },
          { t: 'think', text: '두 군데. 강 하구, 굴 양식장 남쪽. 아버지 해도에 연필로 동그라미를 쳐 두자.' },
          { t: 'narrate', text: '발밑으로 등대 앞바다가 펼쳐져 있다. 반짝이고, 조용하다. 다른 데랑 똑같은 물이다.' },
          { t: 'think', text: '아버지 X. 여기서 보니 그냥 물이다.' },
          { t: 'think', text: '새벽에 강 하구나 굴 양식장에 그물을 내리면 걸려 올라오겠지. 운이 좋으면.' },
          { t: 'effect', effects: [{ flag: 'hankMarks' }] },
        ],
      ],
    },
    {
      task: '강 하구에서 건진 통발 씻고 꿰매기',
      button: '통발 손질하기 (강 하구)',
      loc: 'dock',
      seg: 'afternoon',
      requires: { flag: 'story_s_hank_trap_river', eq: 'kept' },
      waitingText: '새벽 바다, 강 하구에 그물 내리기 — 행크의 통발이 걸려 오면 갑판에서 챙기기',
      bg: 'dock',
      actors: [{ who: 'eli', at: { x: 420, y: 548 } }],
      scenes: [
        [
          { t: 'narrate', text: '부두 수돗가. 아침 그물에 걸려 올라온 통발을 내려놓았다. 진흙과 해초 범벅.' },
          { t: 'narrate', text: '나무틀에 놋쇠 이름표. "H." 한 글자. 행크 거 맞다.' },
          { t: 'narrate', text: '안에 게 세 마리가 잔뜩 화가 나 있다. 며칠 갇혀 있던 얼굴이다.' },
          {
            t: 'choice',
            options: [
              {
                text: '게를 바다로 놓아준다.',
                then: [{ t: 'narrate', text: '게들이 옆걸음으로 부두 끝까지 가서 퐁당. 인사는 없었다.' }],
              },
              {
                text: '게를 통에 담아 행크 몫으로 둔다.',
                effects: [{ flag: 'hankCrabsKept' }],
                then: [{ t: 'think', text: '행크 통발에 든 게니까 행크 거다. 이 동네 법은 모르지만 아마 그럴 거다.' }],
              },
            ],
          },
          { t: 'narrate', text: '한쪽 그물코가 터져 있다. 바닥에 끌리면서 찢긴 모양이다.' },
          { t: 'minigame', id: 'knot', params: { points: 5 } },
          {
            t: 'if',
            cond: { flag: 'knotSkill' },
            then: [{ t: 'think', text: '연습용 밧줄 덕인지 손이 빠르다. 토끼가 굴에 쏙쏙 들어간다.' }],
            else: [{ t: 'think', text: '꿰맸다. 영감한테 배운 대로, 한 코도 건너뛰지 않고.' }],
          },
          {
            t: 'if',
            cond: { flag: 'story_s_hank_trap_oyster', eq: 'kept' },
            then: [{ t: 'think', text: '굴 양식장 것도 이미 건져 놨다. 그것만 손보면 된다.' }],
            else: [{ t: 'think', text: '하나 남았다. 굴 양식장 남쪽, 말뚝 세 번째 줄 바깥.' }],
          },
        ],
      ],
    },
    {
      task: '굴 양식장에서 건진 통발 씻고 꿰매기',
      button: '통발 손질하기 (굴 양식장)',
      loc: 'dock',
      seg: 'afternoon',
      requires: { flag: 'story_s_hank_trap_oyster', eq: 'kept' },
      waitingText: '새벽 바다, 굴 양식장에 그물 내리기 — 행크의 두 번째 통발이 걸려 오면 갑판에서 챙기기',
      bg: 'dock',
      actors: [{ who: 'eli', at: { x: 420, y: 548 } }],
      scenes: [
        [
          { t: 'narrate', text: '두 번째 통발. 굴 껍데기가 다닥다닥 붙어 두 배는 무겁다.' },
          { t: 'narrate', text: '문을 열자 문어 한 마리가 천천히 기어 나와 내 손등을 한 번 짚고는, 판자 틈으로 사라졌다.' },
          { t: 'think', text: '세 들어 살던 놈인가 보다. 집주인 몰래.' },
          { t: 'narrate', text: '나무틀 하나가 빠져 있다. 철사로 단단히 묶고, 터진 그물을 꿰맨다.' },
          { t: 'minigame', id: 'knot', params: { points: 6 } },
          { t: 'think', text: '둘 다 찾았다. 바다에서 남의 물건을 건져 돌려주는 일. 생각보다 기분이 괜찮다.' },
          { t: 'think', text: '어시장에 행크가 있을 거다. 양손에 하나씩 들고 가자.' },
        ],
      ],
    },
    {
      task: '어시장, 행크에게 통발 두 개 돌려주기',
      button: '통발 돌려주기',
      loc: 'fishMarket',
      seg: 'afternoon',
      bg: 'fishMarket',
      actors: [
        { who: 'eli', at: { x: 400, y: 548 } },
        { who: 'hank', at: { x: 800, y: 548 }, face: -1 },
        { who: 'fisherman', at: { x: 1080, y: 548 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '어시장. 통발 두 개를 양손에 들고 들어서자 수군거림이 뚝 그친다.' },
          { t: 'say', who: 'fisherman', text: '…저거 행크 통발 아냐?' },
          { t: 'narrate', text: '행크가 통발을 받아 든다. 이름표를 엄지로 문지르고, 내가 꿰맨 자리를 한참 들여다본다.' },
          { t: 'say', who: 'hank', text: '…누구한테 배웠냐, 이 매듭.' },
          {
            t: 'choice',
            options: [
              {
                text: '"거스 영감님이요."',
                effects: [{ feel: 'hank', delta: 5 }],
                then: [{ t: 'say', who: 'hank', text: '거스. 그럼 그렇지. 촌스럽게 튼튼하네.' }],
              },
              {
                text: '"캘빈 씨가 가르쳐 줬어요."',
                cond: { flag: 'knotSkill' },
                effects: [{ feel: 'hank', delta: 3 }],
                then: [{ t: 'say', who: 'hank', text: '캘빈? …흠. 그 양반 매듭은 예쁘지. 너무 예뻐.' }],
              },
              {
                text: '"혼자 익혔어요."',
                then: [{ t: 'say', who: 'hank', text: '거짓말. 매듭은 혼자 안 배워진다.' }],
              },
            ],
          },
          {
            t: 'if',
            cond: { flag: 'hankCrabsKept' },
            then: [
              { t: 'narrate', text: '게 통도 내밀었다. 통발 안에 들어 있던 놈들.' },
              { t: 'say', who: 'hank', text: '…게까지 챙겨 왔냐.' },
              { t: 'effect', effects: [{ feel: 'hank', delta: 3 }] },
            ],
          },
          { t: 'say', who: 'hank', text: '어이, 다들 봐. 할로우 아들이 내 통발 건져 왔다. 꿰매서.' },
          { t: 'narrate', text: '어부들이 눈을 피한다. 그래도 몇은 고개를 아주 조금 끄덕인다.' },
          { t: 'say', who: 'hank', text: '나는 40년째 새벽 두 시면 통발 걷으러 나간다. 그 시간 바다는 내 거야.' },
          { t: 'say', who: 'hank', text: '그 시간엔 별게 다 보여. 다들 자니까 아무도 안 물어볼 뿐이지.' },
          { t: 'say', who: 'hank', text: '내일 새벽 좌판에 와라. 니 미끼는 반값이다. 내일만 그런 거 아니고.' },
          { t: 'effect', effects: [{ flag: 'hankBaitDiscount' }, { flag: 'hankNightTrapper' }] },
          { t: 'think', text: '행크 좌판에서 반값. 이 동네에서 처음 받아 보는 할인이다.' },
        ],
      ],
    },
  ],
  complete: [{ feel: 'hank', delta: 30 }, { feel: 'fishermen', delta: 10 }, { flag: 'hankTrapsDone' }],
};
