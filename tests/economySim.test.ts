import { describe, expect, it } from 'vitest';
import { simulateSeason } from '../src/systems/simulate';

/** [변경 1] Economy simulation over the new day structure (net + moderate fishing). */
const SEEDS = [1, 2, 3, 12345];

describe('economy simulation', () => {
  it('average: pays every Friday on time, never a game over', () => {
    for (const seed of SEEDS) {
      const r = simulateSeason('average', 63, seed);
      expect(r.repossessed, r.log.join('\n')).toBe(false);
      expect(r.shortFridays, r.log.join('\n')).toBe(0);
    }
  });

  it('great: pays off the debt in week 6–7', () => {
    for (const seed of SEEDS) {
      const r = simulateSeason('great', 63, seed);
      expect(r.paidOffDay, r.log.join('\n')).not.toBeNull();
      expect(r.paidOffDay!).toBeGreaterThanOrEqual(33);
      expect(r.paidOffDay!).toBeLessThanOrEqual(49);
    }
  });

  it("poor: pays week 1 and mostly survives (warning week, Gus's can)", () => {
    let survived = 0;
    for (const seed of SEEDS) {
      const r = simulateSeason('poor', 63, seed);
      expect(r.state.payments[0]?.short ?? 0, r.log.join('\n')).toBe(0);
      if (!r.repossessed) survived++;
    }
    expect(survived).toBeGreaterThanOrEqual(3);
  });
});
