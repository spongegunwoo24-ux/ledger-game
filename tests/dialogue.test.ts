import { describe, expect, it } from 'vitest';
import { check } from '../src/core/conditions';
import { newGame, type GameState, type QuestState } from '../src/core/state';
import type { CharId, FeelId } from '../src/core/types';
import { GUS_LAST_DAY, HANK_SPOKE_FLAG, SMALLTALK, talkLinesFor } from '../src/data/dialogue/smalltalk';
import { FIRST_PAGE, GROUND_TIPS, LOGBOOK_ENTRIES, logbookPages, syncLogbook } from '../src/data/logbook';
import { PEOPLE } from '../src/data/people';
import { TOWN_PEOPLE, afternoonLocation } from '../src/data/schedules';

const QUEST_IDS = ['Q_BOTTLE', 'Q_ROSA_ICE', 'Q_CALVIN_KNOTS', 'Q_NORA_PHOTO', 'Q_HANK_TRAPS', 'Q_PIKE_ERRANDS', 'Q_BANK_LEDGER', 'Q_BLESSING', 'Q_EDITH'];
const EVENT_IDS = ['W1_FUNERAL', 'W1_BANK', 'W1_FIRST_TRIP', 'W1_FIRST_SALE', 'W2_CALVIN_COOKOUT', 'W3_GUSSPOT_UNLOCK', 'W4_SAL_DAY', 'W5_FESTIVAL_NEWS', 'W5_FESTIVAL'];
const MEMORIES = ['funeral_thanks', 'funeral_dads_business', 'funeral_silent', 'leave_after_debt', 'dont_know_stay', 'one_season_for_dad'];

function quest(state: QuestState['state']): QuestState {
  return { state, step: 3, progress: 0, startedDay: 1 } as QuestState;
}

/** A state with everything that could unlock a line switched on. */
function everythingState(day: number, feeling: number): GameState {
  const s = newGame(7);
  s.day = day;
  for (const k of Object.keys(s.feelings) as FeelId[]) if (k !== 'calvin') s.feelings[k] = feeling;
  for (const q of QUEST_IDS) s.quests[q] = quest('done');
  s.eventsDone.push(...EVENT_IDS);
  s.calvinMemory.push(...MEMORIES);
  Object.assign(s.flags, { knotLesson: true, ledgerAboard: true, paintedOver: 'cheap', [HANK_SPOKE_FLAG]: true });
  s.evidence.push('E_ROSA_BACKDOOR', 'E_EDITH_NEIGHBOR', 'E_LOGBOOK_DOCKED');
  s.money = 1000;
  return s;
}

const allTalk = Object.entries(SMALLTALK).flatMap(([who, lines]) => (lines ?? []).map((l) => ({ who, text: l.text })));
const allLogbook = Object.entries(LOGBOOK_ENTRIES).map(([id, e]) => ({ who: id, text: e.text }));
const allPeople = PEOPLE.map((p) => ({ who: p.id, text: p.intro }));
const ALL = [...allTalk, ...allLogbook, ...allPeople, ...Object.values(GROUND_TIPS).map((t) => ({ who: 'tip', text: t }))];

/** Things that would state a hidden truth (§6). None of these may appear anywhere in this content. */
const FORBIDDEN = [
  /살인범 캘빈/,
  /캘빈이 죽였/,
  /캘빈이 범인/,
  /범인은 캘빈/,
  /캘빈.{0,6}(살인|죽였|없앴)/,
  /준을 죽였/,
  /(파이크|박사).{0,8}(죽였|살해)/,
  /아내를 (죽|묻)/,
  /위증/,
  /거짓 증언/,
  /(심어|숨겨) (놓|뒀|두)/,
  /선창에.{0,6}(넣|숨|심)/,
  /사고(였|로 죽)/,
  /치매/,
  /고무장화/,
  /손목시계/,
  /시신을 (돌려|흘려|띄워)/,
  /수집/,
];

