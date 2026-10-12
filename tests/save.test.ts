import { describe, expect, it } from 'vitest';
import { deserialize, loadFrom, saveTo, serialize, type StorageLike } from '../src/core/save';
import { newGame } from '../src/core/state';

function memStorage(): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

describe('save/load', () => {
  it('restores the exact state', () => {
    const s = newGame(42);
    s.day = 17;
    s.segment = 'evening';
    s.money = 123.45;
    s.debt = 3000;
    s.flags.graffiti = true;
    s.feelings.rosa = 61;
    s.quests.Q_BOTTLE = { state: 'done', step: 3, progress: 0, startedDay: 5, lastDay: 6 };
    s.lettersRead = [1, 2, 3];
    s.lettersBurned = [4];
    s.evidence = ['E_ROSA_BACKDOOR'];
    s.rewritten = ['S02'];
    s.deckWear = 9;
    s.purchases.icebox = 1;
    s.decor.porch = 'rockingChair';
    const st = memStorage();
    expect(saveTo(st, s)).toBe(true);
    const back = loadFrom(st);
    expect(back).toEqual(s);
  });

  it('fills missing fields from older saves', () => {
    const s = newGame(1);
    const raw = JSON.parse(serialize(s));
    delete raw.totals;
    delete raw.feelings.ada;
    const back = deserialize(JSON.stringify(raw));
    expect(back.totals).toBeDefined();
    expect(back.feelings.ada).toBe(40);
  });

  it('rejects garbage', () => {
    expect(() => deserialize('{"hello":1}')).toThrow();
    expect(loadFrom(memStorage())).toBeNull();
  });
});
