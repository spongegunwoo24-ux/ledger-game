import { describe, expect, it } from 'vitest';
import { makeRng } from '../src/core/rng';
import { newGame } from '../src/core/state';
import { conditionsFor, groundAvailable, rollHaul, snagChancePerSecond, towCurve } from '../src/systems/fishing';

describe('fishing', () => {
  it('longer tows catch more, with diminishing returns', () => {
    expect(towCurve(0)).toBe(0);
    expect(towCurve(60)).toBeGreaterThan(towCurve(30));
    expect(towCurve(120) - towCurve(90)).toBeLessThan(towCurve(30) - towCurve(0));
  });

  it('no snag risk at the start of a tow; wreck is riskier than the sandbar', () => {
    expect(snagChancePerSecond('wreck', 10)).toBe(0);
    expect(snagChancePerSecond('wreck', 80)).toBeGreaterThan(snagChancePerSecond('sandbar', 80));
  });

  it("the spot in front of the lighthouse is locked until Day 67; Gus's spot only Day 1, 6 and from Day 15", () => {
    const s = newGame(1);
    for (let d = 1; d <= 70; d++) {
      s.day = d;
      expect(groundAvailable(s, 'theSpot')).toBe(d >= 67);
      expect(groundAvailable(s, 'gusSpot')).toBe(d === 1 || d === 6 || d >= 15);
    }
  });

  it('hauls are deterministic and include the Day 5 bottle', () => {
    const opts = (seed: number) => ({
      ground: 'oyster' as const,
      seconds: 70,
      conditions: conditionsFor(5, 7),
      netTornAtStart: false,
      snagged: false,
      snagLoss: 0,
      day: 5,
      towIndex: 0,
      rng: makeRng(seed),
      storyTaken: [],
    });
    const a = rollHaul(opts(3)).map((i) => [i.kind, i.size, i.id]);
    const b = rollHaul(opts(3)).map((i) => [i.kind, i.size, i.id]);
    expect(a).toEqual(b);
    expect(a.some((x) => x[2] === 's_bottle_note')).toBe(true);
    expect(a.length).toBeLessThanOrEqual(70);
  });
});
