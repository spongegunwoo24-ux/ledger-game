import { describe, expect, it } from 'vitest';
import { applyEffects, type Effect } from '../src/core/effects';
import { collectTexts, pendingEvents, type Step } from '../src/core/events';
import { newGame } from '../src/core/state';
import { ALL_EVENTS } from '../src/data/events';
import { WEEK2_3_EVENTS } from '../src/data/events/week2_3';
import { QUESTS } from '../src/data/quests';
import { EVIDENCE_NAMES } from '../src/data/evidenceNames';
import { STORY_CATCH } from '../src/data/catch';
import { storyCatchFor } from '../src/systems/fishing';
import { currentStep, performStep, stepAvailableNow } from '../src/systems/quests';

const W23: Record<string, [number, string]> = {
  W2_ROSA_ICE: [8, 'morning'],
  W2_CALVIN_COOKOUT: [10, 'evening'],
  W2_LINES_CUT: [12, 'dawn'],
  W3_GUSSPOT_UNLOCK: [15, 'dawn'],
  W3_NORA: [16, 'afternoon'],
  W3_HANK: [17, 'dawn'],
  W3_RADIO_NEWS: [20, 'dawn'],
};
const MY_QUESTS = ['Q_ROSA_ICE', 'Q_CALVIN_KNOTS', 'Q_NORA_PHOTO', 'Q_HANK_TRAPS'];

/** every effect list reachable from a step list (effect steps, choice effects, nested branches) */
function effectsIn(steps: Step[], out: Effect[] = []): Effect[] {
  for (const st of steps) {
    if (st.t === 'effect') out.push(...st.effects);
    if (st.t === 'choice')
      for (const o of st.options) {
        if (o.effects) out.push(...o.effects);
        if (o.then) effectsIn(o.then, out);
      }
    if (st.t === 'if') {
      effectsIn(st.then, out);
      if (st.else) effectsIn(st.else, out);
    }
  }
  return out;
}

function calvinLines(steps: Step[], out: string[] = []): string[] {
  for (const st of steps) {
    if (st.t === 'say' && st.who === 'calvin') out.push(st.text);
    if (st.t === 'choice') st.options.forEach((o) => o.then && calvinLines(o.then, out));
    if (st.t === 'if') {
      calvinLines(st.then, out);
      if (st.else) calvinLines(st.else, out);
    }
  }
  return out;
}

describe('weeks 2–3 events', () => {
  for (const [id, [day, seg]] of Object.entries(W23)) {
    it(`${id} is on Day ${day} (${seg}) with a summary`, () => {
      const e = ALL_EVENTS.find((x) => x.id === id);
      expect(e, id).toBeDefined();
      expect(e!.trigger.day).toBe(day);
      expect(e!.trigger.segment).toBe(seg);
      expect(e!.summary.trim().length).toBeGreaterThan(10);
      expect(collectTexts(e!.steps).length).toBeGreaterThan(5);
    });
  }

  it('scheduled beats have no requirements, except the radio (needs a radio)', () => {
    for (const id of Object.keys(W23)) {
      const e = ALL_EVENTS.find((x) => x.id === id)!;
      if (id === 'W3_RADIO_NEWS') expect(e.trigger.requires).toEqual({ owns: 'radio' });
      else expect(e.trigger.requires, id).toBeUndefined();
    }
  });

  it('the radio news plays only with a radio', () => {
    const s = newGame(1);
    s.day = 20;
    expect(pendingEvents(s, ALL_EVENTS, 'dawn').map((e) => e.id)).not.toContain('W3_RADIO_NEWS');
    s.purchases.radio = 1;
    expect(pendingEvents(s, ALL_EVENTS, 'dawn').map((e) => e.id)).toContain('W3_RADIO_NEWS');
  });

  it('the cookout has Ledger refusing Calvin, played as a joke (D04), and remembers answers (D05)', () => {
    const e = ALL_EVENTS.find((x) => x.id === 'W2_CALVIN_COOKOUT')!;
    expect(collectTexts(e.steps)).toContain('저 녀석은 저를 안 좋아해요, 하하.');
    const choices = e.steps.filter((s) => s.t === 'choice');
    expect(choices.some((c) => c.t === 'choice' && c.options.some((o) => o.remember))).toBe(true);
  });

  it('events start the right quests', () => {
    const starts = (id: string) => effectsIn(ALL_EVENTS.find((x) => x.id === id)!.steps).filter((f) => 'quest' in f && f.op === 'start');
    expect(starts('W2_ROSA_ICE')).toEqual([{ quest: 'Q_ROSA_ICE', op: 'start' }]);
    expect(starts('W2_CALVIN_COOKOUT')).toEqual([{ quest: 'Q_CALVIN_KNOTS', op: 'start' }]);
    expect(starts('W3_NORA')).toEqual([{ quest: 'Q_NORA_PHOTO', op: 'start' }]);
    expect(starts('W3_HANK')).toEqual([{ quest: 'Q_HANK_TRAPS', op: 'start' }]);
  });
});

