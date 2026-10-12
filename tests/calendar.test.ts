import { describe, expect, it } from 'vitest';
import {
  cumulativeDue,
  isFriday,
  isMonday,
  isPaymentDay,
  isSunday,
  moonOf,
  paymentDueForWeek,
  weekOf,
  weekdayName,
  weatherOf,
} from '../src/core/calendar';

describe('calendar', () => {
  it('Day 1 is a Saturday and weeks run Saturday→Friday', () => {
    expect(weekdayName(1)).toBe('토');
    expect(weekdayName(7)).toBe('금');
    expect(weekOf(7)).toBe(1);
    expect(weekOf(8)).toBe(2);
    expect(weekOf(70)).toBe(10);
  });

  it('has the scheduled Fridays and Sundays', () => {
    const fridays = Array.from({ length: 70 }, (_, i) => i + 1).filter(isFriday);
    expect(fridays).toEqual([7, 14, 21, 28, 35, 42, 49, 56, 63, 70]);
    const pay = Array.from({ length: 70 }, (_, i) => i + 1).filter(isPaymentDay);
    expect(pay).toEqual([7, 14, 21, 28, 35, 42, 49, 56, 63]);
    const sundays = Array.from({ length: 70 }, (_, i) => i + 1).filter(isSunday);
    expect(sundays).toEqual([2, 9, 16, 23, 30, 37, 44, 51, 58, 65]);
    expect(isMonday(3)).toBe(true);
  });

  it('debt schedule totals $4,250', () => {
    expect(paymentDueForWeek(1)).toBe(250);
    expect(paymentDueForWeek(2)).toBe(500);
    expect(paymentDueForWeek(10)).toBe(0);
    expect(cumulativeDue(9)).toBe(4250);
  });

  it('weather: storm only on Day 67, never before week 10', () => {
    for (let d = 1; d <= 70; d++) {
      const w = weatherOf(d, 123);
      if (d === 67) expect(w).toBe('폭풍');
      else expect(w).not.toBe('폭풍');
    }
  });

  it('moon cycles through all four phases every week', () => {
    const phases = new Set(Array.from({ length: 7 }, (_, i) => moonOf(i + 1)));
    expect(phases.size).toBe(4);
  });
});
