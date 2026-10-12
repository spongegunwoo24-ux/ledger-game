import type { Effect } from '../../core/effects';

export interface LetterDef {
  /** 1..72 */
  n: number;
  /** "1982년 9월" style date line */
  date: string;
  body: string;
  /** mentions Daniel (counts toward E_LETTERS_DANIEL) */
  daniel?: boolean;
  /** unlocked by reading */
  effects?: Effect[];
}
