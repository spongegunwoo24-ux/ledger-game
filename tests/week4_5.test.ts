import { describe, expect, it } from 'vitest';
import { check } from '../src/core/conditions';
import { applyEffects, type Effect } from '../src/core/effects';
import { collectTexts, type Step } from '../src/core/events';
import { newGame, type GameState } from '../src/core/state';
import { ALL_EVENTS } from '../src/data/events';
import { WEEK4_5_EVENTS } from '../src/data/events/week4_5';
import { EVIDENCE_NAMES } from '../src/data/evidenceNames';
import { QUESTS } from '../src/data/quests';
import { currentStep, performStep, stepAvailableNow, stepScene } from '../src/systems/quests';

const CANON: Record<string, [number, string]> = {
  W4_PIKE: [22, 'afternoon'],
  W4_PRIYA: [23, 'afternoon'],
  W4_SAL_DAY: [27, 'afternoon'],
  W5_FESTIVAL_NEWS: [29, 'afternoon'],
  W5_FESTIVAL: [34, 'afternoon'],
  W5_FESTIVAL_NIGHT: [34, 'evening'],
};
const MY_QUESTS = ['Q_PIKE_ERRANDS', 'Q_BANK_LEDGER', 'Q_BLESSING'];

/** Runs a scene's logic headlessly: effects apply, ifs branch, choices take option `pick`. */
function play(s: GameState, steps: Step[], pick = 0): void {
  for (const st of steps) {
    if (st.t === 'effect') applyEffects(s, st.effects);
    else if (st.t === 'if') play(s, check(s, st.cond) ? st.then : (st.else ?? []), pick);
    else if (st.t === 'choice') {
      const o = st.options.filter((x) => check(s, x.cond))[Math.min(pick, st.options.length - 1)];
      applyEffects(s, o.effects);
      if (o.then) play(s, o.then, pick);
    }
  }
}

function effectsIn(steps: Step[], out: Effect[] = []): Effect[] {
  for (const st of steps) {
    if (st.t === 'effect') out.push(...st.effects);
    if (st.t === 'if') {
      effectsIn(st.then, out);
      if (st.else) effectsIn(st.else, out);
    }
    if (st.t === 'choice')
      for (const o of st.options) {
        if (o.effects) out.push(...o.effects);
        if (o.then) effectsIn(o.then, out);
      }
  }
  return out;
}

const ev = (id: string) => ALL_EVENTS.find((e) => e.id === id)!;

