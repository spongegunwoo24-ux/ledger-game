/** [변경 1] Player settings kept in localStorage (not in the save file). */
export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant';

export interface Settings {
  textSpeed: TextSpeed;
  guidance: boolean;
}

const KEY = 'ledger.settings';
const settings: Settings = { textSpeed: 'normal', guidance: true };

try {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  if (raw) Object.assign(settings, JSON.parse(raw));
} catch {
  /* storage unavailable */
}

export function getSettings(): Settings {
  return settings;
}

export function setSettings(p: Partial<Settings>): void {
  Object.assign(settings, p);
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export const TEXT_SPEED_MS: Record<TextSpeed, number> = { slow: 45, normal: 24, fast: 9, instant: 0 };
export const TEXT_SPEED_LABEL: Record<TextSpeed, string> = { slow: '느림', normal: '보통', fast: '빠름', instant: '즉시' };
export const TEXT_SPEEDS: TextSpeed[] = ['slow', 'normal', 'fast', 'instant'];
