import { describe, expect, it } from 'vitest';
import { ALL_EVENTS } from '../src/data/events';

/** Event days must match DESIGN §9 exactly. Extended as milestones add weeks. */
const CANON: Record<string, [number, string]> = {
  W1_FUNERAL: [1, 'morning'],
  W1_BANK: [1, 'morning'],
  W1_FIRST_TRIP: [1, 'afternoon'],
  W1_FIRST_SALE: [2, 'morning'],
  W1_LETTER_BOX: [2, 'evening'],
  W1_GRAFFITI: [3, 'dawn'],
  W1_LOGBOOK_X: [4, 'evening'],
  W1_BOTTLE: [5, 'morning'],
  W1_KNOT_LESSON: [6, 'dawn'],
};

describe('canon timeline', () => {
  for (const [id, [day, seg]] of Object.entries(CANON)) {
    it(`${id} happens on Day ${day} (${seg})`, () => {
      const e = ALL_EVENTS.find((x) => x.id === id);
      expect(e, id).toBeDefined();
      expect(e!.trigger.day).toBe(day);
      expect(e!.trigger.segment).toBe(seg);
    });
  }

  it('scheduled beats have no requirements that could skip them', () => {
    for (const id of Object.keys(CANON)) {
      const e = ALL_EVENTS.find((x) => x.id === id)!;
      expect(e.trigger.requires, id).toBeUndefined();
    }
  });
});
