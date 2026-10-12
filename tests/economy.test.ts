import { describe, expect, it } from 'vitest';
import { newGame } from '../src/core/state';
import { dueNow, executeSale, fridayPayment, gusCanOffer, heldFishPrice, overdueDeadline, payDebt, quoteSale } from '../src/systems/economy';

describe('economy', () => {
  it('cannery prices and market ×1.5', () => {
    const s = newGame(1);
    s.hold = { small: 10, medium: 10, large: 10, crabs: 4, fish: [], golden: 0, bonus: 0 };
    expect(quoteSale(s, 'cannery').total).toBeCloseTo(10 * 1 + 10 * 1.6 + 10 * 2.6 + 4 * 1.5);
    expect(quoteSale(s, 'market').total).toBeCloseTo(1.5 * (10 + 16 + 26 + 6));
  });

  it('[변경 2] sells only the ticked rows and fish; a day on ice lowers fish price', () => {
    const s = newGame(1);
    s.day = 5;
    s.hold = {
      small: 10,
      medium: 0,
      large: 0,
      crabs: 2,
      fish: [
        { uid: 1, id: 'redfish', inches: 30, day: 5 },
        { uid: 2, id: 'redfish', inches: 30, day: 4 },
      ],
      golden: 1,
      bonus: 3,
    };
    const fresh = heldFishPrice(s, s.hold.fish[0]);
    expect(heldFishPrice(s, s.hold.fish[1])).toBeCloseTo(fresh * 0.75);
    const q = quoteSale(s, 'cannery', { crabs: false, golden: false, fish: [2] });
    expect(q.crabs).toBe(0);
    expect(q.fish).toEqual([2]);
    expect(q.total).toBeCloseTo(10 * 1 + fresh * 0.75 + 3);
    executeSale(s, q);
    expect(s.hold.fish.map((f) => f.uid)).toEqual([1]);
    expect(s.hold.crabs).toBe(2);
    expect(s.hold.golden).toBe(1);
    expect(s.hold.small).toBe(0);
    expect(s.hold.bonus).toBe(0);
  });

  it('cannery oversupply after 450 lb in a week', () => {
    const s = newGame(1);
    s.week.canneryLbs = 440;
    s.hold = { small: 20, medium: 0, large: 0, crabs: 0, fish: [], golden: 0, bonus: 0 };
    const q = quoteSale(s, 'cannery');
    expect(q.oversupplyLbs).toBe(10);
    expect(q.total).toBeCloseTo(10 * 1 + 10 * 0.8);
  });

  it('Rosa takes at most 30 lb a day, largest first, no crabs', () => {
    const s = newGame(1);
    s.hold = { small: 20, medium: 20, large: 20, crabs: 5, fish: [], golden: 0, bonus: 0 };
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

  it('[변경 1] first Friday shortfall: warning + 10% late fee due Monday; paying in time clears it', () => {
    const s = newGame(1);
    s.day = 7;
    s.money = 200;
    const r = fridayPayment(s);
    expect(r.short).toBe(50);
    expect(r.fee).toBe(5);
    expect(r.repossess).toBe(false);
    expect(s.overdue).toEqual({ amount: 55, deadlineDay: 10 });
    s.day = 10;
    s.money = 60;
    const d = overdueDeadline(s);
    expect(d?.repossess).toBe(false);
    expect(s.overdue).toBeNull();
    expect(s.money).toBe(5);
  });

  it('[변경 1] overdue not paid by Monday 17:00 → repossession', () => {
    const s = newGame(1);
    s.day = 7;
    s.money = 0;
    fridayPayment(s);
    s.day = 10;
    s.money = 100;
    const d = overdueDeadline(s);
    expect(d?.repossess).toBe(true);
  });

  it('[변경 1] a second Friday shortfall in the season → repossession', () => {
    const s = newGame(1);
    s.day = 7;
    s.money = 100;
    fridayPayment(s);
    s.day = 10;
    s.money = 500;
    overdueDeadline(s);
    s.day = 14;
    s.money = 10;
    const r = fridayPayment(s);
    expect(r.repossess).toBe(true);
  });

  it('paying the overdue early at the bank counts', () => {
    const s = newGame(1);
    s.day = 7;
    s.money = 0;
    fridayPayment(s);
    s.day = 8;
    s.money = 300;
    payDebt(s, 275);
    expect(s.overdue).toBeNull();
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
    expect(r.short).toBe(0);
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

  it("Gus's coffee can is offered once when a Friday will fall short (Days 1–44)", () => {
    const s = newGame(1);
    s.day = 14;
    s.money = 100;
    s.debt = 4000;
    expect(gusCanOffer(s)).toBe(true);
    s.money = 600;
    expect(gusCanOffer(s)).toBe(false);
    s.money = 100;
    s.flags.gusCanOffered = true;
    expect(gusCanOffer(s)).toBe(false);
    const t = newGame(1);
    t.day = 49;
    t.money = 0;
    expect(gusCanOffer(t)).toBe(false);
  });
});
