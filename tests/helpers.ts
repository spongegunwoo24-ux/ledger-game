import { collectTexts } from '../src/core/events';
import { ALL_EVENTS } from '../src/data/events';
import { QUESTS } from '../src/data/quests';
import { LETTERS } from '../src/data/letters';
import { GUS_DECK_LINES, GUS_REJECT_HINTS, GUS_TOW, GUS_TUTORIAL_DECK, GUS_WRONG_BASKET } from '../src/data/dialogue/gusDeck';
import { SMALLTALK } from '../src/data/dialogue/smalltalk';
import { CURIOSITIES, STORY_CATCH } from '../src/data/catch';
import { LOGBOOK_ENTRIES, GROUND_TIPS } from '../src/data/logbook';
import { STATEMENTS } from '../src/data/caseWall';
import { LOCATIONS } from '../src/data/locations';
import { GROUNDS } from '../src/data/grounds';

/** Every player-facing string in the data files, with a label for error messages. */
export function allPlayerStrings(): { where: string; text: string; day?: number }[] {
  const out: { where: string; text: string; day?: number }[] = [];
  for (const e of ALL_EVENTS) for (const t of collectTexts(e.steps)) out.push({ where: e.id, text: t, day: e.trigger.day ?? e.trigger.days?.[0] });
  for (const q of QUESTS) {
    out.push({ where: q.id, text: q.title });
    q.steps.forEach((st, i) => {
      out.push({ where: `${q.id}#${i}`, text: st.task }, { where: `${q.id}#${i}`, text: st.button });
      st.scenes.forEach((sc) => collectTexts(sc).forEach((t) => out.push({ where: `${q.id}#${i}`, text: t })));
    });
  }
  for (const l of LETTERS) out.push({ where: `L${l.n}`, text: l.body });
  for (const l of GUS_DECK_LINES) out.push({ where: 'gusDeck', text: l.text, day: l.from });
  for (const t of [...Object.values(GUS_REJECT_HINTS), ...GUS_TUTORIAL_DECK, ...GUS_WRONG_BASKET, ...Object.values(GUS_TOW).flat()])
    out.push({ where: 'gus', text: t });
  for (const [who, lines] of Object.entries(SMALLTALK)) for (const l of lines ?? []) out.push({ where: `talk:${who}`, text: l.text });
  for (const c of CURIOSITIES) out.push({ where: c.id, text: c.name }, { where: c.id, text: c.desc });
  for (const c of STORY_CATCH) out.push({ where: c.id, text: c.name }, { where: c.id, text: c.rescueLine });
  for (const [k, e] of Object.entries(LOGBOOK_ENTRIES)) out.push({ where: k, text: e.text });
  for (const t of Object.values(GROUND_TIPS)) out.push({ where: 'tip', text: t });
  for (const s of STATEMENTS) out.push({ where: s.id, text: s.text });
  for (const l of LOCATIONS) l.idle.forEach((t) => out.push({ where: l.id, text: t }));
  for (const g of GROUNDS) out.push({ where: g.id, text: g.blurb });
  return out;
}

