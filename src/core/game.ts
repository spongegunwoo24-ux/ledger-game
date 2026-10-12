import { browserStorage, deserialize, loadFrom, saveTo, serialize } from './save';
import { newGame, type GameState } from './state';
import type { GroundId } from './types';

/** [변경 1] One morning at sea (not saved; a trip never spans a save). */
export interface Trip {
  ground: GroundId;
  /** clock minute the boat left the harbor */
  sailedAt: number;
  hauls: number;
  legendSpawned: boolean;
  /** Ledger dove here and was right */
  hot: boolean;
  tutorial: boolean;
}

/** The single live game state shared by all scenes. */
export const G: { state: GameState; debug: boolean; trip: Trip | null } = {
  state: newGame(1),
  debug: false,
  trip: null,
};

export function startNewGame(seed?: number): GameState {
  G.state = newGame(seed);
  return G.state;
}

export function autosave(): boolean {
  const st = browserStorage();
  return st ? saveTo(st, G.state) : false;
}

export function loadAutosave(): GameState | null {
  const st = browserStorage();
  const s = st ? loadFrom(st) : null;
  if (s) G.state = s;
  return s;
}

export function hasAutosave(): boolean {
  const st = browserStorage();
  return !!(st && st.getItem('ledger.save.v1'));
}

export const FRIDAY_KEY = 'ledger.save.friday';

/** [변경 1] A separate save every Friday morning, for "지난 금요일부터 다시 하기". */
export function saveFriday(): void {
  const st = browserStorage();
  try {
    st?.setItem(FRIDAY_KEY, serialize(G.state));
  } catch {
    /* ignore */
  }
}

export function hasFridaySave(): boolean {
  const st = browserStorage();
  return !!(st && st.getItem(FRIDAY_KEY));
}

export function loadFriday(): boolean {
  const st = browserStorage();
  try {
    const raw = st?.getItem(FRIDAY_KEY);
    if (!raw) return false;
    G.state = deserialize(raw);
    return true;
  } catch {
    return false;
  }
}
