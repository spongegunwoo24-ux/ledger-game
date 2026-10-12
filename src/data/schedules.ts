import { weekdayIndex } from '../core/calendar';
import type { GameState } from '../core/state';
import type { CharId, LocId, Segment } from '../core/types';

/**
 * Where people are in the afternoon (the town map shows portraits there).
 * Fixed habits from DESIGN §8.7; overrides by day range come after.
 */
export function afternoonLocation(s: GameState, who: CharId): LocId | null {
  const d = s.day;
  const wd = weekdayIndex(d); // 0 = Sat
  switch (who) {
    case 'rosa':
      return d === 27 ? null : 'diner';
    case 'toby':
      return (['board', 'dock', 'sheriff'] as LocId[])[d % 3];
    case 'matthew':
      return 'church';
    case 'calvin':
      return wd % 2 === 0 ? 'calvinCabin' : 'diner';
    case 'gus':
      if (d >= 45 || s.flags.gusGone) return null;
      return wd % 2 === 0 ? 'dock' : 'gusHouse';
    case 'priya':
      return wd === 1 ? null : 'bank';
    case 'dunbar':
      return 'sheriff';
    case 'pike':
      return wd === 3 || wd === 5 ? 'diner' : 'sheriff';
    case 'nora':
      return d < 16 ? null : wd % 2 === 0 ? 'diner' : 'board';
    case 'mabel':
      return 'secondhand';
    case 'vince':
      return 'pawn';
    case 'hank':
      return 'fishMarket';
    case 'maisie':
      return 'board';
    case 'ada':
      return d >= 37 ? 'edithHouse' : null;
    default:
      return null;
  }
}

export const TOWN_PEOPLE: CharId[] = ['rosa', 'toby', 'matthew', 'calvin', 'gus', 'priya', 'dunbar', 'pike', 'nora', 'mabel', 'vince', 'hank', 'maisie', 'ada'];

export function peopleAt(s: GameState, loc: LocId, seg: Segment = 'afternoon'): CharId[] {
  if (seg !== 'afternoon') return [];
  return TOWN_PEOPLE.filter((p) => afternoonLocation(s, p) === loc);
}
