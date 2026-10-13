import { newGame, SAVE_VERSION, type GameState } from './state';

export const SAVE_KEY = 'ledger.save.v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function serialize(s: GameState): string {
  return JSON.stringify(s);
}

/** Parses a save, filling in any field missing from older saves. Throws on garbage. */
export function deserialize(raw: string): GameState {
  const data = JSON.parse(raw) as Partial<GameState>;
  if (!data || typeof data !== 'object' || typeof data.day !== 'number' || typeof data.money !== 'number') {
    throw new Error('세이브 파일 형식이 아니에요.');
  }
  if ((data.version ?? 0) > SAVE_VERSION) throw new Error('더 새로운 버전의 세이브예요.');
  const base = newGame(typeof data.seed === 'number' ? data.seed : 1);
  const merged: GameState = { ...base, ...data } as GameState;
  merged.feelings = { ...base.feelings, ...(data.feelings ?? {}) };
  merged.hold = { ...base.hold, ...(data.hold ?? {}) };
  if (!Array.isArray(merged.hold.fish)) merged.hold.fish = [];
  merged.today = { ...base.today, ...(data.today ?? {}) };
  merged.week = { ...base.week, ...(data.week ?? {}) };
  merged.totals = { ...base.totals, ...(data.totals ?? {}) };
  merged.version = SAVE_VERSION;
  return merged;
}

export function saveTo(storage: StorageLike, s: GameState): boolean {
  try {
    storage.setItem(SAVE_KEY, serialize(s));
    return true;
  } catch {
    return false;
  }
}

export function loadFrom(storage: StorageLike): GameState | null {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    return deserialize(raw);
  } catch {
    return null;
  }
}

export function clearSave(storage: StorageLike): void {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/** Triggers a download of the save JSON (pause menu → 내보내기). */
export function exportSave(s: GameState): void {
  const blob = new Blob([serialize(s)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ledger-day${s.day}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

/** Opens a file picker and resolves with the parsed save (pause menu → 불러오기). */
export function importSave(): Promise<GameState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return reject(new Error('파일을 고르지 않았어요.'));
      f.text()
        .then((t) => resolve(deserialize(t)))
        .catch(reject);
    };
    input.click();
  });
}