describe('weeks 4–5 events', () => {
  for (const [id, [day, seg]] of Object.entries(CANON)) {
    it(`${id} happens on Day ${day} (${seg}) with a summary and no requirements`, () => {
      const e = ev(id);
      expect(e, id).toBeDefined();
      expect(e.trigger.day).toBe(day);
      expect(e.trigger.segment).toBe(seg);
      expect(e.trigger.requires).toBeUndefined();
      expect(e.trigger.location).toBeUndefined();
      expect(e.summary.trim().length).toBeGreaterThan(10);
      expect(collectTexts(e.steps).length).toBeGreaterThan(10);
    });
  }

  it('the quests are started by their events', () => {
    const starts = (id: string) => effectsIn(ev(id).steps).filter((x) => 'quest' in x && x.op === 'start').map((x) => ('quest' in x ? x.quest : ''));
    expect(starts('W4_PIKE')).toContain('Q_PIKE_ERRANDS');
    expect(starts('W4_PRIYA')).toContain('Q_BANK_LEDGER');
    expect(starts('W5_FESTIVAL_NEWS')).toContain('Q_BLESSING');
  });

  it('W4_SAL_DAY has the handwritten sign and Sal\'s mug with coffee (D14)', () => {
    const t = collectTexts(ev('W4_SAL_DAY').steps).join('\n');
    expect(t).toContain('오늘은 쉽니다.');
    expect(t).toMatch(/SAL/);
    expect(t).toMatch(/커피가 담겨/);
  });

  describe('W5_FESTIVAL has both outcomes', () => {
    const fest = () => ev('W5_FESTIVAL');
    const base = () => {
      const s = newGame(7);
      s.day = 34;
      s.feelings.matthew = 65;
      s.feelings.fishermen = 25;
      return s;
    };

    it('Matthew ≥ 80 → Mary Lou is blessed', () => {
      const s = base();
      s.feelings.matthew = 80;
      play(s, fest().steps);
      expect(s.flags.festivalBlessed).toBe(true);
    });

    it('fishermen ≥ 40 AND Q_BLESSING done → blessed', () => {
      const s = base();
      s.feelings.fishermen = 40;
      s.quests.Q_BLESSING = { state: 'done', step: 3, progress: 0, startedDay: 29, lastDay: 32 };
      play(s, fest().steps);
      expect(s.flags.festivalBlessed).toBe(true);
    });

    it('fishermen ≥ 40 without the quest → watches alone', () => {
      const s = base();
      s.feelings.fishermen = 45;
      play(s, fest().steps);
      expect(s.flags.festivalBlessed).toBe(false);
    });

    it('quest done but fishermen < 40 and Matthew < 80 → watches alone', () => {
      const s = base();
      s.quests.Q_BLESSING = { state: 'done', step: 3, progress: 0, startedDay: 29, lastDay: 32 };
      play(s, fest().steps);
      expect(s.flags.festivalBlessed).toBe(false);
    });

    it('an unfinished Q_BLESSING is closed by the festival without paying its rewards', () => {
      const s = base();
      applyEffects(s, [{ quest: 'Q_BLESSING', op: 'start' }]);
      play(s, fest().steps);
      expect(s.quests.Q_BLESSING.state).toBe('done');
      expect(s.feelings.matthew).toBe(65);
      expect(s.flags.festivalBlessed).toBe(false);
    });

    it('the night scene plays either way and Gus laughs', () => {
      for (const blessed of [true, false]) {
        const s = base();
        s.flags.festivalBlessed = blessed;
        play(s, ev('W5_FESTIVAL_NIGHT').steps);
        expect(s.flags.gusLaughed).toBe(true);
      }
      expect(collectTexts(ev('W5_FESTIVAL_NIGHT').steps).join('\n')).toContain('거스가 웃었다');
    });
  });
});

