import { check, type Cond } from '../../core/conditions';
import type { GameState } from '../../core/state';
import type { CharId, FeelId } from '../../core/types';

/**
 * Context lines when Eli meets someone in a location (while they are doing something).
 * A line is eligible when its `when` conditions hold (and, for Calvin's D05 lines, when he
 * remembers the matching choice). `talkLinesFor` returns the eligible pool; the picker draws
 * one at random, so `weight` makes story-moment lines come up more often.
 *
 * Writing rules (DESIGN §5.3, §6, §14): weeks 1–5 are light; nobody reveals hidden truths;
 * hostile people only warm up as their feeling rises (§8.6 bands: 증오 <20, 냉담 <40,
 * 경계 <60, 중립 <80, 신뢰 80+). Each line fits a two-line dialogue box.
 */
export interface TalkLine {
  text: string;
  when?: Cond | Cond[];
  /** D05: only when Calvin remembers this choice of Eli's (`s.calvinMemory`). */
  remembers?: string;
  /** relative chance in the random pick (default 1) */
  weight?: number;
}

/** Gus vanishes after his confession night (Day 44). No line of his may be eligible after it. */
export const GUS_LAST_DAY = 44;

/**
 * Flag set by the fishermen ranking when Eli first reaches #1 and Hank says his first words
 * ("…어디서 잡았냐?" — reserved for that system, never used here). Until then Hank only
 * grunts or turns away.
 */
export const HANK_SPOKE_FLAG = 'hankFirstWords';

// ── condition shorthands ─────────────────────────────────────────────
const feelAtLeast = (id: FeelId, n: number): Cond => ({ feel: id, gte: n });
const feelBelow = (id: FeelId, n: number): Cond => ({ feel: id, lt: n });
const feelBetween = (id: FeelId, lo: number, hi: number): Cond => ({ feel: id, gte: lo, lt: hi });
const days = (gte: number, lte?: number): Cond => (lte === undefined ? { day: { gte } } : { day: { gte, lte } });
const upTo = (lte: number): Cond => ({ day: { lte } });
const done = (quest: string): Cond => ({ quest, state: 'done' });
const active = (quest: string): Cond => ({ quest, state: 'active' });
const notStarted = (quest: string): Cond => ({ quest, state: 'none' });
const after = (eventId: string): Cond => ({ eventDone: eventId });

/** Week 5 festival build-up (Days 29–34). */
const FESTIVAL_WEEK = days(29, 34);
/** The quiet days right after the festival. */
const AFTER_FESTIVAL = days(35, 40);

function all(...conds: (Cond | Cond[] | undefined)[]): Cond[] {
  const out: Cond[] = [];
  for (const c of conds) {
    if (!c) continue;
    if (Array.isArray(c)) out.push(...c);
    else out.push(c);
  }
  return out;
}

/** Gus's lines all stop after Day 44. */
function gusLine(text: string, when?: Cond | Cond[], weight?: number): TalkLine {
  return { text, when: all(upTo(GUS_LAST_DAY), when), ...(weight ? { weight } : {}) };
}

/** Hank's lines before his first words: grunts and gestures only. */
function hankSilent(text: string, when?: Cond | Cond[]): TalkLine {
  return { text, when: all({ notFlag: HANK_SPOKE_FLAG }, when) };
}

/** Hank's lines after the ranking gave him his first words. */
function hankSpeaks(text: string, when?: Cond | Cond[]): TalkLine {
  return { text, when: all({ flag: HANK_SPOKE_FLAG }, when) };
}

