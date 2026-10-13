import { describe, expect, it } from 'vitest';
import { simulateSeason } from '../src/systems/simulate';

/**
 * [변경 2] Economy simulation (fuel, bait, living costs; fish sold one by one).
 * Money should feel tight: the average player pays every Friday with only a small cushion.
 */
const SEEDS = [1, 2, 3, 12345];

describe('economy simulation', () => {
  it('average: pays every Friday on time, never a game over, but never rich', () => {
    for (const seed of SEEDS) {
      const r = simulateSeason('average', 63, seed);
      const log = r.log.join('\n');
      expect(r.repossessed, log).toBe(false);
      expect(r.shortFridays, log).toBe(0);
      // the cushion after paying stays small (about one week at most)
      expect(Math.max(...r.fridayMoney), log).toBeLessThan(700);
    }
  });

  it('great: pays off the debt in week 6–8', () => {
    for (const seed of SEEDS) {
      const r = simulateSeason('great', 63, seed);
      expect(r.paidOffDay, r.log.join('\n')).not.toBeNull();
      expect(r.paidOffDay!).toBeGreaterThanOrEqual(36);
      expect(r.paidOffDay!).toBeLessThanOrEqual(56);
    }
  });

  it('poor: pays week 1 and holds on for at least four weeks', () => {
    for (const seed of SEEDS) {
      const r = simulateSeason('poor', 63, seed);
      const log = r.log.join('\n');
      expect(r.state.payments[0]?.short ?? 0, log).toBe(0);
      if (r.repossessedDay !== null) expect(r.repossessedDay, log).toBeGreaterThanOrEqual(28);
    }
  });
});
