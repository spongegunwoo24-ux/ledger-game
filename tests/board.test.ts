import { describe, expect, it } from 'vitest';
import { newGame } from '../src/core/state';
import { eliNameScribbled, eliRank, fillOrder, isAnonymous, orderDone, orderValue, ranking, settleWeekRanking, todaysOrders } from '../src/systems/board';
import { forecastLines } from '../src/systems/forecast';

describe('[변경 2] harbor board', () => {
  it('posts 2–3 orders a day from Day 2, the diner always wants shrimp', () => {
    const s = newGame(7);
    s.day = 1;
    expect(todaysOrders(s)).toEqual([]);
    for (let d = 2; d < 30; d++) {
      s.day = d;
      const o = todaysOrders(s);
      expect(o.length).toBeGreaterThanOrEqual(2);
      expect(o.length).toBeLessThanOrEqual(3);
      expect(o[0].want.kind).toBe('shrimp');
    }
  });

  it('fills an order from the hold; hated people get it anonymously with no feeling change', () => {
    const s = newGame(7);
    s.day = 3;
    const o = todaysOrders(s)[0];
    expect(orderValue(s, o)).toBeNull();
    s.hold.large = 30;
    s.hold.medium = 30;
    const v = orderValue(s, o)!;
    expect(v).toBeGreaterThan(o.bonus);
    s.feelings.rosa = 5;
    expect(isAnonymous(s, o)).toBe(true);
    const before = s.money;
    expect(fillOrder(s, o)).toBeCloseTo(v);
    expect(s.money).toBeCloseTo(before + v);
    expect(s.feelings.rosa).toBe(5);
    expect(orderDone(s, o)).toBe(true);
    expect(fillOrder(s, o)).toBe(0);
  });

  it('ranking: Eli starts at the bottom, scribbled out; a big week puts him on top and Hank asks', () => {
    const s = newGame(7);
    s.day = 3;
    s.segment = 'afternoon';
    expect(eliRank(s)).toBe(ranking(s).length);
    expect(eliNameScribbled(s)).toBe(true);
    s.week.lbsCaught = 5000;
    expect(eliRank(s)).toBe(1);
    settleWeekRanking(s);
    expect(s.flags.hankAskPending).toBe(true);
    expect(eliNameScribbled(s)).toBe(false);
  });

  it('the radio forecast names tomorrow and never mentions a legendary', () => {
    const s = newGame(7);
    for (let d = 1; d < 40; d++) {
      s.day = d;
      const lines = forecastLines(s);
      expect(lines[0]).toMatch(/내일 날씨는/);
      expect(lines.join(' ')).not.toMatch(/올드 레드|타폰|골리앗/);
    }
  });
});
