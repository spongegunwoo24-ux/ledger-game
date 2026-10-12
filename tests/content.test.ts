import { describe, expect, it } from 'vitest';
import { LETTERS } from '../src/data/letters';
import { ALL_EVENTS } from '../src/data/events';
import { QUESTS } from '../src/data/quests';
import { allPlayerStrings } from './helpers';

describe('content', () => {
  const strings = allPlayerStrings();

  it('has no placeholder or empty text', () => {
    const bad = /(TODO|TBD|lorem|\.\.\.|\(대사\)|\[편지 내용\]|FIXME|XXX)/i;
    for (const s of strings) {
      expect(s.text.trim().length, `empty string in ${s.where}`).toBeGreaterThan(0);
      expect(bad.test(s.text), `placeholder in ${s.where}: ${s.text}`).toBe(false);
    }
  });

  it('letters are 120–350 characters and numbered in order', () => {
    LETTERS.forEach((l, i) => {
      expect(l.n).toBe(i + 1);
      const len = Array.from(l.body.replace(/\s+/g, ' ')).length;
      expect(len, `L${l.n} length ${len}`).toBeGreaterThanOrEqual(120);
      expect(len, `L${l.n} length ${len}`).toBeLessThanOrEqual(350);
    });
  });

  it('L01 has the shrimp line (D18)', () => {
    expect(LETTERS[0].body).toContain('아직도 새우 싫어하니?');
  });

  it('event and quest ids are unique', () => {
    const ids = ALL_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const q = QUESTS.map((x) => x.id);
    expect(new Set(q).size).toBe(q.length);
  });

  it('every quest has at least 3 steps, each with a place and segment', () => {
    for (const q of QUESTS) {
      expect(q.steps.length).toBeGreaterThanOrEqual(3);
      for (const st of q.steps) {
        expect(st.loc).toBeTruthy();
        expect(st.seg).toBeTruthy();
        expect(st.scenes.length).toBeGreaterThan(0);
      }
    }
  });
});
