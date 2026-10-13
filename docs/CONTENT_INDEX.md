# 콘텐츠 목록 (CONTENT_INDEX)

## 프롤로그

8장 그림책 — src/scenes/Prologue.ts (새 게임 직후, 건너뛰기 가능)

## 이벤트

모든 이벤트에 `summary`(한국어 1~2줄)가 있음. 수첩 "지난 이야기"에 쓰임.

| ID | 날짜 · 구간 | 파일 |
| --- | --- | --- |
| W1_FUNERAL | 1일 오전 | src/data/events/week1.ts |
| W1_BANK | 1일 오전 (상환표 · 빨간 공식 안내문) | src/data/events/week1.ts |
| W1_FIRST_TRIP | 1일 오후 → 그물질(거스의 자리, 튜토리얼) | src/data/events/week1.ts |
| W1_HOME_FIRST | 1일 저녁 | src/data/events/week1.ts |
| W1_FIRST_SALE | 2일 오전 | src/data/events/week1.ts |
| W1_LETTER_BOX | 2일 저녁 | src/data/events/week1.ts |
| W1_GRAFFITI | 3일 새벽 (페인트 미니게임) | src/data/events/week1.ts |
| W1_GRAFFITI_BEER | 3일 저녁 | src/data/events/week1.ts |
| W1_CALVIN_LIGHTHOUSE | 4일 오전 | src/data/events/week1.ts |
| W1_LOGBOOK_X | 4일 저녁 | src/data/events/week1.ts |
| W1_BOTTLE | 5일 오전 | src/data/events/week1.ts |
| W1_KNOT_LESSON | 6일 새벽 (매듭 미니게임) | src/data/events/week1.ts |
| W2_ROSA_ICE | 8일 오전 (부두, 로사와 듀이) → Q_ROSA_ICE | src/data/events/week2_3.ts |
| W2_CALVIN_COOKOUT | 10일 저녁 (캘빈 마당, 장부가 캘빈 손 생선을 거절 D04) → Q_CALVIN_KNOTS | src/data/events/week2_3.ts |
| W2_LINES_CUT | 12일 새벽 (밧줄이 잘림, 캘빈이 다시 묶어 줌) | src/data/events/week2_3.ts |
| W3_GUSSPOT_UNLOCK | 15일 새벽 ("이제 거기 알지? 혼자 가.") | src/data/events/week2_3.ts |
| W3_NORA | 16일 오후 (카메라) → Q_NORA_PHOTO | src/data/events/week2_3.ts |
| W3_HANK | 17일 새벽 (미끼 가판대) → Q_HANK_TRAPS | src/data/events/week2_3.ts |
| W3_RADIO_NEWS | 20일 새벽 (라디오가 있을 때만) | src/data/events/week2_3.ts |
| LOGBOOK_SAL_NIGHT | 20~59일 저녁, E_ROSA_BACKDOOR 뒤 → E_LOGBOOK_DOCKED | src/data/events/week2_3.ts |
| ROSA_BOOTS | 15~59일 오후 식당, Q_ROSA_ICE 완료·로사 ≥ 60 → E_ROSA_BOOTS | src/data/events/week2_3.ts |
| HANK_NIGHT_CAR | 22~59일 새벽, Q_HANK_TRAPS 완료·행크 ≥ 60 → E_PIKE_CAR | src/data/events/week2_3.ts |
| W4_PIKE | 22일 오후 → Q_PIKE_ERRANDS | src/data/events/week4_5.ts |
| W4_PRIYA | 23일 오후 → Q_BANK_LEDGER | src/data/events/week4_5.ts |
| W4_SAL_DAY | 27일 오후 (식당 휴무 "오늘은 쉽니다.", 샐의 머그 D14) | src/data/events/week4_5.ts, src/scenes/Town.ts |
| W5_FESTIVAL_NEWS | 29일 오후 (메리 루가 명단에 없음) → Q_BLESSING | src/data/events/week4_5.ts |
| W5_FESTIVAL | 34일 오후 (축복 받음 / 부두 끝에서 혼자, 두 갈래) | src/data/events/week4_5.ts |
| W5_FESTIVAL_NIGHT | 34일 저녁 (거스가 처음 웃으며 아버지 얘기) | src/data/events/week4_5.ts |
| W1_PAYMENT | 금요일 17:00 (생성 장면: 거스 커피 깡통 · 납부 · 연체 경고장 · 압류) | src/scenes/Cutscene.ts (`payment`) |
| (월요일 마감) | 연체가 있는 월요일 17:00 (생성 장면) | src/scenes/Cutscene.ts (`deadline`) |
| 압류 결말 | 월요일 미납 또는 두 번째 금요일 부족 | src/scenes/Ending.ts |
| SUN_CHURCH | 일요일 오전 (선택) | src/data/events/common.ts |
| LEE_FINE | 거북을 버린 다음 날 아침 | src/data/events/common.ts |

