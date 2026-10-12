import { describe, expect, it } from 'vitest';
import { emptyTally, placeItem, recordOutcome, soldAs } from '../src/systems/sorting';
import type { CatchItem } from '../src/data/catch';

const shrimp = (size: 'small' | 'medium' | 'large'): CatchItem => ({ uid: 1, kind: 'shrimp', size });

describe('deck sorting rules', () => {
  it('wrong basket sells at the lower price', () => {
    expect(placeItem(shrimp('large'), 'medium')).toBe('basketLow');
    expect(soldAs(shrimp('large'), 'medium')).toBe('medium');
    expect(soldAs(shrimp('small'), 'large')).toBe('small');
    expect(placeItem(shrimp('medium'), 'medium')).toBe('basket');
  });

  it('turtles must go over the rail; binned turtles are recorded', () => {
    const t: CatchItem = { uid: 2, kind: 'turtle' };
    expect(placeItem(t, 'sea')).toBe('turtleSaved');
    expect(placeItem(t, 'trash')).toBe('turtleBinned');
    expect(placeItem(t, 'small')).toBe('reject');
  });

  it('bycatch can be tossed to Ledger', () => {
    expect(placeItem({ uid: 3, kind: 'fish', id: 'mullet' }, 'ledger')).toBe('fed');
  });

  it('anything in the trash is gone forever (curiosities too)', () => {
    expect(placeItem({ uid: 4, kind: 'curio', id: 'c_coin' }, 'trash')).toBe('lost');
    expect(placeItem({ uid: 5, kind: 'story', id: 's_bottle_note' }, 'trash')).toBe('storyTrashed');
  });

  it('tally adds pounds by price class', () => {
    const t = emptyTally();
    recordOutcome(t, shrimp('large'), 'medium', 'basketLow');
    expect(t.lbs.medium).toBeGreaterThan(0);
    expect(t.wrongBasket).toBe(1);
  });
});