describe('weeks 2–3 quests', () => {
  for (const qid of MY_QUESTS) {
    it(`${qid} has ≥3 steps, each with a written scene`, () => {
      const q = QUESTS.find((x) => x.id === qid);
      expect(q, qid).toBeDefined();
      expect(q!.steps.length).toBeGreaterThanOrEqual(3);
      q!.steps.forEach((st, i) => {
        expect(st.scenes.length, `${qid}#${i}`).toBeGreaterThan(0);
        if (st.repeat) expect(st.scenes.length, `${qid}#${i} one scene per repetition`).toBe(st.repeat);
        for (const sc of st.scenes) expect(collectTexts(sc).length, `${qid}#${i}`).toBeGreaterThan(3);
        expect(/(대화|말 걸기|이야기하기)/.test(st.task), `${qid}#${i} is a doing step: ${st.task}`).toBe(false);
      });
    });
  }

  it('Calvin never says 수집 / collection in the quests, and calls the wall 제 취미예요', () => {
    const lines = QUESTS.flatMap((q) => q.steps.flatMap((st) => st.scenes.flatMap((sc) => calvinLines(sc))));
    for (const l of lines) expect(/수집|collection|collector/i.test(l), l).toBe(false);
    expect(lines.some((l) => l.includes('제 취미예요'))).toBe(true);
  });

  it("Toby's line plants E_WHISTLE_TEACHER", () => {
    const q = QUESTS.find((x) => x.id === 'Q_CALVIN_KNOTS')!;
    const last = q.steps[q.steps.length - 1].scenes[0];
    expect(collectTexts(last).some((t) => t.includes('선배님한테 배운 곡이에요!'))).toBe(true);
    expect(effectsIn(last)).toContainEqual({ evidence: 'E_WHISTLE_TEACHER' });
  });

  it('every evidence id granted in weeks 2–3 exists, and cash rewards stay small', () => {
    const all: Effect[] = [];
    for (const e of WEEK2_3_EVENTS) effectsIn(e.steps, all);
    for (const qid of MY_QUESTS) {
      const q = QUESTS.find((x) => x.id === qid)!;
      for (const st of q.steps) {
        for (const sc of st.scenes) effectsIn(sc, all);
        all.push(...(st.effects ?? []));
      }
      all.push(...(q.complete ?? []));
    }
    const ev = all.filter((f): f is { evidence: string } => 'evidence' in f).map((f) => f.evidence);
    expect(ev.length).toBeGreaterThan(0);
    for (const id of ev) expect(EVIDENCE_NAMES[id], id).toBeDefined();
    for (const f of all) if ('money' in f) expect(Math.abs(f.money)).toBeLessThanOrEqual(40);
  });

  it('Q_ROSA_ICE: ice ×3 → storeroom (back door + date) → mend at dawn → shrimp basket', () => {
    const s = newGame(1);
    s.day = 8;
    applyEffects(s, [{ quest: 'Q_ROSA_ICE', op: 'start' }]);
    for (let d = 8; d <= 10; d++) {
      s.day = d;
      expect(stepAvailableNow(s, 'Q_ROSA_ICE', 'dock', 'afternoon')).toBe(true);
      performStep(s, 'Q_ROSA_ICE');
      expect(stepAvailableNow(s, 'Q_ROSA_ICE', 'dock', 'afternoon')).toBe(false);
    }
    expect(currentStep(s, 'Q_ROSA_ICE')?.loc).toBe('diner');
    expect(stepAvailableNow(s, 'Q_ROSA_ICE', 'diner', 'afternoon')).toBe(false); // next day
    s.day = 11;
    const step = currentStep(s, 'Q_ROSA_ICE')!;
    applyEffects(s, effectsIn(step.scenes[0]));
    performStep(s, 'Q_ROSA_ICE');
    expect(s.evidence).toContain('E_ROSA_BACKDOOR');
    expect(s.flags.salDate).toBe('1978-06-02');
    s.day = 12;
    expect(stepAvailableNow(s, 'Q_ROSA_ICE', 'dock', 'dawn')).toBe(true);
    performStep(s, 'Q_ROSA_ICE');
    expect(stepAvailableNow(s, 'Q_ROSA_ICE', 'diner', 'afternoon')).toBe(true);
    const before = s.feelings.rosa;
    performStep(s, 'Q_ROSA_ICE');
    expect(s.quests.Q_ROSA_ICE.state).toBe('done');
    expect(s.feelings.rosa).toBe(before + 25);
  });

  it("Q_HANK_TRAPS: traps come up in the net only after the landmarks, and only on their grounds", () => {
    const s = newGame(1);
    s.day = 17;
    applyEffects(s, [{ quest: 'Q_HANK_TRAPS', op: 'start' }]);
    expect(storyCatchFor(s, 'river')).toEqual([]);
    performStep(s, 'Q_HANK_TRAPS'); // lighthouse
    expect(storyCatchFor(s, 'river')).toEqual(['s_hank_trap_river']);
    expect(storyCatchFor(s, 'oyster')).toEqual(['s_hank_trap_oyster']);
    expect(storyCatchFor(s, 'wreck')).toEqual([]);
    s.day = 18;
    expect(stepAvailableNow(s, 'Q_HANK_TRAPS', 'dock', 'afternoon')).toBe(false);
    s.flags.story_s_hank_trap_river = 'kept';
    expect(storyCatchFor(s, 'river')).toEqual([]);
    expect(stepAvailableNow(s, 'Q_HANK_TRAPS', 'dock', 'afternoon')).toBe(true);
    performStep(s, 'Q_HANK_TRAPS');
    expect(stepAvailableNow(s, 'Q_HANK_TRAPS', 'dock', 'afternoon')).toBe(false);
    s.flags.story_s_hank_trap_oyster = 'kept';
    performStep(s, 'Q_HANK_TRAPS');
    expect(stepAvailableNow(s, 'Q_HANK_TRAPS', 'fishMarket', 'afternoon')).toBe(true);
    performStep(s, 'Q_HANK_TRAPS');
    expect(s.quests.Q_HANK_TRAPS.state).toBe('done');
    expect(storyCatchFor(s, 'oyster')).toEqual([]);
    for (const id of ['s_hank_trap_river', 's_hank_trap_oyster']) expect(STORY_CATCH.find((c) => c.id === id)?.day).toBeUndefined();
  });

  it('a careful player can reach Hank ≥ 60, which opens E_PIKE_CAR in week 4', () => {
    const s = newGame(1);
    s.day = 22;
    s.feelings.hank += 3 + 5 + 3; // W3_HANK offer, "거스 영감님", crabs kept
    applyEffects(s, [{ quest: 'Q_HANK_TRAPS', op: 'start' }, { quest: 'Q_HANK_TRAPS', op: 'complete' }]);
    expect(s.feelings.hank).toBeGreaterThanOrEqual(60);
    expect(pendingEvents(s, ALL_EVENTS, 'dawn').map((e) => e.id)).toContain('HANK_NIGHT_CAR');
  });

  it('the old logbook (E_LOGBOOK_DOCKED) waits until Day 20 and Rosa\'s date', () => {
    const s = newGame(1);
    s.day = 19;
    s.evidence.push('E_ROSA_BACKDOOR');
    expect(pendingEvents(s, ALL_EVENTS, 'evening').map((e) => e.id)).not.toContain('LOGBOOK_SAL_NIGHT');
    s.day = 20;
    expect(pendingEvents(s, ALL_EVENTS, 'evening').map((e) => e.id)).toContain('LOGBOOK_SAL_NIGHT');
  });
});
