import { TUNING } from '../config/tuning';
import type { GameState } from '../core/state';
import type { FeelId } from '../core/types';

export type FeelState = '증오' | '냉담' | '경계' | '중립' | '신뢰';

export function feelStateOf(v: number): FeelState {
  if (v < 20) return '증오';
  if (v < 40) return '냉담';
  if (v < 60) return '경계';
  if (v < 80) return '중립';
  return '신뢰';
}

export const FEEL_ICON: Record<FeelState, string> = {
  증오: '✖',
  냉담: '❄',
  경계: '◐',
  중립: '○',
  신뢰: '♥',
};

export function feel(s: GameState, id: FeelId): number {
  return s.feelings[id] ?? 0;
}

/** Calvin's value is fixed at 90 (displayed 신뢰) and never changes. */
export function adjustFeel(s: GameState, id: FeelId, delta: number): number {
  if (id === 'calvin') return s.feelings.calvin;
  const v = Math.max(0, Math.min(100, (s.feelings[id] ?? 0) + delta));
  s.feelings[id] = v;
  return v;
}

export type GiftResult = 'warm' | 'cold' | 'already';

/** Gifts never fix hatred: at 증오/냉담 they make it worse. */
export function giveGift(s: GameState, id: FeelId): GiftResult {
  if (s.giftDay[id] === s.day) return 'already';
  s.giftDay[id] = s.day;
  if (feel(s, id) < 40) {
    adjustFeel(s, id, TUNING.feelings.giftBadDelta);
    return 'cold';
  }
  if (feel(s, id) >= 60) adjustFeel(s, id, TUNING.feelings.giftGoodDelta);
  return 'warm';
}
