import { describe, expect, it } from 'vitest';
import { newGame } from '../src/core/state';
import { dueNow, executeSale, fridayPayment, gusCanOffer, payDebt, quoteSale } from '../src/systems/economy';

describe('economy', () => {
  it('cannery prices and market ×2', () => {
    const s = newGame(1);
    s.hold = { small: 10, medium: 10, large: 10, crabs: 4 };
    expect(quoteSale(s, 'cannery').total).toBeCloseTo(10 * 1 + 10 * 1.6 + 10 * 2.6 + 4 * 1.5);
    expect(quoteSale(s, 'market').total).toBeCloseTo(2 * (10 + 16 + 26 + 6));
  });

  it('cannery oversupply after 450 lb in a week', () => {
    const s = newGame(1);
    s.week.canneryLbs = 440;
    s.hold = { small: 20, medium: 0, large: 0, crabs: 0 };
    const q = quoteSale(s, 'cannery');
    expect(q.oversupplyLbs).toBe(10);
    expect(q.total).toBeCloseTo(10 * 1 + 10 * 0.8);
  });

  it('Rosa takes at most 30 lb a day, largest first, no crabs', () => {
    const s = newGame(1);
    s.hold = { small: 20, medium: 20, large: 20, crabs: 5 };
    const q = quoteSale(s, 'rosa');
    expect(q.lbs).toEqual({ small: 0, medium: 10, large: 20 });
    expect(q.crabs).toBe(0);
    executeSale(s, q);
    expect(quoteSale(s, 'rosa').total).toBe(0);
  });

  it('Friday: full payment', () => {
    const s = newGame(1);
    s.day = 7;
    s.money = 300;
    const r = fridayPayment(s);
    expect(r.paid).toBe(250);
    expect(r.short).toBe(0);
    expect(s.debt).toBe(4000);
  });

  it('first short week gets an extension, three $0 Fridays repossess', () => {
    const s = newGame(1);
    s.day = 7;
    s.money = 0;
    let r = fridayPayment(s);
    expect(r.extensionGranted).toBe(true);
    expect(r.repossess).toBe(false);
    expect(s.zeroStreak).toBe(0);
    s.day = 14;
    r = fridayPayment(s);
    expect(r.warning).toBe(1);
    s.day = 21;
    r = fridayPayment(s);
    expect(r.warning).toBe(2);
    s.day = 28;
    r = fridayPayment(s);
    expect(r.repossess).toBe(true);
  });

  it('a partial payment resets the zero streak', () => {
    const s = newGame(1);
    s.extensionUsed = true;
    s.day = 7;
    s.money = 0;
    fridayPayment(s);
    expect(s.zeroStreak).toBe(1);
    s.day = 14;
    s.money = 10;
    fridayPayment(s);
    expect(s.zeroStreak).toBe(0);
  });

  it('prepaying means nothing is due on Friday and is never a $0 week', () => {
    const s = newGame(1);
    s.money = 1000;
    payDebt(s, 750);
    s.paidThisWeek = 0;
    s.day = 14;
    expect(dueNow(s)).toBe(0);
    s.money = 0;
    const r = fridayPayment(s);
    expect(r.due).toBe(0);
    expect(s.zeroStreak).toBe(0);
  });

  it('paying everything off is celebrated, not an ending', () => {
    const s = newGame(1);
    s.money = 5000;
    payDebt(s, 4250);
    expect(s.debt).toBe(0);
    expect(s.flags.debtPaidOffDay).toBe(1);
    s.day = 14;
    const r = fridayPayment(s);
    expect(r.repossess).toBe(false);
    expect(r.due).toBe(0);
  });

  it("Gus's coffee can is offered once when money < 50% of what is due (Days 7–42)", () => {
    const s = newGame(1);
    s.day = 14;
    s.money = 100;
    s.debt = 4000;
    expect(gusCanOffer(s)).toBe(true);
    s.flags.gusCanOffered = true;
    expect(gusCanOffer(s)).toBe(false);
    const t = newGame(1);
    t.day = 49;
    t.money = 0;
    expect(gusCanOffer(t)).toBe(false);
  });
});