describe('weeks 4–5 quests', () => {
  it('each quest has ≥ 3 steps, every step with a written scene and no morning steps', () => {
    for (const id of MY_QUESTS) {
      const q = QUESTS.find((x) => x.id === id);
      expect(q, id).toBeDefined();
      expect(q!.steps.length).toBeGreaterThanOrEqual(3);
      for (const st of q!.steps) {
        expect(st.seg).not.toBe('morning');
        if (st.seg === 'dawn') expect(st.loc).toBe('dock');
        if (st.seg === 'evening') expect(st.loc).toBe('home');
        expect(st.scenes.length).toBeGreaterThanOrEqual(st.repeat ?? 1);
        for (const sc of st.scenes) expect(collectTexts(sc).length).toBeGreaterThanOrEqual(5);
        expect(st.task).not.toMatch(/(이야기|대화|말 걸)/);
      }
    }
  });

  it('every evidence id granted in weeks 4–5 exists', () => {
    const all: Effect[] = [];
    for (const e of WEEK4_5_EVENTS) effectsIn(e.steps, all);
    for (const id of MY_QUESTS) {
      const q = QUESTS.find((x) => x.id === id)!;
      for (const st of q.steps) {
        st.scenes.forEach((sc) => effectsIn(sc, all));
        all.push(...(st.effects ?? []));
      }
      all.push(...(q.complete ?? []));
    }
    const ev = all.filter((x) => 'evidence' in x).map((x) => ('evidence' in x ? x.evidence : ''));
    expect(ev).toEqual(expect.arrayContaining(['E_PHARMACY_LEDGER', 'E_DANIEL_NOTES']));
    for (const id of ev) expect(EVIDENCE_NAMES[id], id).toBeDefined();
    // nothing from later weeks is handed out early
    for (const later of ['E_EDITH_MEDS', 'E_DANIEL_NOTE_UNSENT', 'E_PIKE_CAR', 'E_EDITH_NEIGHBOR']) expect(ev).not.toContain(later);
  });

  /** Walks a quest to the end, one step per call, playing each scene's logic. */
  function walk(s: GameState, id: string, startDay: number, pick: number): number {
    let day = startDay;
    for (let guard = 0; guard < 30 && s.quests[id].state === 'active'; guard++) {
      const st = currentStep(s, id)!;
      s.segment = st.seg;
      if (!stepAvailableNow(s, id, st.loc, st.seg)) {
        day += 1;
        s.day = day;
        continue;
      }
      play(s, stepScene(s, id), pick);
      performStep(s, id);
    }
    return day;
  }

  it('Q_PIKE_ERRANDS: 3 homes over 3 days → pharmacy back room → E_PHARMACY_LEDGER, Pike +10, $30', () => {
    const s = newGame(3);
    s.day = 22;
    s.segment = 'afternoon';
    play(s, ev('W4_PIKE').steps, 1);
    const money = s.money;
    const pike = s.feelings.pike;
    const end = walk(s, 'Q_PIKE_ERRANDS', 22, 1);
    expect(s.quests.Q_PIKE_ERRANDS.state).toBe('done');
    expect(end).toBe(24);
    expect(s.evidence).toContain('E_PHARMACY_LEDGER');
    expect(s.flags.pikeListKept).toBe(true);
    expect(s.money).toBe(money + 30); // second option at Morris: no payment
    expect(s.feelings.pike).toBe(pike + 10);
    expect(s.items.pikeParcel ?? 0).toBe(0);
    expect(s.items.pharmacyKey ?? 0).toBe(0);
  });

  it('Q_BANK_LEDGER: waits out Sunday, then three bank afternoons and an evening read → E_DANIEL_NOTES, Priya +15', () => {
    const s = newGame(3);
    s.day = 23;
    s.segment = 'afternoon';
    play(s, ev('W4_PRIYA').steps, 1);
    expect(stepAvailableNow(s, 'Q_BANK_LEDGER', 'bank', 'afternoon')).toBe(false); // Sunday
    const priya = s.feelings.priya;
    const end = walk(s, 'Q_BANK_LEDGER', 23, 0);
    expect(s.quests.Q_BANK_LEDGER.state).toBe('done');
    expect(end).toBe(26);
    expect(s.evidence).toContain('E_DANIEL_NOTES');
    expect(s.flags.danielNotebookRead).toBe(true);
    expect(s.feelings.priya).toBe(priya + 15);
  });

  it('Q_BLESSING: dawn paint → church → two days of decorating, done before the festival', () => {
    const s = newGame(3);
    s.day = 29;
    s.segment = 'afternoon';
    play(s, ev('W5_FESTIVAL_NEWS').steps);
    const m = s.feelings.matthew;
    const f = s.feelings.fishermen;
    const end = walk(s, 'Q_BLESSING', 29, 1);
    expect(s.quests.Q_BLESSING.state).toBe('done');
    expect(end).toBeLessThanOrEqual(33);
    expect(s.flags.blessingPainted).toBe(true);
    expect(s.feelings.matthew).toBe(m + 15);
    expect(s.feelings.fishermen).toBe(f + 5);
  });

  it('Q_BLESSING steps are closed on festival day', () => {
    const s = newGame(3);
    s.day = 34;
    applyEffects(s, [{ quest: 'Q_BLESSING', op: 'start' }]);
    expect(stepAvailableNow(s, 'Q_BLESSING', 'dock', 'dawn')).toBe(false);
  });
});
