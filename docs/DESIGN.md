# BUILD PROMPT — 「장부 (Ledger)」

**Always reply to the human in Korean (한국어로만 대답하세요).**

You are the lead developer, designer, and writer for a complete, playable video game called **「장부 (Ledger)」**. This document is your full specification. The person who commissioned it will **not** read your code or answer technical questions. You must make the game yourself, end to end, at the quality and depth described here.

Read this entire document before writing any code. Then re-read Section 1 and Section 2 before every milestone.

---

## 0. How to work (read first)

### 0.1 Priority order when instructions seem to conflict

1. **Section 2 – Non-negotiables.** Never break these.
2. **Acceptance criteria** in Section 15 for the current milestone.
3. **Detailed specs** in Sections 3–14.
4. **Your own judgment**, guided by the design pillars in Section 1.3.

### 0.2 When something is unspecified or ambiguous

Do not stop to ask. Decide using this order:

1. Keep the story canon (Section 6) intact.
2. Keep the cozy surface intact (no new stress systems, no timers, no punishment).
3. Pick the simplest option that still feels hand-crafted.

Then log the decision in `docs/DECISIONS.md` (one line: date, decision, reason). Only stop and ask the human if you are truly blocked (for example, a required tool is missing from your environment).

### 0.3 Files you must create and keep updated

- `docs/DESIGN.md` — a verbatim copy of this document. Never edit it. It is the source of truth.
- `docs/PROGRESS.md` — milestone checklist (Section 15) with each item ticked as done, plus known issues.
- `docs/DECISIONS.md` — every judgment call you made.
- `docs/CONTENT_INDEX.md` — a table of every letter, event, quest, evidence item and detail ID, with the file where it is implemented.

### 0.4 How to report

At the end of each milestone, write a short report in `docs/PROGRESS.md`:

- What is done (tick the acceptance criteria).
- How to play-test it (exact debug commands to jump there).
- What is not done and why.

Never claim something works unless you ran it or a test proved it. If a test fails, say so.

### 0.5 Things AI builders commonly get wrong on projects like this — do not do them

- **Do not ship placeholder text.** No `TODO`, `lorem`, `...`, `(대사)`, `[편지 내용]` in any player-facing string. All 72 letters, all dialogue, all event scenes must be fully written. There is a test for this (Section 15).
- **Do not shrink the content to save effort.** If the spec says 72 letters, write 72. If it says 22 details, implement 22.
- **Do not "improve" the story.** Do not add twists, villains, romance, supernatural elements, combat, or new characters with plot roles.
- **Do not add real-time pressure** except where this document explicitly asks for it.
- **Do not reveal the killer early.** Before Day 60 (the hearing), no line of text, UI, achievement name, file name visible to the player, or tooltip may state that Calvin is the killer.
- **Do not build one giant file.** Keep systems in separate modules and content in data files.
- **Do not skip verification.** Run the type-checker, linter and tests after every meaningful change.

---

## 1. Project summary

### 1.1 One-line pitch (shown on the title screen's subtitle)

> 연쇄살인범은 이미 처형됐다. 마을은 사건이 끝났다고 말한다. 처형된 사람은 내 아버지다.

### 1.2 What the game is

A cozy 2D shrimp-trawling and small-town life game set in a sunny Gulf Coast fishing village in the late 1980s. The player is **Eli Harlow (일라이 할로우)**, a 32-year-old unemployed man whose father **Walt** was executed as a serial killer. Eli inherits Walt's old shrimp boat **Mary Lou (메리 루 호)** and its bank debt, and must work one 10-week shrimp season to pay it off. The town hates him.

For the first five weeks it plays as a warm, tactile life game: fish at dawn, sort the catch on deck, sell it, spend afternoons helping neighbors, read one of Dad's letters each night. From week 6 the same routines start to mean something else. By week 10 the player understands what really happened, and the person responsible meets the sea.

### 1.3 Design pillars

1. **Week 1 must already be fun.** The core loop (trawl → sort → sell) must feel good in 30 seconds.
2. **Peace first, then cracks.** Weeks 1–5 are peaceful. Week 6 the cracks begin. Never rush this.
3. **Always a next step.** The quest notebook always shows a concrete place and time to go. No "go talk to everyone".
4. **Work, not chatter.** Every conversation happens while doing something: carrying, fixing, hauling, photographing.
5. **Money never blocks the story.** Earning little is tight but survivable. Earning a lot makes life cozier and faster. Neither changes the ending.
6. **No supernatural. The only monster is a person.** Violence is never shown; things vanish, are empty, or come up in the net.
7. **Obsessive details.** Small, consistent, systemic details that are cute in weeks 1–5 and chilling after week 6.

### 1.4 Language

- **Talk to the human in Korean only.** Every chat reply, question, status update, and report you give the person who commissioned this game must be written in Korean, even though this document is in English. `docs/PROGRESS.md` and `docs/DECISIONS.md` are also written in Korean.
- **All player-facing text is Korean.** Use natural, modern Korean.
- Proper nouns are transliterated Korean (일라이, 캘빈, 펠리컨 코브). On first appearance in a scene, a name may show its English in small text.
- Code, comments, file names, and IDs are English.

---

## 2. Non-negotiables

1. Story canon in Section 6 is fixed. Names, relationships, who did what, and the order of events must not change.
2. No supernatural, no monsters, no combat, no guns used by the player, no gore. Deaths and violence are only implied (absence, objects, sounds cut off by a fade).
3. No night sailing system. The player can never fish at night, except the single scripted finale (Day 67).
4. The father's rule is **"등대 앞 그 자리에는 절대 그물을 내리지 마라."** Never phrase it as a rule about the night.
5. Calvin never uses the words 수집, 수집품, collection, collector. He calls the place **"내 자리"**.
6. No grid/Tetris inventory or cargo puzzle. Sorting is a deck-sorting minigame (Section 8.3).
7. Gifts never fix hatred. Gifts given to someone at 증오 or 냉담 make it worse.
8. Earning a lot of money is never punished and never ends the game early. Paying off the debt early triggers a celebration, not an ending.
9. The only failure state is bank repossession after **3 consecutive weeks of $0 payment** (Section 8.4).
10. Every story beat in Section 9 happens on its scheduled day regardless of money, quests, or relationship values. Optional content changes how much the player knows and how the hearing goes, never whether the main beats happen.
11. Calvin's guilt is not stated to the player before Day 60. Clues may be visible; conclusions may not be written for the player.
12. The finale's choice (Section 12) must be passive-by-default: if the player does nothing, the rope is not thrown.
13. Tone: sunny pastel visuals, gentle music, warm humor on the surface. Dread comes only from implication and recontextualization. No jump scares.

---

## 3. Technical specification

### 3.1 Stack

- **Phaser 3 + TypeScript + Vite.** Runs in a desktop browser. Target 1280×720 logical resolution, scaled to fit (FIT mode), crisp at 1920×1080.
- **Vitest** for tests. ESLint + `tsc --noEmit` must pass.
- No backend. Save to `localStorage` (one autosave slot + manual export/import of save JSON from the pause menu).
- Korean web font: load **"Gowun Dodum"** or **"Jua"** from Google Fonts for UI, with `"Noto Sans KR", sans-serif` fallback. The game must still render correctly if fonts fail to load.

If Phaser is unavailable in your environment, use a comparable 2D web framework and log it in `DECISIONS.md`. Do not switch to 3D.

### 3.2 Project structure (suggested; keep the separation)

```
src/
  main.ts
  config/           tuning.ts (all numbers from this doc, in one place)
  core/             calendar.ts, state.ts, save.ts, events.ts, flags.ts, rng.ts
  systems/          fishing.ts, sorting.ts, economy.ts, shop.ts, feelings.ts,
                    schedules.ts, quests.ts, letters.ts, logbook.ts, caseWall.ts,
                    hearing.ts, details.ts, ledger(pelican).ts
  scenes/           Boot, Title, Dawn(Harbor), SeaMap, Trawl, Deck, Market,
                    Town, Location, Home, Letters, CaseWall, Hearing, Storm,
                    Cutscene, Shop, Pause, Ending, Credits, Debug
  ui/               dialogue box, notebook, HUD, toasts, choice menu
  data/             characters.ts, locations.ts, schedules.ts, grounds.ts,
                    catch.ts, shopCatalog.ts, quests/*.ts, events/*.ts,
                    letters/*.ts, dialogue/*.ts, evidence.ts, caseWall.ts,
                    hearing.ts, details.ts, endings.ts
  art/              procedural sprite generators + palette.ts + manifest.ts
  audio/            synth sfx + music stubs
tests/
docs/
```

### 3.3 Data-driven content

All story content (dialogue, letters, events, quests, evidence, schedules, shop items, details) lives in typed data files, not hard-coded inside scenes. Scenes read data. A **scripted event** is a list of steps:

