import { describe, expect, it } from 'vitest';
import { applyEffects } from '../src/core/effects';
import { newGame } from '../src/core/state';
import { currentStep, performStep, stepAvailableNow } from '../src/systems/quests';
import { notebookEntries } from '../src/systems/notebook';

describe('quests', () => {
  it('Q_BOTTLE: dunes → (next day) boathouse → board, then Maisie +40', () => {
    const s = newGame(1);
    s.day = 5;
    s.segment = 'afternoon';
    applyEffects(s, [{ quest: 'Q_BOTTLE', op: 'start' }]);
    expect(stepAvailableNow(s, 'Q_BOTTLE', 'dunes', 'afternoon')).toBe(true);
    performStep(s, 'Q_BOTTLE');
    expect(currentStep(s, 'Q_BOTTLE')?.loc).toBe('dunes');
    expect(stepAvailableNow(s, 'Q_BOTTLE', 'dunes', 'afternoon')).toBe(false);
    s.day = 6;
    expect(stepAvailableNow(s, 'Q_BOTTLE', 'dunes', 'afternoon')).toBe(true);
    performStep(s, 'Q_BOTTLE');
    expect(stepAvailableNow(s, 'Q_BOTTLE', 'board', 'afternoon')).toBe(true);
    const before = s.feelings.maisie;
    performStep(s, 'Q_BOTTLE');
    expect(s.quests.Q_BOTTLE.state).toBe('done');
    expect(s.feelings.maisie).toBe(before + 40);
  });

  it('the notebook always has a concrete place and time', () => {
    const s = newGame(1);
    for (let d = 1; d <= 10; d++) {
      s.day = d;
      const e = notebookEntries(s);
      expect(e.filter((x) => !x.pinned).length).toBeGreaterThanOrEqual(1);
      for (const x of e) {
        expect(x.when.length).toBeGreaterThan(0);
        expect(x.where.length).toBeGreaterThan(0);
      }
    }
  });
});