## 퀘스트

| ID | 단계 | 파일 |
| --- | --- | --- |
| Q_BOTTLE | 모래언덕 수색 → (다음 날) 보트하우스 → 메이지 집 | src/data/quests/bottle.ts |
| Q_ROSA_ICE | 얼음 나르기 ×3 → 샐의 그물 꺼내기 (E_ROSA_BACKDOOR, 날짜) → 새벽에 그물 손질 → 새우 바구니 | src/data/quests/rosaIce.ts |
| Q_CALVIN_KNOTS | 매듭 수업 ×3 → 떨어진 액자 다시 걸기 ("제 취미예요") → 토비에게 매듭 판 (E_WHISTLE_TEACHER) | src/data/quests/calvinKnots.ts |
| Q_NORA_PHOTO | 일출(새벽 부두) → 갑판 분류 → 장부 → 식당 간판 → 암실 현상 (선창 증거 사진) | src/data/quests/noraPhoto.ts |
| Q_HANK_TRAPS | 표지 찾기 → 그물로 통발 2개 (강 하구·굴 양식장) → 손질 → 돌려주기 (반값 미끼) | src/data/quests/hankTraps.ts |
| Q_PIKE_ERRANDS | 소포 ×3 (하나는 에디스 앞) → 약국 뒷방 (E_PHARMACY_LEDGER) → 저녁에 사건 벽 | src/data/quests/pikeErrands.ts |
| Q_BANK_LEDGER | 상자 나르기 → 메모 분류 ("W.") → 수첩 받기 (E_DANIEL_NOTES) → 저녁에 읽기 | src/data/quests/bankLedger.ts |
| Q_BLESSING | 새벽에 메리 루 칠하기 → 신부님께 부탁 → 성당 배 장식 ×2 | src/data/quests/blessing.ts |

## 편지

| 번호 | 파일 |
| --- | --- |
| L01–L12 (변경 요청 1 규칙으로 다시 씀. L01은 의뢰인 원문) | src/data/letters/l01_12.ts |
| L13–L24 (1983년 5월 – 1984년 4월, L16부터 대니얼 이야기, L20 원문) | src/data/letters/l13_24.ts |
| L25–L36 (1984년 5월 – 1985년 4월, L35에서 대니얼 이야기 멈춤, L36 엄마 쪽으로) | src/data/letters/l25_36.ts |

## 물고기 · 미끼 · 새우

| 내용 | 파일 |
| --- | --- |
| 물고기 36종 (흔함 8 / 보통 12 / 희귀 10 / 아주 희귀 2 / 전설 4), 장소·조건·크기·패턴·행동·층·미끼 | src/data/fish.ts |
| 물고기 그림 (모양별 코드 그림), 황금 새우, 전설 어둠 효과 | src/art/fish.ts |
| 미끼 4종 (새우 $2×10, 살아있는 핀피시 $4×4, 게 $3×5, 루어 $6 재사용) | src/data/bait.ts |
| 새우 3종 (갈색/흰/분홍) | src/data/catch.ts |
| 출현표 · 파이팅 · 바다 속 물고기 움직임 | src/systems/fishSpawn.ts, src/systems/fight.ts, src/scenes/sea/SeaLife.ts |

## 만난 사람 (수첩 "지금 상황")

