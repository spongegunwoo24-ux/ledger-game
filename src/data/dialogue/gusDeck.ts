/**
 * Gus's lines while sorting on deck (weeks 1–7). Short, gruff, "…" often, rare warmth.
 * `from`/`to` are day ranges in which the line may appear.
 */
export interface GusLine {
  text: string;
  from: number;
  to: number;
  /** only when this flag is set */
  flag?: string;
}

export const GUS_DECK_LINES: GusLine[] = [
  // week 1
  { text: '…큰 건 큰 데, 작은 건 작은 데.', from: 1, to: 7 },
  { text: '눈으로 재. 손으로 재지 말고.', from: 1, to: 7 },
  { text: '거북은 난간 너머로. 벌금 물기 싫으면.', from: 1, to: 10 },
  { text: '쓰레기통에 넣은 건 끝이다. 다시 못 꺼내.', from: 1, to: 10 },
  { text: '…손 느리네.', from: 1, to: 6 },
  { text: '게는 통에. 집게 조심하고.', from: 1, to: 7 },
  { text: '장부한테 잡어 던져 줘. 안 그러면 새우 훔친다.', from: 1, to: 14 },
  { text: '…니 애비는 이거 눈 감고도 했다.', from: 2, to: 20 },
  { text: '허리 펴. 하루 이틀 할 거 아니면.', from: 2, to: 14 },
  { text: '새우 싫어한다며. 그래도 잘 집네.', from: 3, to: 12 },
  { text: '…', from: 1, to: 44 },
  { text: '…흠.', from: 1, to: 44 },
  { text: '이건 중짜. 저건 대짜. 헷갈리면 머리 크기 봐.', from: 1, to: 9 },
  { text: '바다 냄새 싫으면 도시로 가. 안 말린다.', from: 2, to: 8 },
  { text: '손 베이지 마. 새우 뿔이 날카롭다.', from: 2, to: 12 },
  // week 2–3
  { text: '로사네 얼음 기계 또 고장 났다더라. …나랑 상관없지.', from: 8, to: 14 },
  { text: '캘빈 그 사람은 매일 새벽에 나간다. 부지런하지.', from: 8, to: 30 },
  { text: '오늘 물 좋다.', from: 8, to: 40 },
  { text: '이 배 갑판 저기 반들반들한 데 보이냐. 니 애비 자리다.', from: 8, to: 30 },
  { text: '나 자리는 저기. 삼십 년 서 있었더니 나무가 닳았다.', from: 9, to: 32 },
  { text: '…요즘 좀 빨라졌네.', from: 10, to: 30 },
  { text: '장부 저놈은 아무 손에서나 받아먹는데… 아니다.', from: 11, to: 30 },
  { text: '거스 자리는 이제 알지? 남한테 말하지 마.', from: 15, to: 40 },
  { text: '맥주는 한 캔만. 내일도 나가야 하니까.', from: 12, to: 40 },
  { text: '니 엄마는 갑판에 한 번도 안 섰다. 멀미가 심해서.', from: 12, to: 40 },
  { text: '…니 엄마가 만든 새우 검보는 이 동네 최고였지.', from: 13, to: 40 },
  { text: '노라 그 기자, 사진 찍는다고 배에 올라오면 신발 벗으라 해.', from: 16, to: 30 },
  { text: '행크 영감 통발? 지 자리에 둬 놓고 매번 잃어버려.', from: 17, to: 25 },
  { text: '바다는 말 안 한다. 그래서 좋다.', from: 14, to: 43 },
  { text: '오늘은 장부가 얌전하네. 배부른가.', from: 9, to: 43 },
  // week 4–5
  { text: '파이크 그 의사, 요즘 얼굴이 안 좋더라.', from: 22, to: 30 },
  { text: '은행 그 아가씨… 착하다. 착한 게 문제지.', from: 23, to: 40 },
  { text: '샐 기일이다. 로사한테 말 걸지 마라, 오늘은.', from: 26, to: 27 },
  { text: '축복제? 우리 배는 명단에 없을 거다. 늘 그랬어.', from: 29, to: 33 },
  { text: '…배 칠하는 거, 잘했더라.', from: 30, to: 34, flag: 'blessingPainted' },
  { text: '니가 웃는 거 처음 봤다. 니 애비랑 똑같이 웃네.', from: 34, to: 40 },
  { text: '새우는 거짓말 안 한다. 잡힌 만큼 잡힌 거다.', from: 20, to: 43 },
  { text: '바람 불면 배가 운다. 오래된 배라 그렇다.', from: 18, to: 43 },
  { text: '이 그물, 니 애비가 마지막으로 꿰맨 거다.', from: 19, to: 35 },
  { text: '…잘한다. 말하면 건방져질까 봐 안 했다.', from: 30, to: 43 },
  // week 6–7 (heavier)
  { text: '…선실 바닥 열었다며.', from: 36, to: 38 },
  { text: '…', from: 36, to: 44 },
  { text: '오늘은 말하기 싫다. 그냥 골라.', from: 36, to: 43 },
  { text: '니 애비는… 아니다.', from: 37, to: 43 },
  { text: '등대 쪽 보지 마. 그냥 일해.', from: 37, to: 44 },
  { text: '나이 들면 잠이 없다. 밤마다 바다 소리만 들린다.', from: 38, to: 44 },
  { text: '성당에 가 봐도 신부님한테 할 말이 없다. 그래도 간다.', from: 39, to: 44 },
  { text: '니가 이 배를 안 팔았으면 좋겠다. 그냥 내 생각이다.', from: 40, to: 44 },
  { text: '…미안하다. 아무것도 아니다.', from: 41, to: 44 },
  { text: '이번 일요일에 집에 와라. 할 얘기가 있다.', from: 42, to: 44 },
  { text: '술 한 병 사 둘 거다. 너도 마셔야 할 거다.', from: 43, to: 44 },
  // general fillers (all weeks)
  { text: '빨리빨리. 새우 마른다.', from: 1, to: 44 },
  { text: '물 한 바가지 끼얹어. 그래야 싱싱하다.', from: 1, to: 44 },
  { text: '…그건 잡어. 장부 줘.', from: 1, to: 44 },
  { text: '그물에 걸린 건 다 이유가 있어서 걸린 거다.', from: 5, to: 44 },
  { text: '깡통은 쓰레기. 바다에 돌려보내지 마.', from: 1, to: 44 },
  { text: '오늘 장사 되겠다.', from: 1, to: 44 },
  { text: '해 뜬다. 예쁘지. …일이나 해.', from: 1, to: 44 },
  { text: '내 장화 밟지 마.', from: 1, to: 44 },
  { text: '이건 내가 할게. 너는 그거 해.', from: 1, to: 44 },
  { text: '손 시려도 장갑 끼지 마. 감 떨어진다.', from: 1, to: 44 },
  { text: '…좋은 놈이네. 대짜.', from: 1, to: 44 },
];