```ts
type Step =
  | { t: 'say'; who: CharId; text: string; mood?: Mood }
  | { t: 'narrate'; text: string }
  | { t: 'choice'; options: { text: string; then: Step[] ; effects?: Effect[] }[] }
  | { t: 'move'; who: CharId; to: Point; ms?: number }
  | { t: 'camera'; to: Point; zoom?: number; ms?: number }
  | { t: 'fade'; dir: 'in' | 'out'; ms?: number }
  | { t: 'sfx'; id: string } | { t: 'music'; id: string | null }
  | { t: 'wait'; ms: number }
  | { t: 'effect'; effects: Effect[] }   // flags, money, feelings, items, evidence, quests
  | { t: 'showItem'; item: ItemId }
```

Events declare their trigger: `{ day?: number; segment?: Segment; location?: LocId; requires?: Cond[]; once: true }`.

### 3.4 Debug tools (required)

Open with `F9` or URL `?debug=1`:

- Jump to any day and segment. Set money. Set any NPC feeling value. Set/clear flags. Give any item or evidence. Trigger any event by ID. Toggle "show hidden truths" overlay (lists canon facts for testing only).
- "Simulate days" — auto-play N days with a chosen player profile (poor / average / great) for economy testing.
- All debug UI is unavailable in production builds unless `?debug=1`.

### 3.5 Save

Autosave when the player sleeps. The save stores day, segment, money, debt schedule, all flags, feelings, quest states, letters read/burned, evidence, case-wall progress, decorations, purchases, and the deck-wear counter (Detail D07). Loading must restore the exact state.

---

## 4. Art and audio direction

### 4.1 Look

- **Cute, rounded, pastel, sunny.** Chibi characters (big head, small body), thick soft outlines, flat colors, gentle shading. Think a warm picture book, not a horror game.
- Bright Gulf Coast: turquoise water, cream sand, pastel wooden houses, a neon diner sign, palm trees, pelicans.
- Time of day = color grading: dawn pink-lilac, morning gold, afternoon bright, evening orange, night deep blue (night only seen in cutscenes and the finale).
- Weather: clear, cloudy, rain, wind. Storm only in week 10.

### 4.2 Palette (tokens in `art/palette.ts`)

| Token | Hex | Use |
| --- | --- | --- |
| sea | #6CC4D6 | water |
| seaDeep | #3D8FA8 | deep water, shadows |
| sand | #F5E3B3 | beach, paper |
| mint | #A8E6CF | houses, UI accents |
| coral | #FF8B94 | Mary Lou trim, highlights |
| butter | #FFE29A | sun, lamps |
| peach | #FFC7A8 | skin, warm UI |
| lilac | #C9B6E4 | dawn, letters |
| ink | #3B3355 | outlines, text |
| killerRed | #D7263D | the graffiti only |

### 4.3 Sprites

You will most likely not have an image generator. Build **procedural sprites** (Phaser Graphics → generated textures) that look intentional and cute, not like debug boxes. Every character must be recognizable by silhouette and one signature item:

| Character | Signature |
| --- | --- |
| Eli | grey hoodie, messy hair, slouch |
| Gus | red knit beanie, white beard, yellow oilskin bib |
| Calvin | tan fishing vest, bucket hat, round glasses, always smiling |
| Toby | khaki deputy uniform, round face, whistling note particles |
| Rosa | apron, dark bun, coffee pot |
| Father Matthew | black clerical shirt, white collar |
| Nora | beret, camera strap |
| Sheriff Dunbar | cowboy hat, big belt buckle |
| Dr. Pike | white coat, thin, hunched |
| Ledger (pelican) | white, huge orange pouch beak |

Register all textures in `art/manifest.ts` by key so a human can later replace them with drawn PNGs without code changes.

### 4.4 Audio

Optional but nice: WebAudio-synthesized SFX (winch whirr, net splash, shrimp plop, cash bell, letter paper, pelican squawk, whistle melody). Music can be simple synthesized loops or silence. **Toby's whistle melody** must be a fixed 6–8 note motif reused everywhere (it is a clue, Detail D06).

---

## 5. World and characters

### 5.1 Setting

**펠리컨 코브 (Pelican Cove)**, a small shrimping village on the Gulf of Mexico, late 1980s. Population sign at the entrance: **"펠리컨 코브 · 인구 412명"**. Wooden docks, one diner, one Catholic church, a bank branch, a sheriff's office, a fish market, a cannery truck that comes to the dock every morning, a secondhand shop, a pawnshop, a closed pharmacy, a lighthouse on the point.

### 5.2 Locations (town map nodes)

