import { describe, expect, it } from 'vitest';
import { collectTexts } from '../src/core/events';
import { ALL_EVENTS } from '../src/data/events';
import { allPlayerStrings } from './helpers';

/** Phrases that would state Calvin is the killer. Not allowed before Day 60. */
const SPOILERS = [/캘빈이 범인/, /범인은 캘빈/, /캘빈이 죽였/, /캘빈 짓/, /캘빈이 (그|사람들|대니얼|거스)를 (죽|없앴)/, /캘빈.{0,6}살인/, /살인마.{0,4}캘빈/];

describe('no early answers', () => {
  it('nothing reachable before Day 60 says Calvin is the killer', () => {
    for (const s of allPlayerStrings()) {
      if (s.day !== undefined && s.day >= 60) continue;
      for (const re of SPOILERS) expect(re.test(s.text), `${s.where}: ${s.text}`).toBe(false);
    }
  });

  it('Calvin never says 수집 / 수집품 / collection / collector', () => {
    for (const e of ALL_EVENTS) {
      const calvinLines: string[] = [];
      const walk = (steps: typeof e.steps) => {
        for (const st of steps) {
          if (st.t === 'say' && st.who === 'calvin') calvinLines.push(st.text);
          if (st.t === 'choice') st.options.forEach((o) => o.then && walk(o.then));
          if (st.t === 'if') {
            walk(st.then);
            if (st.else) walk(st.else);
          }
        }
      };
      walk(e.steps);
      for (const l of calvinLines) expect(/수집|collection|collector/i.test(l), `${e.id}: ${l}`).toBe(false);
    }
  });

  it("the father's rule is about the place, never about the night", () => {
    const texts = ALL_EVENTS.flatMap((e) => collectTexts(e.steps));
    const rule = texts.filter((t) => t.includes('그물을 내리지 마라'));
    expect(rule.length).toBeGreaterThan(0);
    for (const t of rule) expect(t).toContain('등대 앞 그 자리에는 절대 그물을 내리지 마라.');
    for (const t of rule) expect(t).not.toMatch(/밤/);
  });
});