describe('townspeople smalltalk', () => {
  it('every townsperson has at least 15 lines', () => {
    for (const who of TOWN_PEOPLE) expect(SMALLTALK[who]?.length ?? 0, who).toBeGreaterThanOrEqual(15);
  });

  it('everyone present in weeks 1–5 has something to say at every feeling', () => {
    for (const who of TOWN_PEOPLE) {
      for (let day = 1; day <= 50; day++) {
        for (const f of [0, 5, 25, 45, 65, 85, 100]) {
          const s = newGame(3);
          s.day = day;
          for (const k of Object.keys(s.feelings) as FeelId[]) if (k !== 'calvin') s.feelings[k] = f;
          if (afternoonLocation(s, who) === null) continue;
          if (day > 35 && who !== 'ada') continue;
          expect(talkLinesFor(s, who).length, `${who} day ${day} feel ${f}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it(`Gus has no line available after Day ${GUS_LAST_DAY}`, () => {
    for (let day = GUS_LAST_DAY + 1; day <= 70; day++) {
      for (const f of [0, 30, 50, 70, 100]) {
        expect(talkLinesFor(everythingState(day, f), 'gus'), `day ${day}`).toEqual([]);
        const bare = newGame(1);
        bare.day = day;
        bare.feelings.gus = f;
        expect(talkLinesFor(bare, 'gus'), `day ${day}`).toEqual([]);
      }
    }
    expect(talkLinesFor(everythingState(GUS_LAST_DAY, 50), 'gus').length).toBeGreaterThan(0);
  });

  it('Hank only grunts or gestures until the ranking gives him his first words', () => {
    for (const l of SMALLTALK.hank ?? []) expect(l.text).not.toContain('어디서 잡았냐');
    for (let day = 1; day <= 70; day += 3) {
      for (const f of [0, 30, 50, 70, 100]) {
        const s = everythingState(day, f);
        delete s.flags[HANK_SPOKE_FLAG];
        for (const l of talkLinesFor(s, 'hank')) {
          const spoken = l.text.replace(/\([^)]*\)/g, '').trim();
          expect(/^[…흠음.\s]*$/.test(spoken), l.text).toBe(true);
        }
      }
    }
    const s = everythingState(20, 25);
    expect(talkLinesFor(s, 'hank').some((l) => l.text.includes('또 왔냐'))).toBe(true);
  });

  it('hostile people stay cold at their starting feelings', () => {
    const s = newGame(2);
    s.day = 10;
    const rosa = talkLinesFor(s, 'rosa').map((l) => l.text);
    expect(rosa.length).toBeGreaterThan(0);
    for (const t of rosa) expect(t).not.toMatch(/커피를 한 잔|파이|앉아\. 오늘은 내가/);
    for (const t of talkLinesFor(s, 'mabel').map((l) => l.text)) expect(t).not.toMatch(/이제 팔게|좋은 의자/);
    s.feelings.mabel = 40;
    expect(talkLinesFor(s, 'mabel').some((l) => l.text.includes('이제 팔게'))).toBe(true);
  });

  it("Calvin's D05 lines need the remembered choice", () => {
    const s = newGame(4);
    s.day = 20;
    const withoutMemory = talkLinesFor(s, 'calvin');
    expect(withoutMemory.some((l) => l.remembers)).toBe(false);
    s.calvinMemory.push('funeral_silent');
    const lines = talkLinesFor(s, 'calvin');
    expect(lines.some((l) => l.remembers === 'funeral_silent')).toBe(true);
    expect(lines.some((l) => l.remembers && l.remembers !== 'funeral_silent')).toBe(false);
    for (const m of MEMORIES) expect((SMALLTALK.calvin ?? []).some((l) => l.remembers === m), m).toBe(true);
  });

  it('every line fits a two-line dialogue box', () => {
    for (const l of allTalk) expect(Array.from(l.text).length, l.text).toBeLessThanOrEqual(72);
  });
});

describe('no spoilers, no placeholder dots', () => {
  it('nothing here states a hidden truth', () => {
    for (const { who, text } of ALL) for (const re of FORBIDDEN) expect(re.test(text), `${who}: ${text}`).toBe(false);
  });

  it('uses "…" never ASCII "..."', () => {
    for (const { who, text } of ALL) {
      expect(text.includes('...'), `${who}: ${text}`).toBe(false);
      expect(text.trim().length, who).toBeGreaterThan(0);
    }
  });
});

describe("dad's logbook", () => {
  it('keeps the first page rule and the torn page exactly', () => {
    expect(LOGBOOK_ENTRIES.LB_RULE).toMatchObject({ hand: 'walt', text: '등대 앞 그 자리에는 절대 그물을 내리지 마라.' });
    expect(LOGBOOK_ENTRIES.LB_TORN).toMatchObject({ hand: 'eli', text: '7년 전 늦여름, 한 장이 찢겨 나갔다. 날짜가 비어 있다.' });
    expect(LOGBOOK_ENTRIES.LB_RULE.unlock).toBeUndefined();
    expect(LOGBOOK_ENTRIES.LB_TORN.unlock).toBeUndefined();
  });

  it('nothing is written before the logbook is found', () => {
    const s = everythingState(30, 70);
    expect(syncLogbook(s)).toEqual([]);
    expect(s.logbook).toEqual([]);
  });

  it("Walt's guide pages unlock over time and teach ground tips", () => {
    const s = newGame(5);
    s.day = 4;
    s.flags.logbookFound = true;
    s.logbook.push('LB_RULE', 'LB_CALVIN_NOFISH', 'LB_TORN', 'LB_X_WRECK');
    syncLogbook(s);
    const waltDay4 = s.logbook.filter((id) => LOGBOOK_ENTRIES[id].hand === 'walt').length;
    expect(s.tips).not.toContain('wreck');
    s.day = 14;
    syncLogbook(s);
    expect(s.tips).toEqual(expect.arrayContaining(['wreck', 'river', 'channel']));
    const waltDay14 = s.logbook.filter((id) => LOGBOOK_ENTRIES[id].hand === 'walt').length;
    s.day = 35;
    syncLogbook(s);
    const waltDay35 = s.logbook.filter((id) => LOGBOOK_ENTRIES[id].hand === 'walt').length;
    expect(waltDay14).toBeGreaterThan(waltDay4);
    expect(waltDay35).toBeGreaterThan(waltDay14);
    expect(waltDay35).toBeGreaterThanOrEqual(15);
    expect(logbookPages(s)[0]).toBe(FIRST_PAGE);
  });

  it("Eli's wrong guesses get struck through later (D20)", () => {
    const s = newGame(6);
    s.day = 5;
    s.flags.logbookFound = true;
    s.flags.ledgerAboard = true;
    s.eventsDone.push('W1_FIRST_TRIP');
    s.logbook.push('LB_RULE', 'LB_X_WRECK');
    syncLogbook(s);
    expect(s.logbook).toContain('LB_E_GUS_HATES');
    expect(s.logbookStruck).toEqual([]);
    s.feelings.gus = 45;
    s.eventsDone.push('W2_CALVIN_COOKOUT');
    s.day = 12;
    syncLogbook(s);
    expect(s.logbookStruck).toEqual(expect.arrayContaining(['LB_E_GUS_HATES', 'LB_E_LEDGER_ANY']));
    expect(s.logbook).toEqual(expect.arrayContaining(['LB_E_GUS_HATES_FIX', 'LB_E_LEDGER_FIX']));
    expect(s.logbookStruck).not.toContain('LB_X_WRECK');
  });

  it('struck lines are short enough to strike in one stroke', () => {
    for (const [id, e] of Object.entries(LOGBOOK_ENTRIES)) {
      if (e.strikeWhen) expect(Array.from(e.text).length, id).toBeLessThanOrEqual(34);
    }
  });

  it('caught-fish pages need the fish in the log', () => {
    const s = newGame(8);
    s.day = 10;
    s.flags.logbookFound = true;
    syncLogbook(s);
    expect(s.logbook).not.toContain('WG_SEAHORSE');
    s.fishLog.seahorse = { count: 1, best: 4, firstDay: 10 };
    syncLogbook(s);
    expect(s.logbook).toContain('WG_SEAHORSE');
  });
});

describe('만난 사람', () => {
  it('has one intro per person, including people met in weeks 2–5', () => {
    const ids = PEOPLE.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['nora', 'pike', 'ada', 'lucia', 'mabel', 'vince', 'dunbar', 'dewey'] as CharId[]) expect(ids, id).toContain(id);
  });

  it('talking to someone in town counts as meeting them', () => {
    const s = newGame(9);
    s.day = 18;
    for (const id of ['nora', 'pike', 'mabel', 'vince', 'dunbar', 'rosa'] as CharId[]) {
      const p = PEOPLE.find((x) => x.id === id)!;
      expect(check(s, p.met), id).toBe(false);
      s.flags[`talk_${id}`] = 1;
      expect(check(s, p.met), id).toBe(true);
    }
  });
});