`home` (Walt's house, run-down), `dock` (Mary Lou berth, cannery truck in mornings), `diner` (Rosa's), `church`, `bank`, `sheriff`, `fishMarket`, `secondhand` (Mabel), `pawn` (Vince), `pharmacy` (closed, June Pike's), `calvinCabin`, `gusHouse`, `edithHouse` (week 6+), `board` (town-square notice board), `lighthouse` (view only; the spot is offshore in front of it).

The town is a **clickable map with nodes**, not free-walk exploration. Clicking a node in the afternoon spends one afternoon slot and opens that location scene (a small illustrated room/area with the NPCs present per schedule and interactable objects).

### 5.3 Cast (display name — role — public face — hidden truth — voice)

| ID | Display | Role | Public face | Hidden truth | Voice (Korean) |
| --- | --- | --- | --- | --- | --- |
| eli | 일라이 할로우 | Protagonist, 32, unemployed | Drifted between jobs in the city, sleeps on friends' couches | Never opened any of Dad's 72 letters, never visited death row | Inner thoughts short, dry, self-deprecating; 반말 monologue |
| walt | 월트 할로우 | Father, captain, executed | Convicted serial killer | Found his friend Daniel's body in his net, sent it back on the current, saw Calvin, stayed silent to protect himself | Letters: 반말 to son, plain short sentences, rough but tender, fishing metaphors |
| gus | 거스 | Walt's deckhand of 30 years | Gruff old man | Begged Calvin for his life and gave false testimony against Walt | Very short 반말, grunts, "…" often; rare warmth |
| calvin | 캘빈 쇼 | Retired state investigator | Town hero who "solved" the case; kindest man in town | Born psychopath. For 14 years made people vanish and sank them at "내 자리". Killed Daniel and later Gus. Framed Walt | Warm 존댓말, gentle jokes, remembers everything you say |
| toby | 토비 핀치 | Young deputy | Cheerful, worships Calvin, always whistling | Overheard Gus's confession and innocently told Calvin | Bright 존댓말, eager, "선배님!" |
| dunbar | 로이 던바 보안관 | Elected sheriff | Folksy, "펠리컨 코브를 지킨 보안관" | Padded the case: added Edith's accident and June's disappearance to make "7 missing" a bigger story; re-election is everything | Politician's 반말-존댓말 mix, slogans |
| pike | 레너드 파이크 박사 | Doctor and county coroner | Grieving husband | Killed his wife June, staged it as a disappearance; Calvin knows and owns him | Nervous, formal, over-explains |
| nora | 노라 퀸 | Local reporter, bestselling author of 『펠리컨 코브의 어부』 | Curious, ambitious | Her original interview notes with Calvin contain a detail only the killer could know (Section 6.3) | Quick, curious, slightly guilty |
| matthew | 매슈 신부 | Parish priest | Quiet, kind, asks nothing | Holds Gus's sealed letter "내가 사라지면 선장 아들에게 주시오" | Gentle 존댓말 |
| rosa | 로사 모레티 | Diner owner | Hates Eli most visibly | Heard rubber fishing boots behind the diner the night her husband Sal vanished; Sal left by the back door | Curt, sharp, cooking metaphors |
| ledger | 장부 | Pelican | Follows Mary Lou | Named by Daniel; never eats from Calvin's hand | Squawks only |

Minor characters (no plot secrets unless stated): **메이지** (8, girl who writes the bottle note) and her mother **조앤**; dog **비스킷**; old fisherman **행크**; cannery trucker **듀이**; new bank clerk **프리야 파텔** (sits at Daniel's old desk); lawyer **콜 변호사**; secondhand shop **메이블**; pawnshop **빈스**; **루시아 레예스** (mother of missing teen Tommy); Daniel's parents **해럴드 & 루스 웹**; Edith's neighbor **에이다 브룩스**; game warden **리 단속관**.

### 5.4 Daniel Webb (대니얼 웹) — dead before the game, appears through records

Young bank loan officer. At first indifferent and rule-bound: every 1st of the month at exactly 9:00 he checked Mary Lou's payments; Walt called him "넥타이". He was extremely diligent: he studied shrimp seasons, tides and catch records to understand borrowers, quietly applied for a payment deferral for Walt without telling him, once rode a full day on Mary Lou "for field verification" while seasick the whole time and kept writing his ledger (Gus laughed for the first time in years). Over time he and Walt became friends: breakfast at Rosa's every 1st, he bought more of Walt's shrimp than anyone, he named the pelican "장부 (Ledger)". When head office cancelled the deferral, regulations forced him to deliver a public repossession notice in the diner. Walt exploded; Daniel did not defend himself. That night he wrote Walt a note, "제가 다른 방법을 찾고 있어요," which was never delivered. Days later he disappeared.

---

## 6. Canon: what really happened (fixed)

### 6.1 The official 7 "missing" (펠리컨 코브 실종 7건)

| # | Name | Official story | Truth |
| --- | --- | --- | --- |
| 1 | 얼 테이트 (drifter worker) | Walt | Calvin |
| 2 | 그렉 할보슨 (summer tourist) | Walt | Calvin |
| 3 | 토미 레예스 (17, runaway) | Walt | Calvin |
| 4 | 샐 모레티 (diner owner) | Walt | Calvin |
| 5 | 준 파이크 (pharmacist) | Walt | Her husband Dr. Pike |
| 6 | 에디스 클레이 (elderly) | Walt | Accident: dementia, wandered into the sea |
| 7 | 대니얼 웹 (bank officer) | Walt (only body found) | Calvin |

### 6.2 Chronology

1. **14 years ago** — Calvin quits the state police early (shortly after his partner "fell" from a pier) and moves to Pelican Cove. He fixes neighbors' things, teaches kids knots, fishes alone every dawn. People begin to vanish occasionally. The town says "바다가 데려갔다".
2. **~10 years ago** — Sal Moretti leaves through the diner's back door one night and never returns. Rosa hears rubber boots.
3. **8 years ago** — Dr. Pike kills June and stages a disappearance. Calvin sees Pike's car going to the beach at an odd hour, says nothing, and kindly tells Pike "무슨 일 있으면 저한테 말씀하세요." Pike belongs to Calvin from then on.
4. **7 years ago** — Edith Clay wanders off and drowns (true accident).
5. **7 years ago, late summer** — Daniel publicly serves Walt the repossession notice. Calvin watches. Days later Calvin makes Daniel disappear, choosing him on purpose because a future body would point to Walt.
6. **That night** — Desperate, Walt does illegal night trawling at the one spot nobody fishes: in front of the lighthouse, where Calvin always says "고기가 하나도 없다". His net brings up Daniel. Terrified (everyone saw their fight), Walt and Gus send the body back to sea **without weights**, on the current, hoping it washes up elsewhere so Daniel's family can bury him. Leaving, they see a boat with its lights off. Calvin. Their eyes meet. Walt understands everything, and stays silent because speaking means confessing he moved a body. He hides Daniel's wristwatch under the cabin floor to return to the family someday, tears that night's page out of the logbook, and writes on the logbook's first page: **"등대 앞 그 자리에는 절대 그물을 내리지 마라."**
7. **Two weeks later** — The current carries Daniel back to Pelican Cove's beach. First body ever found. The town explodes; the press names it "펠리컨 코브 연쇄 실종 사건".
8. **The next three months** — Sheriff Dunbar, facing election and a possible state police takeover, asks Calvin to lead the investigation; Toby is assigned as his assistant. Calvin plants items from the missing (Greg's camera, Sal's lighter, Earl's knife) in Mary Lou's hold. **Gus sees him.** Calvin catches Gus; Gus begs on his knees. Calvin's condition: keep quiet and testify that the captain went out at night repeatedly. Pike writes the coroner reports Calvin wants. Dunbar adds June and Edith to the list. Nora interviews Calvin at length for her articles.
9. **Trial** — Walt cannot explain Daniel without confessing, so nobody believes the rest. Sentenced to death. Nora's book becomes a bestseller; Dunbar is re-elected. **Disappearances stop** (Calvin is patient).
10. **Six years on death row** — Walt writes Eli one letter every month (72). Eli never opens them. Gus attends church every Sunday but never confesses; he gives Father Matthew a sealed letter.
11. **This spring** — Walt is executed. Calvin attends and smiles. Nora's photographer captures it; the newspaper prints a cropped version.
12. **Game start (Day 1)** — Eli arrives for the funeral.

### 6.3 Key evidence facts

- **Nora's interview notes:** 7 years ago Calvin told Nora, "샐은 그날 밤 식당 뒷문으로 나갔어요." Nobody but Rosa knew Sal used the back door, and Rosa never told anyone until she tells Eli (week 2+). Only someone who was there could know.
- **Gus's sealed letter** (held by Father Matthew): names Calvin and describes the planting.
- **Calvin's knot frames:** decorative knot samples in his cabin, each labeled with a small date. The dates match the disappearances. The last empty frame is filled after Gus vanishes.
- **Toby's whistle tune was taught to him by Calvin.** Calvin rarely whistles in public.

---

## 7. Time structure

### 7.1 Calendar

- Season = **10 weeks = 70 days.** Day 1 is a **Saturday**. Weeks run Saturday→Friday.
- **Friday = bank payment day** (Days 7, 14, 21, 28, 35, 42, 49, 56, 63). No payment in week 10.
- **Sundays** (Days 2, 9, 16, 23, 30, 37, 44, 51, 58, 65): church scene available in the morning slot instead of fishing (optional); two letters may be read that evening.

### 7.2 Phases

| Weeks | Phase | Feel |
| --- | --- | --- |
| 1 | 장례 | strange town, satisfying fishing |
| 2–4 | 바다 | cozy life game |
| 5 | 선단 축복제 | peak of peace |
| 6 | 균열 | first doubt |
| 7 | 거스 | shock |
| 8 | 의심 | anger, investigation |
| 9 | 심리 | reversal |
| 10 | 그 자리 | finale, epilogue, free play |

### 7.3 The day (target ≈ 7 real minutes; segments are phase-based, not countdown timers)

| Segment | In-game time | Activity | Target real time |
| --- | --- | --- | --- |
| dawn | 04:00 | Harbor → choose ground on sea map → trawl | ~2:30 |
| morning | 09:00 | Return → deck sorting → sell | ~1:30 |
| afternoon | 13:00 | Town map: **2 slots** (3 with pickup truck) | ~2:00 |
| evening | 19:00 | Home: letters, case wall, logbook, decorate | ~1:00 |
| night | 23:00 | Sleep → day summary → autosave | seconds |

Rules:
- No visible countdown clocks. Trawl duration is player-controlled. Afternoon is slot-based. Evening is untimed.
- Friday payment happens automatically at the end of the afternoon (no slot cost) with a short bank scene.
- Overnight, world-state changes are applied (Section 8.13) and are visible next morning.

---

## 8. Systems

All numbers below live in `config/tuning.ts` and are initial tuning values. Keep them adjustable.

### 8.1 Fishing grounds (`data/grounds.ts`)

| ID | Name | Character | Best when | Snag risk |
| --- | --- | --- | --- | --- |
| oyster | 남쪽 굴 양식장 | steady medium shrimp | 썰물, 보름 | low |
| sandbar | 모래톱 | many small shrimp | 밀물 | very low |
| wreck | 난파선 바다 | many large shrimp | 흐림 | high |
| river | 강 하구 | crabs + mixed shrimp | 비 온 다음 날 | medium |
| channel | 깊은 수로 | large shrimp, few | 바람 없는 날 | medium |
| gusSpot | 거스의 자리 | excellent, Gus guides you there Day 1 and Day 6 only, then "you know it now" — unlocks normally from Day 15 | any | low |
| theSpot | 등대 앞 그 자리 | marked with Dad's X. **Locked** until Day 67 | — | — |

- Each day has `tide` (밀물/썰물), `moon` (초승/상현/보름/하현, cycles every ~7 days), `weather`. Show them on the harbor board each dawn.
- Yield = base(ground) × condition multipliers × tow-time curve. Store tables in data.
- Dad's logbook (8.9) reveals one ground tip at a time (e.g. "보름 썰물엔 굴 양식장 남쪽.") as the player progresses; the sea map shows learned tips.
- Trying to select **theSpot** before Day 67: Gus (or after week 7, Eli's own hands) refuses with a short line. Each attempt logs to the logbook. Never allow it.
- The fish finder (shop) shows shrimp density as soft blobs; in front of the lighthouse it shows **static noise like a fault** (Detail D21).

### 8.2 Trawling (`scenes/Trawl`)

- Side-view of Mary Lou with outriggers. Press to drop nets; hold/release to keep towing; press to haul.
- **No numeric gauge.** Feedback is diegetic: winch pitch rises with load, the tow line vibrates, the boat tilts, Gus comments ("…무거워지네").
- Longer tow → more catch, but snag chance rises per second depending on ground. A snag tears the net: haul is reduced by 30–60% and the net needs repair (afternoon slot at the dock, or $40 instant).
- Target tow: 60–90 seconds for a good haul.

### 8.3 Deck sorting (the signature minigame, `scenes/Deck`)

- The haul spills onto the deck as individual items with slight physics jiggle.
- Drag items to:
  - three shrimp baskets: **소 / 중 / 대** (size is visual; wrong basket = sold at the lower price)
  - **게** bucket
  - **쓰레기** barrel
  - **바다거북** → must be lifted over the rail back to sea (real US rule). If a turtle is binned, the next morning game warden Lee issues a cute warning and a $20 fine; fishermen's feeling −3.
  - **잡어** → can be tossed to Ledger (pelican), who catches it mid-air.
- **Ledger steals** an unattended shrimp roughly every 8 seconds if no fish has been tossed to him recently. Stolen count is tracked for the weekly summary.
- **Gus sorts too** while he is aboard (Days 1–44): he moves about half the items himself at his own pace, and talks while sorting (this is where most Gus dialogue lives). From Day 45 the player sorts alone and it is visibly slower.
- **Special items** occasionally appear among the catch. Story items appear on scheduled days (Section 9). Cosmetic curiosities (glass bottle, old coin, broken compass, doll head, rusty key, etc. — at least 12) appear rarely and can be placed on the home shelf. Any item dropped in the trash barrel is gone forever — this is intentional.
- Target sorting time: 40–70 seconds.

### 8.4 Economy (`systems/economy.ts`)

**Debt schedule (total $4,250)**

| Week | 1 | 2–9 |
| --- | --- | --- |
| Payment due Friday | $250 | $500 each |

The player may prepay any amount at the bank on any afternoon (costs a slot).

**Prices (cannery truck; market and Rosa pay ×2)**

| Item | Price |
| --- | --- |
| 소 shrimp | $1.0 / lb |
| 중 shrimp | $1.6 / lb |
| 대 shrimp | $2.6 / lb |
| 게 | $1.5 each |
| curiosities | not sold (shelf) — pawnshop buys some for $5–15 |

- Fuel: $5 per trip. Net repair: $40.
- **Cannery oversupply:** after 450 lb sold to the cannery in one week, cannery prices drop ×0.8 for the rest of that week.
- **Average target:** an average player earns ~$95–110/day in weeks 1–5 at the cannery, enough to pay $500/week with ~$150–250 surplus. A great player who opens the fish market (week 6+) can pay off the full debt around week 7–8.

**Sellers**

| Seller | Price | Availability |
| --- | --- | --- |
| 통조림 공장 트럭 (듀이) | base | every morning at the dock |
| 마을 어시장 | ×2 | refuses Eli until fishermen's average feeling ≥ 40 AND week ≥ 6, OR after the hearing |
| 로사의 식당 납품 | ×2 (max 30 lb/day) + Rosa says a line | Rosa ≥ 60 |

**Safety nets (poor players)**

1. Partial payment allowed.
2. First time a payment is short: Priya grants one extension week: "대니얼이라면 이렇게 했을 거예요." (first Daniel hint)
3. Gus's coffee can: if money < 50% of the due amount on a Friday (Days 7–42), Gus silently offers his savings ($150). Accepting sets `tookGusMoney`; after Gus vanishes this becomes a line in Eli's inner monologue: he can never pay it back.
4. Sell Dad's things at the pawnshop (items listed in 8.5): money, but the linked memory scene and any linked clue are lost forever (the item is gone; rebuying is impossible once sold to a passing buyer after 3 days).
5. Repossession ending only after **3 consecutive Fridays with $0 paid**. Warnings on the first and second.

**Early payoff (great players)**

When the debt reaches $0: next evening Gus waits at the dock with two beers (or, if after Day 44, Eli finds Gus's beanie on the bollard and sits alone — rewrite accordingly). Line: **"이제 메리 루는 네 배다."** From then on there are no Friday payments and all income is Eli's. The story continues unchanged.

### 8.5 Spending (`data/shopCatalog.ts`)

Money buys life, never power. No purchase skips a story beat.

| Category | Item | Price | Effect |
| --- | --- | --- | --- |
| House | 포치 수리 / 부엌 수리 / 다락방 수리 | $150 / $300 / $400 | unlocks room to decorate; porch adds rocking-chair evening reading spot where Ledger perches |
| House | 중고 가구 (메이블) | $20–120 | decor; Mabel refuses to sell until ≥ 40 |
| House | 이상한 물건 선반 | $35 | display curiosities from the net |
| House | 사진 벽 | $25 | shows photos taken with Nora's camera (week 3+) |
| Boat | 싼 페인트 | $15 | covers KILLER but it shows through in sunlight (D09) |
| Boat | 좋은 페인트 + 색 선택 (민트/노랑/하늘/코랄) | $80 | fully covers; graffiti respawns weekly until the hearing |
| Boat | 깃발, 갑판 조명, 조타실 커튼 | $10 / $40 / $20 | cosmetic |
| Boat | 장부의 둥지 상자 | $25 | Ledger sleeps aboard; appears on deck at dawn |
| Boat | 라디오 + 채널(컨트리/블루스/지역 방송) | $60 + $15 each | music while fishing; local channel reads town news that reflects story state |
| Boat (comfort) | 어군 탐지기 | $250 | density blobs; static at the lighthouse (D21) |
| Boat (comfort) | 좋은 윈치 | $300 | faster haul |
| Boat (comfort) | 분류대 | $200 | auto-sorts ~30% of items (for players who find sorting tedious) |
| Boat (comfort) | 얼음 상자 | $150 | allows one extra tow per trip |
| Time | 중고 픽업트럭 | $600 | **3 afternoon slots** instead of 2 |
| Time | 부두 꼬마 고용 (메이지; after her quest) | $10/day | sells your catch for you; skip the selling step |
| Time | 게 통발 | $40 each (max 4) | ~$6/day each, collected automatically |
| Town (anonymous) | 성당 지붕 / 부두 보수 / 등대 불 / 축제 후원(5주만) | $300 / $400 / $250 / $100 | town visibly improves; small town-wide feeling +2 to +4; diner gossip "익명 기부자 누굴까"; revealed by Father Matthew on Day 62 if any donation was made (big warm scene) |
| People | 로사의 커피 | $1 | once Rosa ≥ 60; daily small talk line |
| People | 거스의 새 장화 / 새 라디오 | $60 / $45 | Gus grumbles, then uses them next day; after Day 45 they are neatly placed in his house, one still wrapped (D22) |
| People | 장부 간식 | $3 | Ledger follows closer |
| Dad's things (pawnshop) | 기타 / 어머니의 오르골 / 할아버지 나침반 / 메리 루 진수식 사진 | $120 / $90 / $60 / $30 | each opens a short memory scene (Eli's childhood) |
| Hobby | 부두 낚싯대 | $35 | sunset pier fishing minigame (relaxing, optional) |
| Hobby | 새우 요리 레시피 (×6, some from Dad's letters) | $10 each | cook at home; invite Gus (≤ Day 44) for a dinner scene |
| Investigation (week 8) | 거스 실종 전단 현상금 | $50 / $100 / $200 | more tips arrive; some are false; the true one (whistle neighbor) arrives at any tier |

### 8.6 Feelings (`systems/feelings.ts`)

Each NPC has a hidden value 0–100 mapped to a visible state (icon near their portrait):

| Range | State |
| --- | --- |
| 0–19 | 증오 |
| 20–39 | 냉담 |
| 40–59 | 경계 |
| 60–79 | 중립 |
| 80–100 | 신뢰 |

Starting values: Rosa 5, Webb parents 0, Lucia 0, fishermen (group) 25, town kids (group) 10, Maisie 30, Gus 25, Father Matthew 65, Nora 45, Mabel 30, Hank 25, Priya 60, Toby 70, Dunbar 40, Pike 45, Calvin 90 (displayed 신뢰, fixed; his value never changes).

Changes:
- Quest steps and completions: +5 to +25 (per quest data).
- Truths revealed that concern that person: +15 to +30.
- Gifts: at 중립+ → +2 (once per day per person); at 증오/냉담 → −3 with a cold line ("살인마 아들이 주는 새우를 먹으라고?").
- Specific choices in events (data-defined).
- Feelings affect: dialogue variants, shop access, market access, festival outcome, hearing testimony availability.

### 8.7 Schedules and the town map (`data/schedules.ts`)

- Each NPC has a location per segment per weekday. The town map shows small portraits at nodes where people are.
- Fixed habits that must exist: Rosa opens at 05:30 and is at the diner all day except Sal's anniversary (Day 27) when the diner is closed with a handwritten sign; Toby patrols with his whistle (afternoons at board/dock/sheriff rotation); Father Matthew rings the bell at noon (sound on the town map at 12:00); **Calvin is at sea at "내 자리" every dawn** (visible as a small boat on the sea map), and home or at the diner in afternoons; Gus is aboard every dawn and at home/dock in afternoons until Day 44.
- Schedules change after events (data-driven overrides by day range).

### 8.8 Quests and the notebook (`systems/quests.ts`)

Rules:
1. The notebook always lists 1–3 active tasks, each with a **specific location and segment** ("내일 오후, 로사의 식당에 얼음 배달").
2. No quest is "talk to X". Every quest is doing something: carry, fix, haul, photograph, deliver, search, repair.
3. Completing a quest naturally spawns the next one from inside it.
4. The main line (debt, letters) is always pinned on top.

Full side-quest list is in Section 11.

### 8.9 Dad's letters (`data/letters/*.ts`)

- **72 monthly letters** from death row, numbered L01–L72 (oldest first). They are in a box found on Day 2.
- Each evening: 1 letter (2 on Sundays). Max 80 over the season, so a player who reads almost every night sees all 72.
- Before opening, the player may choose **열기** or **태우기**. Burned letters are gone forever (a small ash sprite remains in the box).
- Visuals: lined prison paper; handwriting jitter increases with letter number; censorship stamps ("검열필") increase from 0 at L01 to several by L60+ (D17).
- Content requirements (each letter 120–350 Korean characters, written in Walt's voice):
  - L01: first letter from death row. Clumsy. Includes a little drawing of a shrimp and **"아직도 새우 싫어하니?"** (D18).
  - Spread across letters: prison daily life; Eli's childhood; Eli's mother and the name Mary Lou; Gus ("그 영감 무뚝뚝해도 너 어릴 때 업어 키웠다"); Rosa and Sal; fishing advice (some letters unlock a ground tip or a recipe); apologies he never finishes.
  - **Daniel arc, told as memories, guilt-heavy:** L01–L15 he avoids the subject ("그 은행 녀석 얘긴 하지 말자"); L16–L35 he starts telling the story from the beginning ("처음엔 넥타이라고 불렀다", the seasick day, the breakfasts, naming the pelican); L36–L72 grief ("대니얼이 보고 싶다. 그 녀석을 그렇게 보낸 게 내 평생의 죄다."). He never explicitly describes the night; he only says he did something he cannot write.
  - Walt **never** names Calvin as the killer in letters (prison mail is read; he was afraid). He may write a few oddly specific lines that become meaningful later (e.g. L50: "등대 앞엔 가지 마라. 고기가 없어서가 아니다.").
  - L72: written the day before execution. Short. No drama. Ends with **"메리 루한테 잘해줘라."**
- **The cabin-floor message is NOT in the 72.** It is a separate **final letter delivered by lawyer Cole on Day 36** (Section 9): "메리 루를 팔지 마라. 선실 바닥을 보거라."

### 8.10 Dad's logbook (`systems/logbook.ts`)

- Starts as a fishing guide in Walt's handwriting style: ground tips unlocked over time.
- First page: **"등대 앞 그 자리에는 절대 그물을 내리지 마라."** (shown Day 4).
- One page from 7 years ago, late summer, is torn out (noticed Day 4; meaningful Day 36+).
- Eli's discoveries are auto-written in a different handwriting/pen color. Wrong guesses get struck through later (D20). Example Eli entries: "캘빈 씨 말로는 등대 앞엔 고기가 없다고 함." / later struck: ~~"아버지 X 표시 = 난파선 위험 때문?"~~

### 8.11 Case wall (`systems/caseWall.ts`)

- In the living room. Available from Day 2 (the lawyer left the trial file in the house). Weeks 1–5 it feels like a curiosity; from Day 36 the game gently prompts it.
- The official report is a set of **statement cards**. Evidence cards are pinned next to a statement with red string. When a statement has its **required evidence**, the player may "rewrite" it into the truth (the card flips to Eli's handwriting).
- Statements and their required evidence:

| ID | Official statement (Korean on the card) | Required evidence (all) | Optional extra |
| --- | --- | --- | --- |
| S01 | 피고인 월트 할로우는 펠리컨 코브 실종 7건 전부에 관여했다. | S02, S03, S04 rewritten | — |
| S02 | 에디스 클레이는 피고인에게 살해되었다. | E_EDITH_NEIGHBOR, E_EDITH_MEDS | — |
| S03 | 준 파이크는 피고인에게 살해되었다. | E_PHARMACY_LEDGER, E_PIKE_CAR | — |
| S04 | 샐 모레티가 사라진 밤, 피고인의 배는 바다에 있었다. | E_ROSA_BACKDOOR, E_LOGBOOK_DOCKED | E_ROSA_BOOTS |
| S05 | 메리 루 호 선창에서 실종자들의 소지품이 발견되었다. | E_NORA_EVIDENCE_PHOTO (items bone-dry, no salt) , E_GUS_CONFESSION | E_GUS_LETTER |
| S06 | 피고인은 사건이 있던 밤마다 바다에 나갔다. (증인: 거스) | E_LOGBOOK_ONE_NIGHT, E_GUS_CONFESSION | — |
| S07 | 대니얼 웹의 시신에서 메리 루 호의 밧줄 섬유가 발견되었다. | E_DANIEL_WATCH, E_GUS_CONFESSION | — |
| S08 | 피고인은 대니얼 웹과 다툰 뒤 그를 살해했다. | E_DANIEL_NOTES, E_DANIEL_NOTE_UNSENT | E_LETTERS_DANIEL |
| S09 | 피고인 체포 후 실종은 멈췄다. 이것이 유죄의 증거다. | E_GUS_MISSING, E_KNOT_FRAMES | E_CALVIN_BOAT_DEPTH |

- Evidence items (ID — how obtained — earliest day):

| ID | Obtained from | Earliest |
| --- | --- | --- |
| E_LOGBOOK_DOCKED | logbook shows Mary Lou berthed the night Sal vanished | Day 20 (after Rosa tells the date) |
| E_LOGBOOK_ONE_NIGHT | logbook's only night trip is the torn page | Day 36 |
| E_ROSA_BACKDOOR | Rosa: "샐은 뒷문으로 나갔어. 아무한테도 말 안 했어." | Rosa quest step 3 (week 2–3) |
| E_ROSA_BOOTS | Rosa: rubber boots; Walt always wore deck shoes | Rosa ≥ 60 |
| E_PHARMACY_LEDGER | June's pharmacy ledger is blank from the night **before** she "vanished" | Pike quest (week 4) |
| E_PIKE_CAR | Hank saw the doctor's car at the beach at 2 a.m. that night | Hank ≥ 60 (week 4+) |
| E_EDITH_NEIGHBOR | Ada: Edith had dementia, wandered at night | Edith quest (week 6) |
| E_EDITH_MEDS | Pike's own delivery list shows dementia meds for Edith | Pike quest + Day 36+ |
| E_DANIEL_NOTES | Daniel's work notebook (Priya) with Walt notes | Bank quest (week 4) |
| E_DANIEL_NOTE_UNSENT | "제가 다른 방법을 찾고 있어요" found inside the notebook's back cover | Day 36+ (re-examine) |
| E_LETTERS_DANIEL | read ≥ 10 letters mentioning Daniel | variable |
| E_DANIEL_WATCH | under the cabin floor | Day 36 |
| E_NORA_EVIDENCE_PHOTO | Nora's archive photo of the hold evidence | Nora quest (week 3) + Day 36+ |
| E_GUS_CONFESSION | Gus's confession scene | Day 44 |
| E_GUS_MISSING | Gus vanishes | Day 45 |
| E_TOBACCO_TIN | Gus's tobacco tin in the net | Day 50 |
| E_CALVIN_BOAT_DEPTH | dawn harbor: Calvin's boat sits deeper going out (click it) | Day 45 dawn only (or later via logbook if clicked) |
| E_KNOT_FRAMES | peek through Calvin's cabin window while he is at sea | Day 50+ |
| E_GUS_LETTER | Father Matthew gives the sealed letter | Day 60 (in hearing) if Matthew ≥ 80 |
| E_NORA_NOTES | Nora's original interview notes (the back-door line) | Day 60 (in hearing) if Nora ≥ 70 and photo quest done |
| E_WHISTLE_TEACHER | Calvin taught Toby the tune | Calvin knot quest done (week 2) + Toby line |
| E_DUNBAR_PADDING | how June and Edith got onto the list | S02 + S03 rewritten |

### 8.12 Ledger the pelican

- Perches on the rail, follows Mary Lou, steals shrimp, catches tossed bycatch.
- Treats increase how close he sits.
- **Never takes food from Calvin.** First shown Day 10 at Calvin's cookout (scripted), and any time Calvin offers food later (D04).
- After Day 45, sits next to Gus's coffee can if the player kept it (D08).

### 8.13 Overnight world state (`systems/details.ts`)

Applied at night, visible next morning:
- KILLER graffiti respawns every **Monday night** (Days 3, 10, 17, …) until the player buys good paint; after good paint it still respawns weekly until Day 60, then stops. Day 61 morning: small **"SORRY"** next to the last graffiti mark (D10).
- Mooring lines cut on Days 12 and 26 (boat drifted; costs the morning 10 seconds to recover; Calvin helps retie on Day 12).
- Population sign 412 → **411** on Day 52 (D12).
- Missing-person candles at church: 7 → **8** on Day 51 (D13).
- Calvin's boat depth: same every dawn except **Day 45** (deeper going out) (D01).
- Deck wear: Eli's standing spot texture darkens a little every day he fishes (D07).

---

## 9. Master event timeline

Day numbers are fixed. "seg" = segment. Each beat is a scripted event with an ID. Write every scene fully.

### Week 1 — 장례 (Days 1–7)
| Day | ID | Seg | Beat |
| --- | --- | --- | --- |
| 1 Sat | W1_FUNERAL | morning | Funeral, under 3 minutes. Only Gus (at the back, leaves without a word), Toby (helps carry the coffin, whistling stops when he notices), Calvin (shakes hands: "아버님 사건, 제가 맡았었어요. 미안해요. 필요한 거 있으면 말해요."). |
| 1 | W1_BANK | morning | Priya: the boat can't cover the debt; one season of fishing is the only way. |
| 1 | W1_FIRST_TRIP | afternoon | Gus, grumbling: "배 팔 거면 상태라도 보고 팔아." Short first trawl at gusSpot; the deck overflows with shrimp. **Ledger lands on the rail.** Tutorial is diegetic through Gus. |
| 2 Sun | W1_FIRST_SALE | morning | Sell to Dewey's cannery truck. First money. Fish market refuses: "살인마 새우는 안 받아." |
| 2 | W1_LETTER_BOX | evening | Eli finds the box of 72 letters and the trial file (case wall unlocked). First choice: open or burn L01. |
| 3 Mon | W1_GRAFFITI | dawn | KILLER on the hull. Calvin arrives with a paint can; they paint together; first beer at dusk. |
| 4 Tue | W1_LOGBOOK_X | evening | Logbook first page rule; X on the map; torn page noticed. Same day Calvin, in passing: "등대 앞은 가지 마요. 거긴 고기가 하나도 없어." |
| 5 Wed | W1_BOTTLE | morning | Bottle in the net: Maisie's note about her dog Biscuit → quest Q_BOTTLE. |
| 6 Thu | W1_KNOT_LESSON | dawn | Gus's first knot lesson (net-mending minigame). If done well: "…나쁘지 않네." |
| 7 Fri | W1_PAYMENT | afternoon | First payment ($250). Weekly summary screen (earned, paid, shrimp stolen by Ledger). In Priya's drawer: **Daniel's nameplate** (visible, unremarked). |

### Weeks 2–4 — 바다
| Day | ID | Beat |
| --- | --- | --- |
| 8 | W2_ROSA_ICE | Rosa's ice machine breaks → Q_ROSA_ICE starts (Eli overhears at the dock). |
| 10 | W2_CALVIN_COOKOUT | Calvin's backyard shrimp boil. Warm scene. Ledger refuses fish from Calvin's hand (D04) — played as a joke ("저 녀석은 저를 안 좋아해요, 하하"). Calvin offers Q_CALVIN_KNOTS. |
| 12 | W2_LINES_CUT | Mooring line cut overnight; Calvin helps retie. |
| 15 | W3_GUSSPOT_UNLOCK | Gus: "이제 거기 알지? 혼자 가." gusSpot unlocked normally. |
| 16 | W3_NORA | Nora asks for shrimp-season photos → Q_NORA_PHOTO (camera given). |
| 17 | W3_HANK | Hank's lost traps → Q_HANK_TRAPS. |
| 20 | W3_RADIO_NEWS | (If radio) local channel: Nora's book reprint announced. |
| 22 | W4_PIKE | Dr. Pike asks Eli to deliver medicine to old folks (he "can't get away") → Q_PIKE_ERRANDS. |
| 23 | W4_PRIYA | Priya asks help sorting a dead colleague's work notes → Q_BANK_LEDGER. |
| 27 | W4_SAL_DAY | Diner closed: "오늘은 쉽니다." Sal's mug has coffee in it through the window (D14). |

### Week 5 — 선단 축복제
| Day | ID | Beat |
| --- | --- | --- |
| 29 | W5_FESTIVAL_NEWS | Blessing of the Fleet announced; Mary Lou is not on the list → Q_BLESSING. |
| 34 Thu | W5_FESTIVAL | Festival on the water. If Father Matthew ≥ 80 OR (fishermen ≥ 40 and Q_BLESSING done): Matthew blesses Mary Lou, a few fishermen clap. Otherwise Eli watches alone from the end of the pier. Either way, that night Gus, for the first time, laughs and tells a story about Walt. Peak of warmth. |

### Week 6 — 균열
| Day | ID | Beat |
| --- | --- | --- |
| 36 Sat | W6_LAWYER_LETTER | Lawyer Cole delivers Walt's final letter: "메리 루를 팔지 마라. 선실 바닥을 보거라." |
| 36 | W6_CABIN_FLOOR | Under the cabin floor: **Daniel's wristwatch** and bank papers. Eli believes Dad really killed Daniel. Devastation. Logbook torn page now meaningful. Case wall pulses: "다시 보기". |
| 37–42 | W6_DOUBTS | The case wall becomes the main evening activity. Q_EDITH opens (Ada asks for help fixing Edith's old house before it's sold). Previously cute details (knot frames, sticker fish) can now be re-examined with new Eli lines. |

### Week 7 — 거스
| Day | ID | Beat |
| --- | --- | --- |
| 44 Sun | W7_CONFESSION | Evening: Gus brings a bottle. He tells everything (Section 6.2 items 6 and 8): finding Daniel, sending him on the current, Calvin in the dark, the planting, begging on his knees, testifying against the captain. **Eli says nothing and walks out, slamming the door.** Then the camera **does not follow Eli for the first time in the game**: it stays on the net pile behind Gus's house. Gravel footsteps. **Toby's whistle motif** fading away. Cut to black. |
| 44 | W7_TOBY_REPORT | (Not shown to the player.) Flag: Toby told Calvin. |
| 45 Mon | W7_GUS_GONE | Dawn: Gus doesn't come. Calvin's boat sits deeper going out (D01). Gus's house: door open, **two glasses** on the table. Toby takes the report and writes "자진 출향 추정". Town: "원래 떠돌던 노인네였지." From now on Eli fishes alone (sorting slower). |
| 46 | W7_MOB | Night: townspeople with torches and flashlights at the dock: "그 영감한테 무슨 짓을 했어!" Just before Mary Lou is set on fire, **Calvin steps in**: "이 친구 아니에요. 제가 보증해요." They disperse. Eli thanks him sincerely. |
| 47–49 | W7_GRIEF | Empty spot on deck. Gus's coffee can choice (keep/throw). Gus's gifts in his house if bought (D22). |

### Week 8 — 의심
| Day | ID | Beat |
| --- | --- | --- |
| 50 | W8_TIN | **Gus's tobacco tin** in the net (from a ground downstream of the lighthouse). Eli: he didn't leave. Q_POSTER opens. Knot frames now peekable at Calvin's cabin (dawn, when Calvin is at sea; window). |
| 51 Sun | W8_CANDLE | 8th candle lit at church. |
| 52 | W8_SIGN | Population sign repainted 411. |
| 50–54 | W8_CLUES_TOBY | Clues pointing to Toby accumulate: neighbor heard whistling that night; Toby's fast "자진 출향" report; a **deputy badge pin** in the floor crack at Gus's house (planted). Calvin helps "find" some of them, concerned: "토비가 그럴 애가 아닌데… 그래도 증거는 증거니까요." |
| 55 Thu | W8_ARREST | Eli brings evidence to Dunbar, who arrests Toby almost eagerly. |

### Week 9 — 심리
| Day | ID | Beat |
| --- | --- | --- |
| 57–59 | W9_PREP | Town tension; Eli prepares (case wall); last chance for side quests that feed the hearing. |
| 60 Tue | W9_HEARING | County courthouse preliminary hearing for Toby. Full system in Section 10. Ends with Calvin's slow applause: "훌륭했어요, 일라이. 아버님도 자랑스러워하실 거예요." |
| 60 | W9_PHOTO | Evening: Nora brings the **uncropped execution-day photo**. Calvin, smiling in the corner. First time Eli sees it. |
| 61 | W9_SORRY | "SORRY" on the hull (D10). Rosa pours Eli a coffee without a word (if she testified). Fish market opens to Eli. |
| 62 | W9_DONOR | If any anonymous donation: Father Matthew reveals the donor; warm town scene. |
| 63 Fri | W9_LAST_PAYMENT | Last scheduled payment. |

### Week 10 — 그 자리
| Day | ID | Beat |
| --- | --- | --- |
| 64–66 | W10_CALM | Uneasy calm. Storm warnings on the radio. Eli decides: he will drop the net at the spot. |
| 67 Tue | W10_STORM | Afternoon: Rosa closes the diner early and walks toward Calvin's boat; we see only her back and **a tool in her apron pocket**. Night: the finale (Section 12). |
| 68–70 | W10_EPILOGUE | Epilogue scenes per ending, credits, then **free play** until Day 70 (cozy fishing, decorating, chatting with changed townspeople). Day 70 night: season-end card. |

---

## 10. The hearing (Day 60)

### 10.1 Structure

1. **Phase A — Eli accuses Toby.** Dunbar presents the case (badge pin, whistle witness, rushed report). Eli, as key witness, presses statements with evidence. This phase is easy and is meant to feel satisfying.
2. **Phase B — The pattern.** Midway, the game opens a **side-by-side view**: Toby's case file vs. Walt's case file from the case wall. The player must link **three matching pairs**:
   - "suspect's place contains a victim's item" ↔ "items found in Mary Lou's hold"
   - "a witness heard/saw the suspect at night" ↔ "Gus testified the captain went out at night"
   - "case closed fast by Dunbar on Calvin's advice" ↔ same in Walt's case
   When all three are linked, Eli stops. Inner line: "이 증거들… 너무 깔끔해. 아버지 사건이랑 구조가 똑같아." He realizes he is doing to Toby what the town did to his father.
3. **Phase C — Eli turns.** Testimonies from Dunbar, Pike, and Calvin (as consulting expert) are challenged using everything the player gathered. Available extra testimony/evidence depends on preparation:

| Prepared | Unlocks in Phase C |
| --- | --- |
| Father Matthew ≥ 80 | E_GUS_LETTER (names Calvin) |
| Nora ≥ 70 and Q_NORA_PHOTO done | E_NORA_NOTES (the back-door line) |
| Rosa ≥ 60 | Rosa testifies: back door + rubber boots |
| Q_PIKE_ERRANDS done and S03 rewritten | Pike breaks: confesses June, reveals Calvin held it over him for 8 years |
| Q_EDITH done | E_DUNBAR_PADDING: Dunbar shaken |
| Q_CALVIN_KNOTS done | E_WHISTLE_TEACHER: the whistle could have been Calvin's |
| E_KNOT_FRAMES / E_CALVIN_BOAT_DEPTH | extra pressure lines |

### 10.2 Mechanics

- Testimony = a list of statements. Press a statement → present an evidence card. Correct → progress. Wrong → **audience mood** drops.
- Audience mood 0–100, starts 50. Correct +10, wrong −15, accusing Calvin directly before Phase B ends −25 ("살인마 아들이 영웅을 모함한다!").
- Mood 0 → recess ("휴정"), the current testimony restarts with mood 40. **Never game over.**
- Outcome (always): Toby is cleared and realizes his words got Gus killed. Then:
  - **Well prepared** (≥ 4 Phase C unlocks): the whole courtroom doubts Calvin; the town turns.
  - **Less prepared**: only Eli is sure; the town is confused.
  - Either way there is no body: Dunbar refuses to arrest Calvin. Calvin applauds and leaves.

---

## 11. Side quests (`data/quests/*.ts`)

Each quest: steps with location + segment, at least 3 steps, written scenes, rewards, and what it plants for later. All are "do something" quests.

| ID | Weeks | Steps (summary) | Reward now | Plants for later |
| --- | --- | --- | --- | --- |
| Q_BOTTLE | 1–2 | read note → search dunes (afternoon) → find Biscuit stuck under the old boathouse → return him to Maisie | Maisie +40, Joanne +20; Maisie can be hired later | Joanne becomes a quiet ally (testifies Eli was home the night Gus vanished, small mood bonus) |
| Q_ROSA_ICE | 2–3 | carry ice from Dewey's truck to the diner 3 afternoons → Rosa: "…샐이 쓰던 그물이 창고에 있는데" → fetch Sal's net from the storeroom (Rosa tells: Sal left by the back door; date of his disappearance) | Rosa +25, Sal's net (better net) | E_ROSA_BACKDOOR, date for E_LOGBOOK_DOCKED; later E_ROSA_BOOTS |
| Q_CALVIN_KNOTS | 2–3 | three knot lessons at Calvin's cabin (minigame) → he shows the wall of framed knots in his cabin — **he calls it "제 취미예요"** (never 수집/collection) | better net-repair speed | Eli can recognize knots; knot frames seen (cute now, chilling later); E_WHISTLE_TEACHER via a Toby line ("선배님한테 배운 곡이에요!") |
| Q_NORA_PHOTO | 3–4 | photograph: sunrise trawl, deck sorting, Ledger, the diner sign → develop at Nora's → she shows her archive | camera (photo wall), Nora +20 | E_NORA_EVIDENCE_PHOTO; trust needed for E_NORA_NOTES |
| Q_HANK_TRAPS | 3 | locate Hank's traps by his landmarks → haul them in your net → return | fishermen +10, Hank +30 | E_PIKE_CAR (Hank's night memory) at Hank ≥ 60; market access |
| Q_PIKE_ERRANDS | 4–5 | deliver medicine to 3 elderly homes over 3 days → one parcel is addressed to Edith Clay (dead 7 years) — Pike's old list never updated → return it to the closed pharmacy back room | Pike +10, $30 | E_PHARMACY_LEDGER (seen in the back room), later E_EDITH_MEDS |
| Q_BANK_LEDGER | 4 | sort Daniel's work notes for Priya → find notes on "W." → Priya lets Eli keep the notebook | Priya +15 | E_DANIEL_NOTES; later E_DANIEL_NOTE_UNSENT |
| Q_BLESSING | 5 | repaint/clean Mary Lou for the festival → ask Father Matthew → help decorate the church boats | Matthew +15, fishermen +5 | festival outcome; Matthew trust for E_GUS_LETTER |
| Q_EDITH | 6 | Ada asks help clearing Edith's house before it's sold → find Edith's pill organizer and night-wandering notes | Ada +30 | E_EDITH_NEIGHBOR; E_DUNBAR_PADDING path |
| Q_POSTER | 8 | make and post Gus missing posters (torn next day) → optional bounty → tips arrive (some false) | — | whistle neighbor tip; later Rosa reposts (D16) |

Minor optional tasks (repeatable, light): net repair, hull painting, crab traps, pier fishing, cooking.

---

## 12. Finale and endings

### 12.1 Day 67 — the spot

1. Storm sailing: steer Mary Lou through waves toward the lighthouse (60–90 s, forgiving). The lighthouse beam sweeps. **Toby runs down the dock and jumps aboard** ("저도 갈게요. 거스 할아버지한테… 제가.").
2. At the spot, the player must **drop the net there** — the action forbidden all game. The logbook's first page flashes once.
3. Calvin's boat is there, lights off, hauling things up. With the added weight, water rises; only now does he find the **hole** (Rosa). Too late.
4. A prompt appears near Eli's hands: the rope tied with **Gus's knot**. `[E] 밧줄을 던진다`.
5. **Passive default:** if the player does nothing for 20 seconds, the prompt fades, and Calvin's boat goes down at "내 자리". No text tells the player this is a choice.

### 12.2 Endings

| Ending | Trigger | Epilogue |
| --- | --- | --- |
| **기본 결말 (바다가 데려갔다)** | rope not thrown | Calvin sinks with what he hid. Days later at the diner, people say Calvin vanished in the storm. Rosa, pouring coffee, flatly: **"바다가 데려갔나 보죠."** Eli and Rosa's eyes meet; neither speaks. Sal's mug is off its hook for the first time (D14). Outside, Ledger lands on Mary Lou's rail. Candles remain. |
| **법의 결말** | rope thrown | Calvin is pulled aboard alive and arrested. The things he was moving lead state police to "내 자리": Gus and the missing are found. Lucia Reyes gets her son back and, for the first time, nods to Eli. Candles are replaced by name cards (D13). Walt's name is cleared, but the night he sent Daniel back to sea remains true. Eli returns Daniel's watch and Walt's letters about Daniel to the Webbs. |
| **압류 결말** | 3 consecutive $0 Fridays | Eli takes the bus out of town. At the stop, Calvin waves. Credits. (Offer reload.) |

Both main endings → credits → free play to Day 70 → season-end card: **"다음 철에도 메리 루는 바다에 나간다."**

---

## 13. Obsessive details checklist (`data/details.ts`)

Implement all. Each must be visible in normal play (not only via debug).

| ID | Detail | When |
| --- | --- | --- |
| D01 | Calvin's boat sits **deeper going out, higher coming back** (opposite of a fisherman). Same every dawn; on Day 45 visibly deeper. Clickable at dawn harbor. | always; Day 45 |
| D02 | Fish Calvin gifts ("오늘 잡은 거") have a **cannery price sticker** under the gill. | from Day 10 |
| D03 | Calvin's cabin wall of framed knots, each with a tiny date. Dates match the disappearances. Last empty frame filled after Day 45. | Q_CALVIN_KNOTS; Day 50+ |
| D04 | Ledger eats from anyone's hand but never Calvin's. | Day 10+ |
| D05 | Calvin quotes back things Eli said weeks earlier, kindly. Implement: store 3–5 of Eli's choice lines; Calvin references them later. | weeks 2–8 |
| D06 | Toby's whistle tune = taught by Calvin. Same audio motif at the funeral, patrols, and the night of Day 44. | always |
| D07 | Mary Lou deck: worn shiny spots where Walt and Gus stood for 30 years; Eli's spot wears in over the season. | daily |
| D08 | Gus's coffee spit can stays on deck after Day 45 (keep or throw); if kept, Ledger sometimes sits by it. | Day 45+ |
| D09 | Cheap paint over KILLER shows through in sunlight. | Day 3+ |
| D10 | Day 61 morning: small "SORRY" next to the graffiti. Never explained. | Day 61 |
| D11 | Faded childhood photo of Eli tucked in the wheelhouse window frame. | always |
| D12 | Entrance sign 412 → 411 on Day 52. | Day 52 |
| D13 | Church candles 7 → 8 (Day 51); name cards in law ending. | Day 51; ending |
| D14 | Sal's mug on the diner wall for 14 years; coffee in it on Day 27; taken down in the ending epilogue. | Day 27; ending |
| D15 | June's pharmacy door: sun-faded "곧 돌아옵니다" sign from 8 years ago; Pike pays the rent monthly (Mabel gossip). | always |
| D16 | Notice board missing posters fade by age; Eli's Gus poster is torn next day; after the hearing Rosa posts a new one. | Day 50+; Day 61 |
| D17 | Dad's handwriting gets shakier; censorship stamps increase across letters. | letters |
| D18 | L01 shrimp drawing: "아직도 새우 싫어하니?" | L01 |
| D19 | Daniel's notebook margin notes: "W. 오늘 기분 나쁨. 날씨 탓인 듯." … later "W.와 아침. 새우 오믈렛." | Q_BANK_LEDGER |
| D20 | One logbook, two handwritings; Eli's wrong guesses struck through later. | season |
| D21 | Fish finder shows static only in front of the lighthouse. | after purchase |
| D22 | Gifts Eli bought Gus are neatly placed in his empty house; one still wrapped. | Day 45+ |

---

## 14. Writing guide

- **Volume minimums:** 72 letters + 1 final letter; all events in Section 9 fully scripted; each side quest ≥ 3 written scenes; each named NPC ≥ 15 context lines across feeling states and phases; Gus ≥ 60 deck-sorting lines (weeks 1–7), varied, short; radio local news ≥ 20 items tied to story state; diner gossip ≥ 20 lines.
- **Cozy surface:** humor, small kindness, food, weather, the pelican. Most lines in weeks 1–5 should be light.
- **Dread by implication:** never describe violence. Use objects, absence, a sound cut by a fade.
- **No early answers:** characters can be uneasy, never conclusive about Calvin before Day 60.
- **Calvin's voice:** the warmest in town. He is never sinister on the surface. Anything chilling comes from facts the player connects.
- **Gus's voice:** "…", single words, grudging care. His confession (Day 44) is his longest speech in the game; make it count.
- **Walt's letters:** a rough man trying to write tenderly. Short sentences. Fishing metaphors. Unfinished apologies.
- **Korean style:** natural spoken Korean per character (see 5.3). No translationese. Inner monologue for Eli is short and dry.
- Keep each dialogue box ≤ 2 lines on screen.

---

## 15. Milestones and acceptance criteria

Work in this order. Do not start a milestone until the previous one passes its criteria. After each milestone: typecheck, lint, tests, then update `PROGRESS.md`.

### M0 — Foundation
- [ ] Project runs (`npm run dev`), builds (`npm run build`), `tsc --noEmit`, lint and tests pass.
- [ ] `docs/` files created (Section 0.3). `DESIGN.md` is this document verbatim.
- [ ] Calendar (70 days, weekdays, Sundays, Fridays), segments, save/load, debug panel skeleton.
- [ ] Palette, Korean font loading with fallback, procedural sprites for all 10 signature characters.

### M1 — Core loop vertical slice (must be fun)
- [ ] Harbor dawn board (tide/moon/weather), sea map with grounds, trawl scene with diegetic feedback (no numeric gauge), snags and net repair.
- [ ] Deck sorting with all bins, turtles, Ledger stealing and catching, Gus co-sorting with lines.
- [ ] Selling to the cannery, Friday payment, weekly summary.
- [ ] Week 1 events W1_* fully scripted and playable Day 1 → Day 7.
- [ ] Self-check: a 30-second trawl + sort + sell feels satisfying (juicy feedback: splash, plop, cash bell, particles, screen-shake-free gentle motion).

### M2 — Town and people
- [ ] Town map nodes, location scenes, schedules, feelings with visible state icons, dialogue system with variants.
- [ ] Notebook with rules from 8.8. Quests Q_BOTTLE through Q_BLESSING.
- [ ] Letters system with burn choice; letters L01–L36 fully written. Logbook.
- [ ] Weeks 2–5 events, including the festival with both outcomes.

### M3 — Economy and spending
- [ ] All shop items (8.5) working with effects. House and boat decoration persists.
- [ ] Safety nets, early payoff scene, repossession ending.
- [ ] **Economy simulation test**: poor / average / great profiles over 63 days. Assert: poor can avoid repossession using safety nets; average pays every Friday while spending ≥ 1 afternoon slot/day on non-economic activities; great reaches $0 debt by Day 56 at the latest. Adjust tuning until true and log changes.

### M4 — The cracks and the investigation
- [ ] Case wall with all statements/evidence (8.11).
- [ ] Weeks 6–8 events, Gus confession with the camera break, mob scene, Toby clues and arrest.
- [ ] Letters L37–L72 and the final lawyer letter fully written.
- [ ] Quests Q_EDITH, Q_POSTER.

### M5 — Hearing, finale, endings
- [ ] Hearing phases A/B/C, audience mood, recess, preparation-dependent unlocks.
- [ ] Day 60 photo, Days 61–66 town shift, Day 67 storm finale with passive-default rope choice.
- [ ] All three endings, credits, free play to Day 70, season-end card.

### M6 — Details, polish, QA
- [ ] All D01–D22 implemented and listed in `CONTENT_INDEX.md` with locations.
- [ ] **Content test**: scan all data files; fail on `TODO`, `lorem`, `TBD`, `...` placeholders, empty strings, or letters shorter than 120 characters.
- [ ] **Spoiler test**: scan all player-facing strings reachable before Day 60 for phrases that state Calvin is the killer (e.g. "캘빈이 범인", "캘빈이 죽였"); fail if found.
- [ ] **Canon test**: assert event days match Section 9 exactly.
- [ ] Full playthrough via debug fast-forward from Day 1 to Day 70 on both main endings without errors.
- [ ] Performance: steady 60 fps on deck sorting with 80 items.

---

## 16. Final self-review before declaring done

Answer each honestly in `PROGRESS.md`:

1. Is week 1 fun without knowing the story?
2. Do weeks 1–5 feel peaceful, with the hatred felt as a social problem, not a mystery?
3. Does every afternoon offer at least one concrete thing to do from the notebook?
4. Can a player who earns little still see every main beat?
5. Does a player who earns a lot get a cozier, faster game, never an early ending?
6. Is Calvin never named as the killer before Day 60?
7. Does the Day 44 camera break (staying behind, the whistle) land?
8. Does Phase B of the hearing make the player discover the pattern themselves?
9. Is the rope choice passive by default and unlabeled?
10. Are all 22 details visible in normal play?
11. Is there any placeholder text left anywhere? (Must be no.)

If any answer is "no", fix it before reporting completion.

---

## 17. Defaults for open questions (use these unless the human says otherwise)

- Title: **「장부 (Ledger)」**.
- Characters are humans (not animals).
- The prequel (Calvin's "mornings only" story) is **out of scope**. Do not reference it.
- Why Calvin didn't retrieve Daniel's body during the two weeks: he saw Walt take it, and **chose to let it surface** — a body pointing to Walt was useful to him. Never state this directly; Gus's confession may hint: "그놈은… 우리가 뭘 하는지 다 보고도 그냥 있었어."
