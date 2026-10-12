# 콘텐츠 목록 (CONTENT_INDEX)

## 이벤트

| ID | 날짜 · 구간 | 파일 |
| --- | --- | --- |
| W1_FUNERAL | 1일 오전 | src/data/events/week1.ts |
| W1_BANK | 1일 오전 | src/data/events/week1.ts |
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
| W1_PAYMENT | 금요일 오후 끝 (생성 장면) | src/scenes/Cutscene.ts (`payment`) |
| SUN_CHURCH | 일요일 오전 (선택) | src/data/events/common.ts |
| LEE_FINE | 거북을 버린 다음 날 아침 | src/data/events/common.ts |

## 퀘스트

| ID | 단계 | 파일 |
| --- | --- | --- |
| Q_BOTTLE | 모래언덕 수색 → (다음 날) 보트하우스 → 메이지 집 | src/data/quests/bottle.ts |

## 편지

| 번호 | 파일 |
| --- | --- |
| L01–L12 | src/data/letters/l01_12.ts |

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
