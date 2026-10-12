import { browserStorage, loadFrom, saveTo } from './save';
import { newGame, type GameState } from './state';

/** The single live game state shared by all scenes. */
export const G: { state: GameState; debug: boolean } = {
  state: newGame(1),
  debug: false,
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
