import type { LetterDef } from './types';
import { LETTERS_01_12 } from './l01_12';
import { LETTERS_13_24 } from './l13_24';
import { LETTERS_25_36 } from './l25_36';

export const LETTERS: LetterDef[] = [...LETTERS_01_12, ...LETTERS_13_24, ...LETTERS_25_36];

export const TOTAL_LETTERS = 72;

export function letterDef(n: number): LetterDef | undefined {
  return LETTERS.find((l) => l.n === n);
}
