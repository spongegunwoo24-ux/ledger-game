import { describe, expect, it } from 'vitest';
import { SHORES } from '../src/data/shore';
import { doorOf, findPath, SPOTS, spotOf, walkable } from '../src/scenes/town/townMap';

/** [변경 2] the walkable town: every door and fishing spot can be reached on foot from the dock */
describe('town map', () => {
  const start = doorOf(spotOf('dock')!);

  it('every door is walkable and reachable', () => {
    for (const sp of SPOTS) {
      const d = doorOf(sp);
      expect(walkable(d.x, d.y + 8), sp.loc).toBe(true);
      const path = findPath(start, { x: d.x, y: d.y + 8 });
      expect(path.length, sp.loc).toBeGreaterThan(0);
      for (const p of path.slice(0, -1)) expect(walkable(p.x, p.y), `${sp.loc} via ${p.x},${p.y}`).toBe(true);
    }
  });

  it('every fishing spot is walkable and reachable', () => {
    for (const sh of SHORES) {
      expect(walkable(sh.town.x, sh.town.y), sh.id).toBe(true);
      expect(findPath(start, sh.town).length, sh.id).toBeGreaterThan(0);
    }
  });

  it('the sea and buildings block walking', () => {
    expect(walkable(1300, 1430)).toBe(false);
    const bank = spotOf('bank')!;
    expect(walkable(bank.x, bank.y - 40)).toBe(false);
  });
});