/** Hints Gus gives when an item is dropped in the wrong place. */
export const GUS_REJECT_HINTS: Record<string, string> = {
  shrimp: '새우는 바구니에.',
  crab: '게는 저 통에.',
  fish: '잡어는 장부 주든지 바다에 돌려보내.',
  trash: '쓰레기는 쓰레기통에. 바다에 버리지 마.',
  turtle: '거북은 난간 너머로!',
  curio: '그런 건 상자에 챙겨. 아니면 버리든지.',
  story: '…그건 챙겨 둬.',
};

/** Lines when the player puts a shrimp in the wrong-size basket (diegetic feedback). */
export const GUS_WRONG_BASKET = ['…그거 중짜다.', '큰 놈을 작은 데 넣으면 돈 버리는 거다.', '머리 크기 봐.'];

/** Tutorial lines on Day 1 (diegetic, through Gus). */
export const GUS_TUTORIAL_DECK = [
  '쏟는다. 이제 골라.',
  '새우는 크기대로. 소, 중, 대. 바구니 세 개.',
  '게는 양동이. 쓰레기는 통. 이상한 건 상자에 챙기든 말든.',
  '거북 나오면 난간 너머로 들어서 넘겨. 그게 법이다.',
];

/** Gus's comments while towing (Trawl scene), by situation. */
export const GUS_TOW = {
  start: ['…내려간다.', '그물 풀린다. 줄 조심.', '자, 끌어.'],
  light: ['…아직 가볍다.', '조금 더.'],
  heavier: ['…무거워지네.', '윈치 소리 들려? 저게 무게다.', '배가 뒤로 눕는다. 들어오고 있다.'],
  good: ['이 정도면 괜찮다.', '…올려도 되겠다.'],
  greedy: ['더 끌면 욕심이다.', '바닥 긁는다. 찢어지면 니 돈이다.'],
  riskyGround: ['여긴 바닥이 험하다. 오래 끌지 마.'],
  snag: ['걸렸다! 올려!', '…찢어졌다. 올려.'],
  haul: ['올린다.', '…보자.'],
  tutorial: [
    '레버 당겨. 그물 내려간다.',
    '윈치 소리 들어. 소리가 높아지면 무거워지는 거다.',
    '너무 오래 끌면 바닥에 걸려서 찢어진다.',
    '됐다 싶으면 올려. 니가 정해.',
  ],
};
