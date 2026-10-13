import type { QuestDef } from './types';

/**
 * Q_CALVIN_KNOTS — Calvin's knot lessons (weeks 2–3). DESIGN §11.
 * Calvin calls the frame wall "제 취미예요" — never 수집 / collection (non-negotiable 5).
 * Plants: knotSkill (faster net repair), sawKnotWall (D03, chilling from Day 50),
 * E_WHISTLE_TEACHER via Toby's "선배님한테 배운 곡이에요!".
 * Calvin quotes back the cookout answers (D05) through the mem_* flags set there.
 */
export const Q_CALVIN_KNOTS: QuestDef = {
  id: 'Q_CALVIN_KNOTS',
  title: '캘빈의 매듭 수업',
  giver: 'calvin',
  steps: [
    {
      task: '캘빈의 오두막 현관에서 매듭 배우기',
      button: '매듭 수업 받기',
      loc: 'calvinCabin',
      seg: 'afternoon',
      repeat: 3,
      bg: 'calvinYard',
      actors: [
        { who: 'eli', at: { x: 420, y: 560 } },
        { who: 'calvin', at: { x: 720, y: 560 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '캘빈의 오두막 현관. 난간에 밧줄 토막이 길이별로 가지런히 걸려 있다.' },
          { t: 'say', who: 'calvin', text: '왔어요? 앉아요. 오늘은 보라인. 매듭의 왕이에요.' },
          { t: 'say', who: 'calvin', text: '토끼가 굴에서 나와요. 나무를 한 바퀴 돌고, 다시 굴로 들어가요. 끝.' },
          { t: 'say', who: 'eli', text: '토끼요?' },
          { t: 'say', who: 'calvin', text: '애들 가르칠 때 쓰는 말이에요. 어른한테도 잘 먹혀요.' },
          { t: 'minigame', id: 'knot', params: { points: 5 } },
          {
            t: 'if',
            cond: { flag: 'mg_knot_good' },
            then: [{ t: 'say', who: 'calvin', text: '봐요, 토끼가 집에 잘 들어갔잖아요.' }],
            else: [{ t: 'say', who: 'calvin', text: '토끼가 길을 좀 잃었네요. 괜찮아요. 토끼는 원래 그래요.' }],
          },
          {
            t: 'if',
            cond: { flag: 'mem_letters_closed' },
            then: [
              { t: 'say', who: 'calvin', text: '편지는 아직이죠? 못 열겠다고 했잖아요.' },
              { t: 'say', who: 'calvin', text: '매듭이랑 비슷해요. 손이 먼저 알아요. 마음은 나중에 와요.' },
            ],
            else: [
              {
                t: 'if',
                cond: { flag: 'mem_letters_burn' },
                then: [
                  { t: 'say', who: 'calvin', text: '편지는 태웠어요? 태울까 한다고 했잖아요.' },
                  { t: 'say', who: 'calvin', text: '아, 대답 안 해도 돼요. 그냥 생각이 나서요.' },
                ],
                else: [
                  {
                    t: 'if',
                    cond: { flag: 'mem_letters_read' },
                    then: [{ t: 'say', who: 'calvin', text: '편지는 아직도 새우 얘기뿐이에요? 저번에 그랬잖아요. 하하, 궁금해서요.' }],
                    else: [{ t: 'say', who: 'calvin', text: '손이 좋네요. 어부 손이 돼 가요.' }],
                  },
                ],
              },
            ],
          },
          { t: 'say', who: 'calvin', text: '내일도 와요. 내일은 말뚝 매듭.' },
          { t: 'think', text: '서른두 살에 토끼 매듭을 배웠다. 이력서에 쓸까.' },
        ],
        [
          { t: 'narrate', text: '이틀째. 캘빈이 현관 기둥을 말뚝 삼아 밧줄을 건다.' },
          { t: 'say', who: 'calvin', text: '오늘은 클로브 히치. 말뚝에 배 묶을 때 쓰는 거예요.' },
          {
            t: 'if',
            cond: { eventDone: 'W2_LINES_CUT' },
            then: [
              { t: 'say', who: 'calvin', text: '그날 새벽에 제가 메리 루 묶은 게 이거예요. 기억나요?' },
              { t: 'say', who: 'eli', text: '삼 초 걸렸죠.' },
              { t: 'say', who: 'calvin', text: '일라이 씨는 삼십 초 안에만 해요. 그럼 합격.' },
            ],
            else: [{ t: 'say', who: 'calvin', text: '두 번 감고, 한 번 엇걸고, 당기면 끝. 익으면 삼 초예요.' }],
          },
          { t: 'minigame', id: 'knot', params: { points: 6 } },
          {
            t: 'if',
            cond: { flag: 'mem_lines_stubborn' },
            then: [{ t: 'say', who: 'calvin', text: '이 동네 사람들 끈질기다고 했죠? 그럼 우리는 더 끈질기게 묶으면 돼요.' }],
            else: [{ t: 'say', who: 'calvin', text: '좋아요. 이제 누가 밧줄을 잘라도 일라이 씨가 다시 묶으면 돼요.' }],
          },
          { t: 'say', who: 'eli', text: '자르는 쪽이 더 빠를걸요.' },
          { t: 'say', who: 'calvin', text: '하하. 그럼 우리가 더 빨리 묶으면 되죠.' },
          { t: 'narrate', text: '캘빈은 말하는 내내 손을 쉬지 않는다. 밧줄 토막을 묶었다 풀었다 한다.' },
          { t: 'think', text: '손이 심심하면 매듭을 묶는다더니. 정말인가 보다.' },
        ],
        [
          { t: 'narrate', text: '사흘째. 현관 바닥에 끊어진 밧줄 두 가닥이 놓여 있다.' },
          { t: 'say', who: 'calvin', text: '마지막은 피셔맨 매듭. 끊어진 줄 두 개를 하나로 잇는 거예요.' },
          { t: 'say', who: 'calvin', text: '잘 이으면 원래 하나였던 것처럼 보여요. 이은 자리가 제일 튼튼해지고요.' },
          { t: 'minigame', id: 'knot', params: { points: 7 } },
          {
            t: 'if',
            cond: { flag: 'mg_knot_good' },
            then: [{ t: 'say', who: 'calvin', text: '와. 이건 저보다 낫네요. 거스 씨가 질투하겠어요.' }],
            else: [{ t: 'say', who: 'calvin', text: '조금 헐겁지만 괜찮아요. 바다는 너그러워요. 대부분은요.' }],
          },
          {
            t: 'if',
            cond: { flag: 'mem_knots_free' },
            then: [{ t: 'say', who: 'calvin', text: '수업료 물어봤던 거 기억나요. 졸업해도 공짜예요.' }],
          },
          { t: 'say', who: 'calvin', text: '내일은 안으로 들어와요. 보여 줄 게 있어요. 별건 아니고요.' },
          { t: 'think', text: '별거 아니라는 말은 보통 별거라는 뜻이다.' },
        ],
      ],
      effects: [{ flag: 'knotLessonsDone' }],
    },
    {
      task: '캘빈의 오두막 안, 떨어진 매듭 액자 다시 걸기',
      button: '액자 거는 거 돕기',
      loc: 'calvinCabin',
      seg: 'afternoon',
      nextDay: true,
      bg: 'calvinCabin',
      actors: [
        { who: 'eli', at: { x: 300, y: 560 } },
        { who: 'calvin', at: { x: 1140, y: 560 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '캘빈의 오두막 안. 처음 들어와 본다. 커피 냄새, 밀랍 냄새, 밧줄 냄새.' },
          { t: 'narrate', text: '한쪽 벽 가득 작은 나무 액자. 액자마다 매듭이 하나씩 들어 있다.' },
          { t: 'say', who: 'calvin', text: '어젯밤 바람에 하나가 떨어졌어요. 같이 좀 걸어 줄래요? 제 팔이 짧아서.' },
          { t: 'narrate', text: '바닥의 액자를 집어 든다. 안에 동그란 매듭 하나. 유리는 멀쩡하다.' },
          {
            t: 'choice',
            options: [
              {
                text: '맨 윗줄 빈 못에 건다.',
                then: [{ t: 'say', who: 'calvin', text: '거기 맞아요. 순서대로 걸어 놨거든요.' }],
              },
              {
                text: '손 닿는 아무 데나 건다.',
                then: [
                  { t: 'say', who: 'calvin', text: '아, 거기 말고 그 옆이요. 순서가 있어요.' },
                  { t: 'say', who: 'calvin', text: '제가 이런 데선 좀 깐깐해요. 하하.' },
                ],
              },
            ],
          },
          { t: 'narrate', text: '액자 아래마다 작은 꼬리표가 붙어 있다. 숫자가 적혀 있는데 글씨가 너무 작다. 날짜 같다.' },
          { t: 'say', who: 'eli', text: '이게 다 캘빈 씨가 묶은 거예요?' },
          { t: 'say', who: 'calvin', text: '네. 제 취미예요.', mood: 'smile' },
          { t: 'say', who: 'calvin', text: '마음에 드는 매듭을 묶은 날, 하나씩 걸어요. 그날 날짜 적어서. 일기 같은 거죠.' },
          { t: 'think', text: '일기를 매듭으로 쓰는 사람. 이 동네엔 별사람이 다 있다.' },
          { t: 'narrate', text: '맨 끝 액자 하나만 비어 있다. 못도 박혀 있고 꼬리표 자리도 있는데, 안이 비었다.' },
          { t: 'say', who: 'eli', text: '저건 왜 비어 있어요?' },
          { t: 'say', who: 'calvin', text: '아직이에요.' },
          { t: 'say', who: 'calvin', text: '좋은 매듭은 서두르면 안 돼요. 때가 되면 채워져요.' },
          { t: 'narrate', text: '캘빈이 웃는다. 늘 웃는 얼굴이다.' },
          { t: 'say', who: 'calvin', text: '아, 이거 가져가요. 연습용 밧줄. 그물 꿰맬 때 손이 훨씬 빨라질 거예요.' },
          { t: 'effect', effects: [{ item: 'knotRope', n: 1 }, { flag: 'knotSkill' }, { flag: 'sawKnotWall' }] },
          { t: 'say', who: 'calvin', text: '그리고 부탁 하나만. 토비한테 이것 좀 갖다줄래요? 매듭 연습판이에요.' },
          { t: 'say', who: 'calvin', text: '보안관보 시험에 매듭이 나온대요. 걔가 그 얘기를 일주일째 해요.' },
          { t: 'effect', effects: [{ item: 'knotBoard', n: 1 }] },
          { t: 'think', text: '심부름이 하나 늘었다. 이 동네에선 일이 일을 낳는다.' },
        ],
      ],
    },
    {
      task: '보안관 사무실, 토비에게 매듭 연습판 갖다주기',
      button: '연습판 전해 주기',
      loc: 'sheriff',
      seg: 'afternoon',
      bg: 'sheriff',
      actors: [
        { who: 'eli', at: { x: 420, y: 560 } },
        { who: 'toby', at: { x: 820, y: 560 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '보안관 사무실. 문을 열기도 전에 안에서 휘파람 소리가 새어 나온다.' },
          { t: 'sfx', id: 'whistle' },
          { t: 'notes', who: 'toby', on: true },
          { t: 'narrate', text: '짧은 가락. 장례식 날 관을 들며 불던 그 가락이다.' },
          { t: 'wait', ms: 1200 },
          { t: 'notes', who: 'toby', on: false },
          { t: 'say', who: 'toby', text: '일라이 씨! 아, 그거 선배님 연습판이죠? 와, 진짜 갖다주셨네요!', mood: 'happy' },
          {
            t: 'choice',
            options: [
              { text: '"방금 그 곡, 무슨 노래예요?"', then: [{ t: 'say', who: 'toby', text: '아, 이거요? 선배님한테 배운 곡이에요!' }] },
              { text: '"휘파람 잘 부네요."', then: [{ t: 'say', who: 'toby', text: '헤헤, 그래요? 선배님한테 배운 곡이에요!' }] },
            ],
          },
          { t: 'say', who: 'toby', text: '제가 막 들어왔을 때 선배님이 순찰 같이 돌면서 불어 주셨어요. 걸을 때 박자 맞추기 좋다고요.' },
          { t: 'say', who: 'toby', text: '근데 선배님은 사람들 앞에선 잘 안 부세요. 쑥스러우신가 봐요. 저만 알아요. 헤헤.' },
          { t: 'effect', effects: [{ evidence: 'E_WHISTLE_TEACHER' }, { item: 'knotBoard', n: -1 }] },
          { t: 'think', text: '캘빈 씨가 휘파람을. 잘 상상이 안 간다.' },
          { t: 'say', who: 'toby', text: '일라이 씨, 혹시 보라인 할 줄 알아요? 시험에 나온대요. 토끼가… 굴에서… 어디로 가더라?' },
          {
            t: 'choice',
            options: [
              {
                text: '보라인을 천천히 묶어 보여 준다.',
                effects: [{ feel: 'toby', delta: 3 }],
                then: [
                  { t: 'narrate', text: '토끼가 굴에서 나와 나무를 돌고 다시 굴로. 토비가 입을 벌리고 본다.' },
                  { t: 'say', who: 'toby', text: '와! 선배님이랑 똑같이 묶으시네요!' },
                ],
              },
              {
                text: '"캘빈 씨한테 직접 물어봐요."',
                then: [{ t: 'say', who: 'toby', text: '선배님은 바쁘시잖아요. 새벽마다 바다 나가시고. 그럼 그림 보고 해 볼게요!' }],
              },
            ],
          },
          { t: 'say', who: 'toby', text: '시험 붙으면 제가 로사네 파이 살게요. 사과 말고 피칸으로요!' },
          { t: 'think', text: '나서는데 등 뒤로 휘파람이 따라 나온다. 어디서든 들리는 가락이다.' },
          { t: 'think', text: '내일 새벽엔 그물 수선이 금방 끝나겠다. 토끼 덕분에.' },
        ],
      ],
    },
  ],
  complete: [{ feel: 'toby', delta: 5 }, { flag: 'calvinKnotsDone' }],
};