src/data/people.ts — 거스, 캘빈, 토비, 매튜 신부, 프리야, 듀이, 장부, 메이지, 조앤, 행크, 로사, 리 단속관 등 (만난 조건 포함)

## 증거 (이름만, 내용은 M4)

src/data/evidenceNames.ts — E_LOGBOOK_DOCKED … E_DUNBAR_PADDING (21개)

## 사건 벽 진술

src/data/caseWall.ts — S01–S09

## 세부 디테일 (D01–D22)

| ID | 상태 | 위치 |
| --- | --- | --- |
| D01 | 구현 (새벽 항구: 나갈 때 깊이 잠김·클릭 가능, 45일 더 깊게 / 오전 판매: 가볍게 떠 있음) | src/scenes/Harbor.ts, src/scenes/Market.ts |
| D04 | M2 (10일 캘빈의 바비큐) | — |
| D06 | 구현 (토비 휘파람 7음 고정 모티프, 등장 시 음표) | src/audio/sfx.ts `WHISTLE_MOTIF`, src/ui/Stage.ts |
| D07 | 구현 (갑판의 닳은 자리, 일라이 자리는 출항할수록 진해짐) | src/scenes/Deck.ts |
| D08 | 구현 일부 (갑판 위 거스의 커피 깡통) | src/scenes/Deck.ts |
| D09 | 구현 (싼 페인트는 맑은 날 KILLER가 비침) | src/scenes/Harbor.ts, src/scenes/Trawl.ts |
| D10 | 구현 (61일 아침 "sorry") | src/systems/overnight.ts, src/scenes/Harbor.ts |
| D11 | 구현 (조타실 창틀의 어린 시절 사진) | src/art/boats.ts, src/art/backdrops.ts |
| D12 | 데이터만 (52일 411) | src/systems/overnight.ts |
| D13 | 구현 (성당 초 개수, 51일 8개) | src/art/backdrops.ts, src/systems/overnight.ts |
| D14 | 구현 일부 (식당 벽 SAL 머그) | src/art/backdrops.ts |
| D15 | 구현 (약국 "곧 돌아옵니다", 메이블 소문) | src/art/backdrops.ts, src/data/dialogue/smalltalk.ts |
| D17 | 구현 (편지 손글씨 떨림·검열필 도장 증가) | src/systems/letters.ts, src/ui/overlays.ts |
| D18 | 구현 (L01 새우 그림) | src/data/letters/l01_12.ts, src/ui/overlays.ts |
| D20 | 구현 일부 (일지 두 가지 글씨, 줄 긋기 기능) | src/scenes/Home.ts, src/data/logbook.ts |
| D21 | 구현 (어군 탐지기: 등대 앞만 잡음) | src/scenes/SeaMap.ts |
| D02, D03, D05, D16, D19, D22 | M2~M4 | — |

## 마을 사람 대사 · 항해 일지 (M2)

- 평소 대사: src/data/dialogue/smalltalk.ts — 마을 사람 14명, 사람당 16~29줄. 호감 단계·주차·퀘스트·증거에 따라 달라짐. 캘빈은 기억한 대답을 다시 꺼냄(D05). 거스는 44일까지만. 행크는 순위 1등 전까지 대꾸 안 함.
- 항해 일지: src/data/logbook.ts — 아버지 낚시 안내 25쪽(날짜·조건으로 열림, 일부는 어장 팁도 줌), 일라이 글씨 30쪽, 줄 그은 추측 6개(D20).
- 만난 사람: src/data/people.ts — 던바, 메이블, 빈스, 노라, 파이크, 루시아, 에이다, 콜 변호사, 웹 부부 추가.

## 마을 (M2)

| 내용 | 파일 |
| --- | --- |
| 마을 배치(건물 16곳, 해안선, 냇가, 길, 길찾기) | src/scenes/town/townMap.ts |
| 땅 낚시터 4곳 | src/data/shore.ts |
| 해변에서 줍는 것 10종 | src/data/finds.ts |
| 게시판 주문·어부 순위 | src/systems/board.ts |
| 라디오 예보 | src/systems/forecast.ts |
| 도감 | src/ui/encyclopedia.ts |
