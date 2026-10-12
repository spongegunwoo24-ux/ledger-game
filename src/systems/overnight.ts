import { isMonday, isSaturday } from '../core/calendar';
import { emptyDayStats, emptyWeekStats, type GameState } from '../core/state';

/** Days on which the KILLER graffiti is found at dawn (D09/D10). */
export function graffitiDawn(day: number): boolean {
  return isMonday(day) && day <= 59;
}

/**
 * World-state changes applied while Eli sleeps (DESIGN §8.13). Visible next morning.
 * Returns short notes for the debug log.
 */
export function applyOvernight(s: GameState): string[] {
  const notes: string[] = [];
  if (s.today.trips > 0) {
    s.deckWear += 1;
  }
  s.day += 1;
  s.segment = 'dawn';
  s.today = emptyDayStats();
  s.lettersToday = 0;
  s.slotsUsed = 0;
  delete s.flags.rosaLbsToday;
  delete s.flags.churchToday;
  delete s.flags.restDay;
  if (isSaturday(s.day)) {
    s.week = emptyWeekStats();
    notes.push('new week');
  }
  if (graffitiDawn(s.day)) {
    s.flags.graffiti = true;
    notes.push('graffiti');
  }
  if (s.day === 61) {
    s.flags.sorry = true;
  }
  if (s.day === 52) s.flags.population = 411;
  if (s.day === 51) s.flags.candles = 8;
  return notes;
}