export const SMALLTALK: Partial<Record<CharId, TalkLine[]>> = {
  // ── 로사: curt, sharp, cooking metaphors. Starts at 5 (증오). ──
  rosa: [
    { text: '(로사는 행주로 카운터를 닦으며 눈도 마주치지 않는다.) …주문 안 받아.', when: feelBelow('rosa', 20) },
    { text: '(커피 주전자를 내려놓으며) 여긴 앉을 자리 없어. 보면 알잖아.', when: feelBelow('rosa', 20) },
    { text: '(냄비 뚜껑을 쾅 닫으며) 문 닫고 나가. 김 빠져.', when: feelBelow('rosa', 20) },
    { text: '(손님들 쪽을 턱으로 가리키며) 네가 서 있으면 다들 숟가락을 내려놔. 장사 방해야.', when: feelBelow('rosa', 20) },
    { text: '(칼을 도마에 내려놓으며) 할로우 집안한테 내줄 건 없어. 소금 한 꼬집도.', when: feelBelow('rosa', 20) },
    { text: '(고장 난 얼음 기계를 발로 차며) …뭘 봐.', when: [feelBelow('rosa', 40), days(8, 16)] },
    { text: '(접시를 쌓으며) 할 말 있으면 빨리 해. 손님 기다려.', when: feelBetween('rosa', 20, 40) },
    { text: '(얼음 통을 흘끔 보며) …그 기계는 또 말썽이야.', when: [feelBetween('rosa', 20, 60), days(8)] },
    { text: '(수프를 저으며) 수프는 오래 끓여야 맛이 나. 사람 얼굴도 그렇고. 넌 아직 멀었어.', when: feelBetween('rosa', 20, 40) },
    { text: '(감자를 깎으며) 얼음 날라 준 건 고마워. 그거랑 이거랑은 별개야.', when: [feelBetween('rosa', 20, 40), { quest: 'Q_ROSA_ICE', state: 'started' }] },
    { text: '(양파를 썰며) 오믈렛은 불 조절이 반이야. 사람도 그렇고.', when: feelAtLeast('rosa', 40) },
    { text: '(빵 반죽을 치대며) 반죽은 좀 맞아야 부드러워져. 너도 이 동네한테 좀 맞더니 낫네.', when: feelBetween('rosa', 40, 60) },
    { text: '(주문서를 꽂으며) 새우 좋은 거 있으면 아침에 가져와 봐. 무게는 내가 달아.', when: [feelAtLeast('rosa', 40), days(8)] },
    { text: '(파이 접시를 내밀며) 한 조각 남았어. 사과야. …피칸은 다 나갔어.', when: feelAtLeast('rosa', 40) },
    { text: '(그물 얘기에 잠깐 멈칫하며) 그 그물, 잘 쓰고 있지? 찢어 먹으면 가만 안 둬.', when: [feelAtLeast('rosa', 40), done('Q_ROSA_ICE')], weight: 2 },
    { text: '(커피를 한 잔 밀어 주며) 식기 전에 마셔. 공짜 아니야.', when: feelAtLeast('rosa', 60) },
    { text: '(그릴을 긁으며) 굽는 건 기다리는 거야. 뒤집고 싶어도 참아. 너 요즘 좀 참을 줄 알더라.', when: feelAtLeast('rosa', 60) },
    { text: '(벽에 걸린 머그를 올려다보다가) …저건 만지지 마. 그냥 거기 있는 거야.', when: feelAtLeast('rosa', 60) },
    { text: '(커피 잔을 채우며) 오늘 바다 어땠어. …그냥 물어본 거야.', when: feelAtLeast('rosa', 60) },
    { text: '(창고 쪽을 보며) 그 얘기, 너한테 처음 한 거야. 어디 가서 하지 마.', when: [feelAtLeast('rosa', 40), { evidence: 'E_ROSA_BACKDOOR' }] },
    { text: '(앞치마를 풀며) 앉아. 오늘은 내가 사. 두 번은 없어.', when: feelAtLeast('rosa', 80) },
    { text: '(눈이 조금 부은 채) 어제는 쉬었어. 묻지 마. 주문이나 해.', when: [feelAtLeast('rosa', 40), days(28, 30)], weight: 3 },
    { text: '(로사는 대답 대신 행주만 비튼다.)', when: [feelBelow('rosa', 40), days(28, 30)], weight: 2 },
    { text: '(축복제 전단을 구기며) 축복제 날은 손님이 세 배야. 새우 모자라면 너 부를 거야.', when: [feelAtLeast('rosa', 40), FESTIVAL_WEEK] },
  ],

  // ── 토비: bright 존댓말, eager, "선배님!", always whistling. Starts at 70. ──
  toby: [
    { text: '(수첩을 덮으며) 아, 일라이 씨. 지금 공무 중이라서요. 다음에요.', when: feelBelow('toby', 40) },
    { text: '(휘파람을 멈추고 어색하게 웃는다.) 오늘은… 좀 바빠서요.', when: feelBelow('toby', 40) },
    { text: '(모자를 고쳐 쓰며) 보안관님이 너무 친하게 지내지 말래요. 그래도 인사는 되죠?', when: feelBetween('toby', 40, 60) },
    { text: '(순찰 수첩에 뭔가 적으며) 안녕하세요! 오늘도 날씨 좋죠? 휘파람이 절로 나와요.', when: feelAtLeast('toby', 40) },
    { text: '(자전거를 세우며) 선배님이 그러셨어요. 순찰은 발로 하는 거라고! 그래서 자전거로 해요. 헤헤.', when: feelAtLeast('toby', 60) },
    { text: '(전단을 정리하며) 실종 전단은 매주 제가 다시 붙여요. 바래면 안 되니까요.', when: feelAtLeast('toby', 40) },
    { text: '(망원경을 닦으며) 일라이 씨 배, 페인트 새로 했네요? 민트색 예뻐요.', when: [feelAtLeast('toby', 40), days(3, 20)] },
    { text: '(휘파람을 불며) 휘― 아, 일라이 씨! 펠리컨이 또 메리 루 난간에 앉아 있던데요?', when: feelAtLeast('toby', 60) },
    { text: '(주머니에서 사탕을 꺼내며) 메이지가 줬어요. 반 드릴까요? 순찰하면 당이 떨어져요.', when: feelAtLeast('toby', 60) },
    { text: '(무전기를 두드리며) 이거 고장 났어요. 보안관님은 선거 끝나면 사 준대요!', when: feelAtLeast('toby', 40) },
    { text: '(게시판에 압정을 꽂으며) 선배님 그때 정말 대단하셨어요. 저는 서류 복사만 했지만요!', when: feelAtLeast('toby', 60) },
    { text: '(자전거 바퀴에 바람을 넣으며) 원래 꿈이 해양 경비대였어요. 멀미 때문에 땅으로 왔죠.', when: feelAtLeast('toby', 60) },
    { text: '(페인트 자국을 보며) 그 글자, 또 썼더라고요. 밤 순찰 늘릴게요. 제가 잠이 많긴 한데…', when: [feelAtLeast('toby', 40), days(10)] },
    { text: '(밧줄 조각을 들고) 계류줄 잘린 거, 제가 보고서 썼어요. 순찰 더 돌게요!', when: [feelAtLeast('toby', 40), days(12, 16)], weight: 2 },
    { text: '(손을 비비며) 선배님네 새우 보일, 저도 갔었죠? 옥수수 네 개 먹었어요. 비밀이에요.', when: [feelAtLeast('toby', 40), after('W2_CALVIN_COOKOUT'), upTo(30)] },
    { text: '(눈을 반짝이며) 선배님한테 매듭 배우세요? 저는 아직 보라인 매듭이 안 돼요.', when: [feelAtLeast('toby', 40), active('Q_CALVIN_KNOTS')] },
    { text: '(휘파람을 불다 멈추고) 아, 이 곡이요? 선배님이 알려 주신 거예요. 좋죠?', when: done('Q_CALVIN_KNOTS'), weight: 2 },
    { text: '(축복제 깃발을 나르며) 축복제 날 저는 교통 정리해요! 배가 다니는데 무슨 교통이냐고요?', when: [feelAtLeast('toby', 40), FESTIVAL_WEEK] },
    { text: '(그을린 코를 문지르며) 축복제 때 탔어요. 일라이 씨도 탔네요. 둘 다 새우색이에요.', when: [feelAtLeast('toby', 40), AFTER_FESTIVAL] },
    { text: '(경례를 하다 웃으며) 일라이 씨는 이제 순찰 명단에 "인사하는 사람"으로 올라가 있어요.', when: feelAtLeast('toby', 80) },
  ],

  // ── 매슈 신부: gentle 존댓말, asks nothing. Starts at 65. ──
  matthew: [
    { text: '(초를 갈다 말고 고개만 끄덕인다.) 평화가 함께하기를.', when: feelBelow('matthew', 40) },
    { text: '(성경을 덮으며) 오늘은 제가 좀 바빠서요. 그래도 문은 열려 있어요.', when: feelBelow('matthew', 40) },
    { text: '(신발을 털며) 마을 사람들 말은 파도 같아요. 세게 오다가도 빠져요.', when: feelBetween('matthew', 40, 60) },
    { text: '(초 심지를 다듬으며) 초는 매일 갈아요. 꺼지면 다시 켜고요. 그게 제 일이에요.' },
    { text: '(성가집을 정리하며) 일요일 아침에 오세요. 뒷자리는 늘 비어 있어요.', when: feelAtLeast('matthew', 40) },
    { text: '(종 줄을 감으며) 정오 종은 제가 쳐요. 조금 늦으면 마을이 다 알아요.' },
    { text: '(종탑 계단에서 숨을 고르며) 종이 무거워져요. 종이 무거워지는 건지 제가 늙는 건지.', when: feelAtLeast('matthew', 40) },
    { text: '(헌금함을 비우며) 이번 주엔 단추가 세 개 들어왔어요. 주님도 단추가 필요하시겠죠.', when: feelAtLeast('matthew', 40) },
    { text: '(제대보를 개며) 거스 씨는 일요일마다 오세요. 고해성사는 안 하시고요. 그냥 앉아 계세요.', when: [feelAtLeast('matthew', 40), upTo(GUS_LAST_DAY)] },
    { text: '(꽃병 물을 갈며) 장례식 날 하늘이 맑았죠. 저는 그걸 위로라고 생각하기로 했어요.', when: [feelAtLeast('matthew', 40), upTo(14)] },
    { text: '(창문을 닦으며) 일라이 씨, 얼굴이 처음 왔을 때보다 탔네요. 좋은 뜻이에요.', when: [feelAtLeast('matthew', 40), days(10)] },
    { text: '(차를 따르며) 여기 앉으세요. 아무것도 안 물어볼게요. 차는 식기 전에 드세요.', when: feelAtLeast('matthew', 60) },
    { text: '(성가집 사이 마른 꽃잎을 털며) 아버님은 성탄절마다 새우 한 상자를 문 앞에 두고 가셨어요.', when: feelAtLeast('matthew', 60) },
    { text: '(문간에서) 일라이 씨 앉는 자리, 요즘은 사람들이 피해 가지 않아요. 눈치채셨어요?', when: feelAtLeast('matthew', 80) },
    { text: '(창밖 식당 쪽을 보며) 오늘은 로사 씨 식당이 쉬어요. 해마다 그래요. 아무도 안 물어요.', when: days(27, 27), weight: 3 },
    { text: '(배 장식용 리본을 감으며) 축복제 명단은 선단 조합이 써요. 저는 읽기만 하고요. 미안해요.', when: [after('W5_FESTIVAL_NEWS'), FESTIVAL_WEEK] },
    { text: '(리본 한 묶음을 건네며) 메리 루 칠 다 되면 보여 주세요. 약속은 못 해도 보러는 갈게요.', when: [active('Q_BLESSING'), FESTIVAL_WEEK], weight: 2 },
    { text: '(조용한 성당을 둘러보며) 축복제가 끝나니 조용하네요. 바다도 오늘은 쉬는 것 같아요.', when: AFTER_FESTIVAL },
  ],

  // ── 캘빈: the warmest voice in town, gentle jokes, remembers what Eli said (D05). Fixed 90. ──
  calvin: [
    { text: '(현관에서 장화를 닦으며) 오, 일라이 씨! 오늘 바다는 어땠어요?' },
    { text: '(낚싯바늘을 정리하며) 새벽엔 제 자리에서 낚싯줄 드리우고 있어요. 혼자가 편해서요.' },
    { text: '(잔디를 깎다 멈추고) 필요한 거 있으면 말해요. 공구는 다 있어요.' },
    { text: '(커피 잔을 들고) 마을 사람들 너무 신경 쓰지 마요. 시간이 해결해 줘요.' },
    { text: '(밧줄을 내려놓으며) 손이 심심하면 매듭을 묶어요. 오래된 버릇이에요.' },
    { text: '(현관 그네에 앉아) 아침마다 메리 루 나가는 소리 들어요. 엔진 소리가 아버님 때랑 똑같아요.', when: days(5) },
    { text: '(파이프를 손질하며) 등대 앞은 여전히 가지 마요. 바닥이 험해서 그물만 버려요.', when: days(5) },
    { text: '(마을 쪽을 보며) 로사 씨는 원래 무서워요. 저한테도 그래요. 커피는 맛있죠.' },
    { text: '(달력을 보며) 금요일마다 은행 가는 거, 힘들죠. 모자라면 말해요. 진짜로요.', when: days(5) },
    { text: '(장작을 패다 말고) 손 좀 봐요. 물집이 굳은살 됐네. 이제 어부 손이에요.', when: days(10) },
    { text: '(양동이를 내밀며) 오늘 잡은 거예요. 두 마리 가져가요. 저 혼자 다 못 먹어요.', when: days(10) },
    { text: '(웃으며) 장부가 제 손에서는 절대 안 받아먹는 거 봤죠? 하하, 저 녀석은 저를 안 좋아해요.', when: after('W2_CALVIN_COOKOUT') },
    { text: '(밧줄을 감으며) 계류줄 또 잘리면 저 불러요. 제가 묶은 건 잘 안 풀려요.', when: days(12, 18) },
    { text: '(커피를 내리며) 토비 휘파람 들리죠? 그 녀석 휘파람 들으면 마을이 아직 괜찮구나 싶어요.' },
    { text: '(밧줄을 건네며) 다음은 클로브 히치예요. 쉬워 보이는데, 쉽진 않아요.', when: active('Q_CALVIN_KNOTS'), weight: 2 },
    { text: '(벽의 매듭 액자를 바로 걸며) 이거요? 제 취미예요. 손이 심심할 때 하나씩.', when: done('Q_CALVIN_KNOTS') },
    { text: '(장화 끈을 매며) 거스 씨는 잘 지내요? 무뚝뚝해도 속은 따뜻한 분이에요. 오래 봐서 알아요.', when: upTo(GUS_LAST_DAY) },
    { text: '(작은 배에 리본을 묶으며) 축복제 날엔 저도 배를 꾸며요. 작은 배라 리본 하나면 끝이지만요.', when: FESTIVAL_WEEK },
    { text: '(웃으며) 축복제 날 일라이 씨 얼굴 봤어요. 웃을 때 아버님 닮았더라고요.', when: [after('W5_FESTIVAL'), AFTER_FESTIVAL] },
    { text: '(조용히) 요즘 얼굴이 안 좋네요. 무슨 일 있으면 저한테 말해요. 언제든지요.', when: days(36, 44) },
    // D05 — Calvin quotes back what Eli said, kindly.
    { text: '(악수를 청하며) 장례식 날 "고맙습니다" 해 줬죠. 그날 들은 말 중에 제일 좋았어요.', remembers: 'funeral_thanks', when: days(8), weight: 2 },
    { text: '(웃으며) 아버지 일은 아버지 일이라고 했죠. 그 말이 참 좋았어요. 어른스러워서.', remembers: 'funeral_dads_business', when: days(8), weight: 2 },
    { text: '(손을 잡으며) 장례식 날 말없이 악수만 했죠. 손이 차가웠어요. 요즘은 좀 따뜻하네요.', remembers: 'funeral_silent', when: days(8), weight: 2 },
    { text: '(새우 껍질을 까며) 빚만 갚으면 떠난다고 했죠? 그 전에 제 새우 요리는 먹고 가기로 했잖아요.', remembers: 'leave_after_debt', when: days(8, 20), weight: 2 },
    { text: '(눈을 찡긋하며) 빚 갚으면 떠난다던 사람이 매듭은 저보다 잘 묶네요. 하하.', remembers: 'leave_after_debt', when: [days(21), done('Q_CALVIN_KNOTS')], weight: 2 },
    { text: '(웃으며) 빚만 갚으면 떠난다던 사람이 아직 여기 있네요. 좋은 뜻이에요.', remembers: 'leave_after_debt', when: days(21), weight: 2 },
    { text: '(커피를 건네며) 아직 모르겠다고 했었죠. 여기 있을지. 요즘은 좀 알 것 같아요?', remembers: 'dont_know_stay', when: days(8), weight: 2 },
    { text: '(메리 루 쪽을 보며) 한 철은 해 보겠다고 했죠. 벌써 반이 넘었네요. 아버님이 보셨으면.', remembers: 'one_season_for_dad', when: days(29), weight: 2 },
    { text: '(고개를 끄덕이며) 아버지 배니까 한 철은 해 보겠다던 말, 저는 기억해요. 잘하고 있어요.', remembers: 'one_season_for_dad', when: days(8, 28), weight: 2 },
  ],

  // ── 거스: very short 반말, grunts, "…", rare warmth. Starts at 25. Gone after Day 44. ──
  gus: [
    gusLine('(그물을 손질하며) …'),
    gusLine('(커피 깡통에 침을 뱉으며) 뭐.', feelBelow('gus', 60)),
    gusLine('(밧줄을 감으며) 오후엔 쉬어. 내일 새벽 네 시다.'),
    gusLine('(모자를 눌러쓰며) …가.', feelBelow('gus', 40)),
    gusLine('(등을 돌린 채) 할 말 없다.', feelBelow('gus', 40)),
    gusLine('(담배를 말며) 니 애비 배다. 니 배 아니다. 아직은.', feelBelow('gus', 40)),
    gusLine('(장화를 말리며) …오늘 잘했다. 그냥 그렇다고.', feelAtLeast('gus', 40)),
    gusLine('(파이프를 문 채) 니 애비는 오후마다 여기 앉아 있었다. 지금 니 자리.', feelAtLeast('gus', 40)),
    gusLine('(그물코를 당겨 보며) 매듭. 다시. …됐다.', feelAtLeast('gus', 40)),
    gusLine('(커피를 한 모금 마시고 컵을 내민다.) …마셔. 식는다.', feelAtLeast('gus', 40)),
    gusLine('(하늘을 보며) 내일 흐린다. 난파선 가라. 걸리면 내가 푼다.', feelAtLeast('gus', 40)),
    gusLine('(굴 양식장 쪽을 보며) 올드 레드. 30년째다. 그놈 보이면 나 불러.', feelAtLeast('gus', 40)),
    gusLine('(털모자를 고쳐 쓰며) 장부 녀석. 너 오면 난간에 앉는다. 니 애비 때도 그랬다.', feelAtLeast('gus', 60)),
    gusLine('(그물 더미에 앉아) …니 애비는 말이 없었다. 나도 없고. 그래서 30년 갔다.', feelAtLeast('gus', 60)),
    gusLine('(눈을 피하며) 니가 묶은 매듭. 안 풀리더라. …그렇다고.', [feelAtLeast('gus', 60), { flag: 'knotLesson' }]),
    gusLine('(뭔가 말하려다 입을 다문다.) …됐다. 가 봐.', [feelAtLeast('gus', 60), days(20)]),
    gusLine('(턱으로 바다를 가리키며) 거기 알지. 혼자 가. 남한테 말하지 말고.', [days(15, 21)], 2),
    gusLine('(축복제 깃발을 보고 코웃음) 신부가 물 뿌린다고 새우가 더 들어오냐.', FESTIVAL_WEEK),
    gusLine('(먼 데를 보며) 니 애비, 축복제 때 물에 빠진 적 있다. 신부 밀다가. …웃기지.', [feelAtLeast('gus', 40), AFTER_FESTIVAL]),
    gusLine('(술병을 등 뒤로 감추며) …오늘은 그냥 가라.', days(36)),
    gusLine('(빈 잔을 오래 들여다본다.) …', days(36)),
  ],

  // ── 프리야: kind, professional. Sits at the dead colleague's desk. Starts at 60. ──
  priya: [
    { text: '(창구 유리 너머로) 업무 시간이에요. 상환 말고 다른 용건은 다음에요.', when: feelBelow('priya', 40) },
    { text: '(서류에서 눈을 떼지 않고) 금요일 다섯 시예요. 그것만 기억하세요.', when: feelBelow('priya', 40) },
    { text: '(펜을 돌리며) 할로우 씨 서류는 다들 저한테만 넘겨요. 괜찮아요. 일이니까요.', when: feelBetween('priya', 40, 60) },
    { text: '(서류를 넘기며) 오셨어요? 미리 갚으시려면 말씀만 하세요.' },
    { text: '(계산기를 두드리며) 이번 주 금요일 납부, 잊지 마세요. 오후 다섯 시 마감이에요.' },
    { text: '(책상 서랍을 무릎으로 닫으며) 아, 아니에요. 정리가 안 돼서요.', when: feelAtLeast('priya', 40) },
    { text: '(도장을 찍으며) 이 책상, 전에 쓰던 분이 정리를 엄청 잘하셨대요. 저는 영…', when: feelAtLeast('priya', 40) },
    { text: '(벽시계를 올려다보며) 저 시계는 제가 맞춰 놨어요. 이 지점에서 제일 정확해요.', when: feelAtLeast('priya', 40) },
    { text: '(계산기를 내밀며) 판매 기록 보여 주시면 다음 주 계획 같이 짜 드려요. 은행치고는 무료예요.', when: feelAtLeast('priya', 60) },
    { text: '(창밖을 보며) 저도 여기 온 지 넉 달이에요. 아직 다들 "새 은행 아가씨"라고 불러요.', when: feelAtLeast('priya', 60) },
    { text: '(서류철에 견출지를 붙이며) 빚은 숫자예요. 숫자는 줄어들어요. 사람 일보다 쉬워요.', when: feelAtLeast('priya', 60) },
    { text: '(통장을 보며) 이번 주는 여유가 있으시네요. 미리 내 두시면 금요일이 편해요.', when: [feelAtLeast('priya', 40), { money: { gte: 400 } }] },
    { text: '(상자를 끌어내며) 노트가 이렇게 많아요. 물때까지 적혀 있어요. 은행원이 왜 물때를?', when: active('Q_BANK_LEDGER'), weight: 2 },
    { text: '(웃음을 참으며) 그 노트 여백에 "새우 오믈렛" 있던 거 기억나요? 저 그날 오믈렛 먹었어요.', when: done('Q_BANK_LEDGER') },
    { text: '(작게) 할로우 씨 상환 기록, 지점에서 제일 깔끔해요. 자랑하셔도 돼요.', when: feelAtLeast('priya', 80) },
    { text: '(달력에 동그라미를 치며) 축복제 주에도 상환은 금요일이에요. 잊지 마세요.', when: FESTIVAL_WEEK },
  ],

  // ── 던바 보안관: politician's 반말-존댓말 mix, slogans. Starts at 40. ──
  dunbar: [
    { text: '(서류에서 고개도 안 들고) 할로우 아들. 사고 치지 마. 여긴 내가 지킨 동네야.', when: feelBelow('dunbar', 40) },
    { text: '(문 쪽을 가리키며) 문은 저쪽이야. 표 안 줄 사람한테 쓸 시간은 없거든.', when: feelBelow('dunbar', 40) },
    { text: '(배지를 닦으며) "펠리컨 코브를 지킨 보안관." 내가 직접 지은 문구야. 잘 기억해 둬.', when: feelBelow('dunbar', 40) },
    { text: '(포스터를 벽에 붙이며) 할로우 아들 아닌가! 펠리컨 코브를 지킨 보안관, 로이 던바야. 투표권 있나?', when: [feelAtLeast('dunbar', 40), upTo(14)] },
    { text: '(모자를 고쳐 쓰며) 이 동네는 조용한 게 최고지. 조용하면 다 내 덕이고.', when: feelAtLeast('dunbar', 40) },
    { text: '(서류를 서랍에 쑤셔 넣으며) 사건은 끝났어. 끝난 건 끝난 거야. 그게 내 철학이지.', when: feelAtLeast('dunbar', 40) },
    { text: '(악수를 청하며) 선거가 석 달 남았어. 웃는 얼굴로 다니라고.', when: [feelAtLeast('dunbar', 40), upTo(20)] },
    { text: '(커피를 후루룩 마시며) 치안, 안정, 던바. 세 단어면 충분해. 넷이면 사람들이 헷갈리거든.', when: feelAtLeast('dunbar', 40) },
    { text: '(악수한 손을 바지에 닦으며) 자네 아버지 일은 유감이야. 법은 법이고, 유감은 유감이지.', when: feelAtLeast('dunbar', 40) },
    { text: '(발을 책상에서 내리며) 토비 휘파람 좀 말려 줘. 도둑들이 듣고 다 도망가잖아. 하하.', when: feelAtLeast('dunbar', 40) },
    { text: '(액자 속 사진을 가리키며) 캘빈 쇼. 그 사람 없었으면 그 석 달 못 버텼어. 진짜 영웅이지.', when: feelAtLeast('dunbar', 40) },
    { text: '(보고서를 흔들며) 계류줄? 바람 탓이야. 바람한테 수갑을 채울 순 없잖나.', when: days(12, 16), weight: 2 },
    { text: '(어깨를 툭 치며) 새우 잘 잡는다며? 어부 표가 이 동네 반이야. 잘 지내 두라고.', when: feelAtLeast('dunbar', 60) },
    { text: '(배지를 반짝이며) 펠리컨 코브를 지킨 보안관이 자넬 지켜보고 있어. 좋은 뜻으로.', when: feelAtLeast('dunbar', 60) },
    { text: '(서랍에서 사탕을 꺼내며) 선거 사탕이야. 하나 가져가. 두 개는 안 돼. 예산이야.', when: feelAtLeast('dunbar', 80) },
    { text: '(연설문을 흔들며) "바다는 코브를 지켰고, 나는 코브를 지켰다." 어때? 박수 칠 데 표시했어.', when: FESTIVAL_WEEK },
    { text: '(목을 주무르며) 축복제 연설 들었나? 18분. 역대 최단이야.', when: AFTER_FESTIVAL },
  ],

  // ── 파이크 박사: nervous, formal, over-explains. Starts at 45. ──
  pike: [
    { text: '(약 가방을 꼭 쥐고) 아, 할로우 씨. 저는 그냥… 지나가던 길이라. 네.' },
    { text: '(시선을 피하며) 지금은 진료 시간이 아니라서요. 정확히는 진료 시간인데, 지금은 아니고요.', when: feelBelow('pike', 40) },
    { text: '(가방을 반대 손으로 옮기며) 바빠서요. 바쁘다는 건, 그러니까, 일정이 있다는 뜻이고요.', when: feelBelow('pike', 40) },
    { text: '(안경을 닦으며) 검시관 일은 서류가 대부분이에요. 정말로요. 대부분은.', when: feelAtLeast('pike', 40) },
    { text: '(시계를 보며) 노인분들 약 배달이 밀려서요. 요즘은 손이 모자라서…', when: feelAtLeast('pike', 40) },
    { text: '(손을 비비며) 날씨가… 덥네요. 아니, 습하네요. 습한 거죠.' },
    { text: '(안경을 고쳐 쓰며) 새우는 단백질이 좋아요. 콜레스테롤은, 음, 논란이 있고요. 적당히요.', when: feelAtLeast('pike', 40) },
    { text: '(손목시계를 두 번 보며) 이 시계는 2분 빨라요. 일부러요. 늦는 것보다는 낫잖아요. 대체로는요.', when: feelAtLeast('pike', 40) },
    { text: '(소독약 냄새를 풍기며) 바늘에 찔리면 바로 오세요. 상처가 작아도 감염이, 아니, 겁주려는 건 아니고요.', when: feelAtLeast('pike', 40) },
    { text: '(창밖 약국 쪽을 보다가) 약국이요? 아, 저건… 정리할 시간이 없어서요. 언젠가는요.', when: feelAtLeast('pike', 40) },
    { text: '(약 상자를 내려다보며) 혹시 오후에 시간 되시면, 아니, 안 되셔도 괜찮고요. 그냥 여쭤본 거예요.', when: [days(22, 24), notStarted('Q_PIKE_ERRANDS')], weight: 2 },
    { text: '(봉투 목록을 넘기며) 배달은 이름 순서예요. 아니, 주소 순서던가. 둘 다 맞아요, 거의.', when: active('Q_PIKE_ERRANDS'), weight: 2 },
    { text: '(고개를 연신 숙이며) 배달 고마웠어요. 남은 봉투는, 그건, 제 실수예요. 목록을 고쳤어야 했는데.', when: done('Q_PIKE_ERRANDS') },
    { text: '(조금 긴장을 푼 얼굴로) 할로우 씨는 설명을 끝까지 들어 줘서 좋아요. 다들 중간에 가거든요.', when: feelAtLeast('pike', 60) },
    { text: '(박하사탕을 내밀며) 멀미에 좋아요. 과학적으로는 아니지만, 기분상으로요.', when: feelAtLeast('pike', 60) },
    { text: '(웃으려다 실패하며) 요즘은 잠을 좀 자요. 네 시간이요. 저한테는 많이 잔 거예요.', when: feelAtLeast('pike', 80) },
    { text: '(구급 상자를 챙기며) 축복제 때 제가 구급 담당이에요. 매년 누가 꼭 바다에 빠져요. 매년요.', when: FESTIVAL_WEEK },
  ],

  // ── 노라: quick, curious, slightly guilty. In town from Day 16. Starts at 45. ──
  nora: [
    { text: '(수첩을 덮으며) 미안, 지금 마감이야. 인터뷰는 나중에. 아니, 인터뷰 아니야. 그냥 나중에.', when: feelBelow('nora', 40) },
    { text: '(카메라를 내리며) 너 찍은 거 아니야. 빛 보고 있었어.', when: feelBelow('nora', 40) },
    { text: '(카메라 렌즈를 닦으며) 일라이 할로우! 드디어 만났네. 노라 퀸이야. 기자.', when: days(16, 22) },
    { text: '(수첩에 적으며) 새우 철 사진을 모으는 중이야. 이번엔 사건 말고 사람 얘기.', when: feelAtLeast('nora', 40) },
    { text: '(필름을 감으며) 내 책? …읽지 마. 아니, 읽어도 되는데, 지금은 읽지 마.', when: feelAtLeast('nora', 40) },
    { text: '(연필을 귀에 꽂으며) 이 동네는 기사거리가 없어. 그게 좋은 거야. 기자한테는 나쁘고.', when: feelAtLeast('nora', 40) },
    { text: '(빨대로 커피를 마시며) 바다에 처음 나간 날 무슨 생각 했어? 기사 아니야. 궁금해서.', when: feelAtLeast('nora', 40) },
    { text: '(손가락으로 네모를 만들며) 해 뜰 때 그물, 갑판, 장부, 식당 간판. 네 장이면 돼. 안 쉬워.', when: active('Q_NORA_PHOTO'), weight: 2 },
    { text: '(사진을 넘기며) 장부가 카메라를 노려보는 거, 이건 상 받을 표정이야. 네 사진 좋아.', when: done('Q_NORA_PHOTO') },
    { text: '(라디오 쪽을 흘끔 보며) 재출간 소식 들었어? 출판사가 하자고 한 거야. 내가 아니라.', when: [feelAtLeast('nora', 40), days(20, 26)], weight: 2 },
    { text: '(사진 한 장을 수첩에 끼우며) 오래된 사진은 이상해. 찍을 땐 안 보이던 게 나중에 보여.', when: feelAtLeast('nora', 60) },
    { text: '(머리를 긁적이며) 그 책 쓸 때 스물여섯이었어. 빨리 쓴 글은 빨리 읽혀. 좋은 뜻만은 아니야.', when: feelAtLeast('nora', 60) },
    { text: '(손끝을 킁킁대며) 현상액 냄새 나지? 나는 이게 바다 냄새보다 좋아. 너는 반대겠지.', when: feelAtLeast('nora', 60) },
    { text: '(망원 렌즈를 끼우며) 축복제는 매년 신문 1면이야. 매년 같은 사진이지. 올해는 다를지도.', when: FESTIVAL_WEEK },
    { text: '(작게) 그 사건 기사, 내 이름으로 나간 거 다시 읽고 있어. 왜냐고는 묻지 마.', when: [feelAtLeast('nora', 80), days(36)] },
    { text: '(필름 통을 흔들며) 새벽에 그물 올리는 거, 한 장만 찍게 해 줘. 얼굴은 안 나오게.', when: [feelAtLeast('nora', 40), notStarted('Q_NORA_PHOTO')] },
  ],

  // ── 메이블: gossip. Won't sell to Eli until feeling ≥ 40. Starts at 30. ──
  mabel: [
    { text: '(먼지떨이를 휘두르며) 구경은 공짜야. 만지는 건 아니고.', when: feelBelow('mabel', 40) },
    { text: '(가격표를 붙이며) 할로우 씨한테는 아직 안 팔아. 소문이 나서 말이야.', when: feelBelow('mabel', 40) },
    { text: '(계산대를 몸으로 막으며) 그건 팔린 거야. 방금. 내가 샀어.', when: feelBelow('mabel', 40) },
    { text: '(돋보기 너머로) 손님들이 네 얼굴 보면 그냥 나가. 그러니 짧게 있다 가.', when: feelBelow('mabel', 40) },
    { text: '(낡은 라디오를 닦으며) 돈이 문제가 아니야. 동네 눈이 문제지. 그게 바뀌면, 그때.', when: feelBetween('mabel', 20, 40) },
    { text: '(찻잔을 닦으며) 저 약국 말이야, 파이크 박사가 8년째 월세를 내. 문도 안 열면서. 이상하지?' },
    { text: '(신문을 접으며) 듀이 말로는 통조림 공장 새우값이 또 내렸대. 들은 얘기야. 난 몰라.' },
    { text: '(실눈을 뜨며) 로사가 너한테 커피를 줬다는 소문이 있던데. 설마. 아니겠지.', when: feelAtLeast('rosa', 60) },
    { text: '(의자를 옮기며) 좋은 의자 들어왔어. 할로우 집 거실에 딱이겠던데.', when: feelAtLeast('mabel', 40) },
    { text: '(손바닥을 내밀며) 좋아, 이제 팔게. 대신 깎는 건 없어. 그건 소문 때문 아니고 내 성격이야.', when: feelBetween('mabel', 40, 60) },
    { text: '(박제 판을 두드리며) 큰 고기 잡으면 가져와. 40달러면 벽에 걸어 줄게. 솜씨는 동네 최고야.', when: feelAtLeast('mabel', 40) },
    { text: '(액자를 닦으며) 이 동네 물건은 다 한 번씩 여길 거쳐 가. 사람도 그러면 좋겠는데.', when: feelAtLeast('mabel', 40) },
    { text: '(포장지를 접으며) 거스 영감 선물이면 장화로 해. 그 영감 장화 구멍 난 지 3년 됐어.', when: [feelAtLeast('mabel', 40), upTo(GUS_LAST_DAY)] },
    { text: '(작은 소리로) 사람들이 네 얘길 좀 다르게 해. 내가 그렇게 말하고 다니니까.', when: feelAtLeast('mabel', 60) },
    { text: '(찻잔 두 개를 꺼내며) 앉아. 오늘 들은 소문 다 말해 줄게. 반은 거짓말이야. 어느 반인지는 몰라.', when: feelAtLeast('mabel', 80) },
    { text: '(리본 상자를 내놓으며) 축복제 장식은 다들 여기서 사 가. 너도 이제 "다들"이야.', when: [feelAtLeast('mabel', 40), FESTIVAL_WEEK] },
  ],

  // ── 빈스: pawnshop, transactional 반말. No feeling value; varies by day and money. ──
  vince: [
    { text: '(시계 줄을 고치며) 팔 거 있어? 없으면 구경만 해.' },
    { text: '(돈을 세며) 니 애비 물건 몇 개가 여기 있지. 경매에서 넘어왔어. 사고 싶으면 돈 가져와.' },
    { text: '(껌을 씹으며) 바다에서 건진 잡동사니? 쓸 만한 건 사 줄게. 쓸 만한 것만.' },
    { text: '(돋보기를 끼고) 진짜 금은 이빨로 안 깨물어. 영화 보고 배운 놈들이 다 그래.' },
    { text: '(카운터를 손가락으로 두드리며) 외상은 없어. 할로우 집이든 교황이든.' },
    { text: '(전당표를 정리하며) 맡긴 물건 찾으러 오는 사람, 열에 셋이야. 나머지는 내 거 되지.' },
    { text: '(낡은 쌍안경을 들어 보이며) 이거 해군 거야. 진짜야. 아마도. 30달러.' },
    { text: '(트럼펫을 닦으며) 이 동네엔 트럼펫 부는 사람이 없어. 그래서 3년째 여기 있어. 불 줄 알아?' },
    { text: '(라디오 볼륨을 줄이며) 바다 날씨는 바다가 알려 주지. 라디오는 그냥 시끄러운 거고.' },
    { text: '(동전을 손가락으로 굴리며) 그물에 이상한 거 걸리면 버리지 마. 누군가한텐 보물이야. 누군가가 나고.', when: days(5) },
    { text: '(장부를 덮으며) 니 애비는 여기 한 번도 안 왔어. 맡길 게 없는 양반이었지. 자랑은 아니고.', when: days(8) },
    { text: '(눈을 가늘게 뜨며) 주머니가 두둑해 보이는데. 들어와. 구경은 길게 해도 돼.', when: { money: { gte: 300 } } },
    { text: '(힐끗 보고) 빈손이네. 팔 거 있으면 와. 없으면 비켜. 문 앞이야.', when: { money: { lt: 50 } } },
    { text: '(진열장에 깃발을 꽂으며) 축복제 날은 장사가 안 돼. 다들 바다만 보거든. 나는 돈만 보고.', when: FESTIVAL_WEEK },
    { text: '(유리 진열장에 입김을 불며) 그 페인트 싸구려지? 햇빛에 글자가 비쳐. 좋은 페인트는 비싸.', when: [days(4), { flag: 'paintedOver', eq: 'cheap' }] },
    { text: '(손님 없는 가게를 둘러보며) 요즘 네가 들르니까 사람들이 덜 와. 아니, 원래 안 왔나.', when: days(15) },
  ],

  // ── 행크: no words at all until the ranking gives him his first ones. Starts at 25. ──
  hank: [
    hankSilent('(행크는 통발만 본다. 대꾸가 없다.)'),
    hankSilent('(행크가 바닥에 침을 뱉고 등을 돌린다.)', feelBelow('hank', 40)),
    hankSilent('(행크는 담배 연기만 길게 내뿜는다. 이쪽은 보지도 않는다.)', feelBelow('hank', 40)),
    hankSilent('(그물 추를 세던 손이 잠깐 멈췄다가, 다시 센다.)', feelBelow('hank', 60)),
    hankSilent('…흠.', feelBelow('hank', 40)),
    hankSilent('(행크가 모자를 눌러쓰고 어시장 안쪽으로 들어가 버린다.)', feelBelow('hank', 40)),
    hankSilent('(행크가 내 아이스박스를 힐끗 본다. 아주 조금 고개를 끄덕인다. 아니면 졸았거나.)', feelAtLeast('hank', 40)),
    hankSilent('(행크는 대답 대신 발로 통발을 밀어 길을 비켜 준다.)', feelAtLeast('hank', 40)),
    hankSilent('…음.', feelAtLeast('hank', 40)),
    hankSilent('(행크가 미끼 양동이를 말없이 내 쪽으로 민다.)', feelAtLeast('hank', 60)),
    hankSilent('(행크가 턱으로 바다 쪽을 가리킨다. 오늘은 저쪽이라는 뜻 같다.)', feelAtLeast('hank', 60)),
    hankSilent('(행크가 통발 하나를 툭 친다. 내가 건져 온 거다. 그게 다다.)', done('Q_HANK_TRAPS')),
    hankSilent('(다른 어부들은 고개를 끄덕이는데, 행크만 끝까지 안 끄덕인다.)', feelAtLeast('fishermen', 40)),
    hankSpeaks('…또 왔냐.'),
    hankSpeaks('(통발을 고치며) 썰물 끝물에 굴 양식장. 그 이상은 안 알려 준다.'),
    hankSpeaks('(모자를 벗었다 쓰며) 일등 했다고 우쭐하지 마. 바다는 순위표 안 본다.'),
    hankSpeaks('(눈을 가늘게 뜨고) 니 애비도 말이 없었지. 그건 닮았네.', feelAtLeast('hank', 60)),
    hankSpeaks('(담배를 말며) 밤바다는 다 보여. 사람들이 안 볼 뿐이지.', feelAtLeast('hank', 60)),
    hankSpeaks('(미끼 통을 건네며) 오늘 건 공짜다. 내일부턴 돈 내.', feelAtLeast('hank', 80)),
  ],

  // ── 메이지: eight, curious; her mother told her not to talk to Eli. Starts at 30. ──
  maisie: [
    { text: '(사탕을 까며) 엄마가 아저씨랑 너무 오래 얘기하지 말래요. 그래서 짧게 해요. 안녕!', when: feelBelow('maisie', 70) },
    { text: '(게시판 뒤에서 고개만 내밀고) …아저씨가 그 아저씨예요? 펠리컨 배 아저씨?', when: feelBelow('maisie', 40) },
    { text: '(분필을 등 뒤로 감추며) 그림 그리는 거 아니에요. 그냥 서 있는 거예요.', when: feelBelow('maisie', 40) },
    { text: '(게시판의 그림을 가리키며) 이거 비스킷이에요. 갈색이고 귀가 크고 꼬리가 말렸어요. 봤어요?', when: active('Q_BOTTLE'), weight: 2 },
    { text: '(분필로 땅에 그림을 그리며) 일라이 아저씨! 이거 장부예요. 부리가 너무 커서 다 안 그려져요.', when: feelAtLeast('maisie', 40) },
    { text: '(진지하게) 아저씨, 새우는 왜 다리가 그렇게 많아요? …아저씨도 몰라요?', when: feelAtLeast('maisie', 40) },
    { text: '(코를 찡그리며) 아저씨한테서 새우 냄새 나요. 좋은 냄새는 아니에요. 그래도 괜찮아요.', when: feelAtLeast('maisie', 40) },
    { text: '(비스킷 목줄을 쥐고) 비스킷이 이제 모래언덕 안 가요. 내가 약속받았어요.', when: done('Q_BOTTLE') },
    { text: '(비스킷 귀를 접었다 폈다 하며) 비스킷이 아저씨 냄새 기억해요. 꼬리 막 돌아가잖아요.', when: done('Q_BOTTLE') },
    { text: '(손바닥을 펴 보이며) 사탕 다 드린다고 했잖아요. 두 개 먹었어요. 하나만 드려도 돼요?', when: [done('Q_BOTTLE'), upTo(20)], weight: 2 },
    { text: '(종이배를 내밀며) 이거 메리 루예요. 펠리컨도 태웠어요. 진짜는 무거우니까 그림으로요.', when: feelAtLeast('maisie', 60) },
    { text: '(병을 들고) 이번엔 병에 그림 넣어서 띄울 거예요. 답장 오면 아저씨한테 제일 먼저 보여 줄게요.', when: feelAtLeast('maisie', 60) },
    { text: '(속삭이며) 엄마가 이제 아저씨랑 얘기해도 된대요. 오 분만요. 지금 사 분 남았어요.', when: [feelAtLeast('maisie', 70), feelAtLeast('joanne', 40)] },
    { text: '(종이 깃발을 흔들며) 축복제에 비스킷도 데려갈 거예요! 개도 축복받아요? 신부님한테 물어봐 줘요.', when: [feelAtLeast('maisie', 40), FESTIVAL_WEEK] },
    { text: '(아저씨 손을 잡아끌며) 아저씨는 나쁜 사람 아니에요. 비스킷이 그랬어요. 개는 다 알아요.', when: feelAtLeast('maisie', 80) },
    { text: '(조개껍데기를 내밀며) 이거 바닷가에서 주웠어요. 아저씨 배에 붙여요. 행운이에요.', when: feelAtLeast('maisie', 60) },
  ],

  // ── 에이다: Edith's neighbor, clearing the house before it's sold (from Day 37). Starts at 40. ──
  ada: [
    { text: '(문간을 막고 서서) 이 집은 곧 팔려. 구경할 건 없어.', when: feelBelow('ada', 40) },
    { text: '(빗자루 끝으로 현관을 가리키며) 신발 털어. 아니, 들어오지 마. 아직은.', when: feelBelow('ada', 40) },
    { text: '(빗자루를 들고) 에디스 집 정리를 도와주는 사람이 있다니. 세상에.', when: feelAtLeast('ada', 40) },
    { text: '(커튼을 걷으며) 에디스는 이 창가에서 바다를 봤어. 하루 종일. 뭘 기다리는 사람처럼.', when: feelAtLeast('ada', 40) },
    { text: '(찻잔을 들고) 이거 내가 결혼 선물로 준 거야. 50년 전에. 이가 하나도 안 나갔네.', when: feelAtLeast('ada', 40) },
    { text: '(상자에 책을 담으며) 다음 주에 부동산 사람이 온대. 남한테 가는 것도 싫고, 비어 있는 것도 싫어.', when: feelAtLeast('ada', 40) },
    { text: '(허리를 펴며) 아이고. 일흔 넘으면 빗자루가 지팡이야.' },
    { text: '(라디오를 켜 보며) 에디스가 맨날 듣던 채널이야. 날씨만 나와. 그래도 좋아했어.', when: feelAtLeast('ada', 40) },
    { text: '(정원 쪽을 보며) 장미가 다 말라 버렸네. 에디스가 봤으면 난리 났을 거야.' },
    { text: '(창틀 먼지를 쓸며) 7년 동안 아무도 이 문을 안 열었어. 나도 못 열었고.', when: feelAtLeast('ada', 40) },
    { text: '(차를 따르며) 젊은 사람이 이렇게 일 잘하는 거 오랜만에 봐. 할로우 집 애라도 말이야.', when: feelAtLeast('ada', 60) },
    { text: '(작게 웃으며) 에디스는 생선을 싫어했어. 바닷가에 살면서. 웃기지?', when: feelAtLeast('ada', 60) },
    { text: '(사진첩을 덮으며) 사진 속 에디스는 늘 웃고 있어. 사진 찍을 때만 웃는 사람이 있지.', when: feelAtLeast('ada', 60) },
    { text: '(상자 테이프를 뜯으며) 에디스 얘기를 끝까지 들어 준 사람은 네가 처음이야.', when: [feelAtLeast('ada', 40), { evidence: 'E_EDITH_NEIGHBOR' }] },
    { text: '(열쇠 하나를 건네며) 정원 창고 열쇠야. 연장 필요하면 써. 에디스도 그랬을 거야.', when: feelAtLeast('ada', 80) },
    { text: '(손수건으로 이마를 닦으며) 이 동네는 여름이 너무 길어. 에디스는 그것도 좋아했지만.' },
  ],
};

/** The eligible pool for one person right now (weights expanded into repeats). */
export function talkLinesFor(s: GameState, who: CharId): TalkLine[] {
  const out: TalkLine[] = [];
  for (const l of SMALLTALK[who] ?? []) {
    if (l.remembers && !s.calvinMemory.includes(l.remembers)) continue;
    if (!check(s, l.when)) continue;
    const n = Math.max(1, Math.round(l.weight ?? 1));
    for (let i = 0; i < n; i++) out.push(l);
  }
  return out;
}
