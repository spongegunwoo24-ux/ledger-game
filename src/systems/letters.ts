import { TUNING } from '../config/tuning';
import { isSunday } from '../core/calendar';
import { applyEffects } from '../core/effects';
import type { GameState } from '../core/state';
import { LETTERS, letterDef, TOTAL_LETTERS } from '../data/letters';
import type { LetterLook } from '../ui/overlays';

export function nextLetterNumber(s: GameState): number | null {
  for (let n = 1; n <= TOTAL_LETTERS; n++) {
    if (!s.lettersRead.includes(n) && !s.lettersBurned.includes(n)) return letterDef(n) ? n : null;
  }
  return null;
}

export function lettersAllowedTonight(s: GameState): number {
  return isSunday(s.day) ? TUNING.letters.perSunday : TUNING.letters.perEvening;
}

export function canOpenLetterTonight(s: GameState): boolean {
  return !!s.flags.letterBoxFound && s.lettersToday < lettersAllowedTonight(s) && nextLetterNumber(s) !== null;
}

export function readLetter(s: GameState, n: number): string[] {
  if (s.lettersRead.includes(n) || s.lettersBurned.includes(n)) return [];
  s.lettersRead.push(n);
  s.lettersToday += 1;
  const out = applyEffects(s, letterDef(n)?.effects);
  const danielRead = LETTERS.filter((l) => l.daniel && s.lettersRead.includes(l.n)).length;
  if (danielRead >= 10 && !s.evidence.includes('E_LETTERS_DANIEL')) out.push(...applyEffects(s, [{ evidence: 'E_LETTERS_DANIEL' }]));
  return out;
}

export function burnLetter(s: GameState, n: number): void {
  if (s.lettersRead.includes(n) || s.lettersBurned.includes(n)) return;
  s.lettersBurned.push(n);
  s.lettersToday += 1;
}

/** Handwriting gets shakier and censorship stamps increase across the letters (D17). */
export function letterLook(n: number): LetterLook {
  return {
    jitter: 0.08 + (n / 72) * 1.1,
    stamps: Math.floor((n - 1) / 12) + (n >= 60 ? 1 : 0),
    seed: n * 7919,
    shrimpDoodle: n === 1,
  };
}
