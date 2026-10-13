import type { QuestDef } from './types';

/**
 * Q_NORA_PHOTO — shrimp-season photos for Nora (weeks 3–4). DESIGN §11.
 * Plants: noraArchiveSeen + the print holdPhotoPrint (the hold-evidence photo: the items
 * look new and dry — meaningful only from Day 36, when E_NORA_EVIDENCE_PHOTO is granted),
 * noraPhotoDone + Nora +20 (trust needed for E_NORA_NOTES at the hearing), cameraOwned (photo wall).
 */
export const Q_NORA_PHOTO: QuestDef = {
  id: 'Q_NORA_PHOTO',
  title: '노라의 새우 철 사진',
  giver: 'nora',
  steps: [
    {
      task: '해 뜰 때 나가는 새우잡이 배 찍기',
      button: '해돋이 사진 찍기',
      loc: 'dock',
      seg: 'dawn',
      bg: 'dock',
      actors: [
        { who: 'eli', at: { x: 420, y: 548 } },
        { who: 'gus', at: { x: 860, y: 548 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '새벽. 수평선이 분홍색으로 갈라진다. 새우잡이 배들이 그물 붐을 날개처럼 펴고 나간다.' },
          { t: 'think', text: '노라 말로는 이게 새우 철의 얼굴이란다. 매일 봐서 몰랐다.' },
          { t: 'minigame', id: 'photo', params: { subject: 'boat_other', caption: '날개 편 새우잡이 배.' } },
          { t: 'say', who: 'gus', text: '…뭐 찍냐.' },
          { t: 'say', who: 'eli', text: '노라 씨 부탁이에요. 새우 철 사진.' },
          { t: 'say', who: 'gus', text: '그 기자. …나는 찍지 마.' },
          { t: 'narrate', text: '거스가 등을 돌리고 선다. 프레임 밖으로 정확히 한 걸음 비켜서.' },
          {
            t: 'if',
            cond: { flag: 'mg_photo_good' },
            then: [{ t: 'think', text: '잘 나온 것 같다. 아마도. 필름은 뽑아 봐야 안다.' }],
            else: [{ t: 'think', text: '배가 좀 흔들렸다. 바다 사진은 원래 흔들리는 거라고 우기자.' }],
          },
        ],
      ],
    },
    {
      task: '갑판에서 새우 고르는 손 찍기',
      button: '갑판 사진 찍기',
      loc: 'dock',
      seg: 'afternoon',
      bg: 'dock',
      actors: [
        { who: 'eli', at: { x: 420, y: 548 } },
        { who: 'fisherman', at: { x: 860, y: 548 }, face: -1 },
      ],
      scenes: [
        [
          { t: 'narrate', text: '오후 부두. 옆 배 갑판에서 어부 하나가 아침에 못 다 고른 새우를 고르고 있다.' },
          { t: 'say', who: 'fisherman', text: '…뭘 봐, 할로우.' },
          {
            t: 'choice',
            options: [
              {
                text: '"손만 찍을게요. 얼굴은 안 나와요."',
                effects: [{ feel: 'fishermen', delta: 2 }],
                then: [{ t: 'say', who: 'fisherman', text: '…손만이다.' }],
              },
              {
                text: '"노라 씨가 부탁했어요."',
                then: [
                  { t: 'say', who: 'fisherman', text: '그 기자? 7년 전에 우리 사진 실컷 찍어 갔지. 니 아버지 얘기 쓴다고.' },
                  { t: 'say', who: 'fisherman', text: '…손만 찍어. 얼굴 나오면 필름 바다에 던진다.' },
                ],
              },
            ],
          },
          { t: 'minigame', id: 'photo', params: { subject: 'it_shrimp_large', caption: '새우 고르는 손.' } },
          { t: 'narrate', text: '갈라진 손가락, 비늘 붙은 손톱. 소, 중, 대. 손이 눈보다 빠르다.' },
          { t: 'think', text: '얼굴 없는 사진. 이 동네에서 나한테 허락된 건 손까지인가 보다.' },
          { t: 'say', who: 'fisherman', text: '…다 찍었으면 가. 새우 마른다.' },
        ],
      ],
    },
    {
      task: '해변에서 장부 찍기',
      button: '장부 사진 찍기',
      loc: 'dunes',
      seg: 'afternoon',
      bg: 'dunes',
      actors: [{ who: 'eli', at: { x: 420, y: 560 } }],
      scenes: [
        [
          { t: 'narrate', text: '모래언덕 너머 해변. 잡어 한 마리를 들고 왔다. 미끼다. 아니, 모델료다.' },
          { t: 'sfx', id: 'squawk' },
          { t: 'narrate', text: '부르지도 않았는데 하늘에서 흰 그림자가 내려온다.' },
          { t: 'enter', who: 'ledger', at: { x: 820, y: 560 }, face: -1 },
          { t: 'think', text: '장부. 메리 루가 없어도 내가 있으면 오는구나. …아니면 생선이 있어서 오든가.' },
          {
            t: 'choice',
            options: [
              { text: '잡어를 높이 던진다.', then: [{ t: 'narrate', text: '장부가 날개를 활짝 펴고 솟구친다. 지금이다.' }] },
              {
                text: '잡어를 모래 위에 두고 기다린다.',
                then: [{ t: 'narrate', text: '장부가 뒤뚱뒤뚱 다가와 생선을 노려본다. 그러더니 괜히 날아오른다. 폼을 잡는 건가.' }],
              },
            ],
          },
          { t: 'minigame', id: 'photo', params: { subject: 'ch_ledger_fly', caption: '장부, 비행 중.' } },
          { t: 'sfx', id: 'gulp' },
          { t: 'narrate', text: '장부가 생선을 삼키고 내 옆에 내려앉는다. 목 주머니가 출렁. 다음 생선을 기다리는 눈이다.' },
          { t: 'think', text: '모델료 추가 청구. 노라한테 넘기자.' },
        ],
      ],
    },
    {
      task: '로사네 식당 네온사인 찍기',
      button: '네온사인 찍기',
      loc: 'diner',
      seg: 'afternoon',
      requires: { not: { day: { gte: 27, lte: 27 } } },
      waitingText: '오늘은 식당이 문을 닫았다. 내일 다시',
      bg: 'diner',
      actors: [{ who: 'eli', at: { x: 420, y: 560 } }],
      scenes: [
        [
          { t: 'narrate', text: '로사의 식당. 분홍 네온사인이 낮에도 지지직 켜져 있다.' },
          { t: 'minigame', id: 'photo', params: { subject: 'ch_rosa', caption: '네온사인… 그리고 앞치마.' } },
          { t: 'enter', who: 'rosa', at: { x: 820, y: 560 }, face: -1 },
          {
            t: 'if',
            cond: { quest: 'Q_ROSA_ICE', state: 'done' },
            then: [
              { t: 'say', who: 'rosa', text: '사진? …간판만 찍어. 나는 메뉴에 없어.' },
              { t: 'say', who: 'rosa', text: '찍었으면 한 장 줘. 샐이 저 간판 달던 날 사진이 없어.' },
              { t: 'effect', effects: [{ feel: 'rosa', delta: 3 }, { flag: 'rosaWantsSignPhoto' }] },
              { t: 'think', text: '로사가 부탁을 했다. 부탁 비슷한 걸.' },
            ],
            else: [
              { t: 'say', who: 'rosa', text: '뭘 찍어.' },
              { t: 'say', who: 'eli', text: '간판이요. 노라 씨가…' },
              { t: 'say', who: 'rosa', text: '그 기자 심부름이야? 간판은 찍어. 나는 빼. 내 얼굴 나오면 필름째 튀겨 버린다.' },
            ],
          },
          { t: 'think', text: '…방금 로사가 프레임 한가운데로 걸어 들어왔다는 건 말하지 말자.' },
          { t: 'think', text: '네 장 다 찍었다. 광장 모퉁이 신문사 지국으로 가져가자.' },
        ],
      ],
    },
    {
      task: '광장 신문사 2층 암실에서 노라와 사진 뽑기',
      button: '필름 현상하기',
      loc: 'board',
      seg: 'afternoon',
      bg: 'board',
      actors: [{ who: 'eli', at: { x: 420, y: 560 } }],
      scenes: [
        [
          { t: 'narrate', text: '광장 모퉁이, 신문사 지국 2층. 계단이 한 칸 걸러 삐걱거린다.' },
          { t: 'enter', who: 'nora', at: { x: 860, y: 560 }, face: -1 },
          { t: 'say', who: 'nora', text: '다 찍었어? 진짜? 어부들이 너한테 손이라도 내줬어?' },
          { t: 'say', who: 'eli', text: '손만요.' },
          { t: 'say', who: 'nora', text: '손이면 충분해. 들어와. 문 꼭 닫고.' },
          { t: 'bg', key: 'black' },
          { t: 'narrate', text: '암실. 빨간 전구 하나. 약품 냄새가 코를 찌른다.' },
          { t: 'say', who: 'nora', text: '종이를 약품에 담그고 기다려. 흔들지 말고. 사진은 기다리는 사람한테만 나와.' },
          { t: 'narrate', text: '하얀 종이 위로 천천히 회색이 번진다. 날개 편 배. 새우 고르는 손. 하늘을 나는 장부.' },
          { t: 'say', who: 'nora', text: '이 장부 사진. 이건 표지감이다. 진짜로.' },
          { t: 'narrate', text: '마지막 장. 네온사인. 그리고 프레임 한가운데, 앞치마.' },
          { t: 'say', who: 'nora', text: '로사? 로사가 찍혔다고? 7년 동안 아무도 못 찍었는데!' },
          { t: 'say', who: 'nora', text: '…너 대체 뭐 한 거야?' },
          {
            t: 'choice',
            options: [
              {
                text: '"얼음 날랐어요."',
                cond: { quest: 'Q_ROSA_ICE', state: 'started' },
                then: [{ t: 'say', who: 'nora', text: '얼음? …얼음. 그렇구나. 받아 적을게.' }],
              },
              {
                text: '"그냥 지나가시던데요."',
                then: [{ t: 'say', who: 'nora', text: '로사는 그냥 지나가는 사람이 아니야. 뭐, 됐어. 사진이 말해 주겠지.' }],
              },
            ],
          },
          { t: 'narrate', text: '노라가 젖은 사진을 줄에 집게로 건다. 그러다 선반 쪽을 흘끔 본다.' },
          { t: 'narrate', text: '선반 가득 필름 상자. 상자마다 연도가 적혀 있다. 한 칸만 유난히 두껍다. 7년 전.' },
          {
            t: 'choice',
            options: [
              {
                text: '"저거, 아버지 사건 사진이에요?"',
                then: [
                  { t: 'say', who: 'nora', text: '…응.' },
                  { t: 'say', who: 'nora', text: '보고 싶어? 안 보는 게 나을 수도 있어. 진짜로.' },
                  { t: 'say', who: 'eli', text: '보여 주세요.' },
                ],
              },
              {
                text: '선반을 가만히 본다.',
                then: [
                  { t: 'say', who: 'nora', text: '…눈치 빠르네. 맞아. 그 사건.' },
                  { t: 'say', who: 'nora', text: '보고 싶으면 보여 줄게. 내가 너한테 빚진 게 좀 있거든.' },
                ],
              },
            ],
          },
          { t: 'narrate', text: '노라가 상자 하나를 내려 사진 몇 장을 넘긴다. 부두. 경찰 테이프. 메리 루.' },
          { t: 'narrate', text: '한 장에서 손이 멈춘다. 메리 루 선창 바닥, 방수포 위에 물건 세 개가 나란히 놓여 있다.' },
          { t: 'narrate', text: '카메라 한 대. 라이터 하나. 접이식 칼 하나. 번호표가 하나씩 붙어 있다.' },
          { t: 'say', who: 'nora', text: '선창에서 나온 증거품. 실종자들 물건이래. 내 책 뒤표지에도 실렸지.' },
          { t: 'think', text: '물건들이 반짝인다. 흑백 사진인데도. 사진을 잘 찍었나 보다.' },
          { t: 'say', who: 'nora', text: '…나 그 책으로 집 샀어. 이 사무실도. 할 말은 그게 다야.', mood: 'worried' },
          {
            t: 'choice',
            options: [
              {
                text: '"이 사진, 한 장 뽑아 줄 수 있어요?"',
                effects: [{ feel: 'nora', delta: 5 }],
                then: [
                  { t: 'say', who: 'nora', text: '…왜?' },
                  { t: 'say', who: 'eli', text: '아버지 서류철에 사진이 한 장도 없어서요.' },
                  { t: 'say', who: 'nora', text: '그래. 너는 가져갈 자격이 있지.' },
                ],
              },
              {
                text: '"책 얘기는 안 하셔도 돼요."',
                then: [{ t: 'say', who: 'nora', text: '…고마워. 그래도 한 장 뽑아 줄게. 그 정도는 해야지.' }],
              },
            ],
          },
          { t: 'narrate', text: '노라가 같은 사진을 한 장 더 뽑아 봉투에 넣어 준다. 아직 약품 냄새가 난다.' },
          { t: 'effect', effects: [{ item: 'holdPhotoPrint', n: 1 }, { flag: 'noraArchiveSeen' }] },
          { t: 'bg', key: 'board', tint: 'afternoon' },
          { t: 'say', who: 'nora', text: '사진값. 장당 오 달러. 근데 장부는 표지감이니까 이십오.' },
          { t: 'effect', effects: [{ money: 25 }] },
          { t: 'say', who: 'nora', text: '카메라는 가져. 첫 카메라는 남한테 줘야 다음 카메라가 생긴대. 내가 방금 지어낸 말이야.' },
          { t: 'say', who: 'nora', text: '집에 사진 붙일 벽 하나 만들어. 찍고 싶은 거 찍고. 다음엔 네 얘기도 좀 들려주고.' },
          { t: 'exit', who: 'nora', to: { x: 1400, y: 560 }, ms: 1400 },
          { t: 'think', text: '아버지 서류철에 사진이 한 장 생겼다. 아버지 배 바닥 사진.' },
        ],
      ],
    },
  ],
  complete: [{ feel: 'nora', delta: 20 }, { flag: 'cameraOwned' }, { flag: 'noraPhotoDone' }],
};
