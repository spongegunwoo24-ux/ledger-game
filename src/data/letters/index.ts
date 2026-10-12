import type { LetterDef } from './types';
import { LETTERS_01_12 } from './l01_12';

export const LETTERS: LetterDef[] = [...LETTERS_01_12];

export const TOTAL_LETTERS = 72;

export function letterDef(n: number): LetterDef | undefined {
  return LETTERS.find((l) => l.n === n);
}
