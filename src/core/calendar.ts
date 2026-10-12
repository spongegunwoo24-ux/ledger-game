import { TUNING } from '../config/tuning';
import { hashFloat } from './rng';
import type { Moon, Segment, Tide, Weather } from './types';

export const SEASON_DAYS = TUNING.season.days;

const WEEKDAY_NAMES = ['토', '일', '월', '화', '수', '목', '금'] as const;
export type WeekdayName = (typeof WEEKDAY_NAMES)[number];

/** 0 = Saturday … 6 = Friday. Day 1 is a Saturday. */
export function weekdayIndex(day: number): number {
  return (((day - 1) % 7) + 7) % 7;
}

export function weekdayName(day: number): WeekdayName {
  return WEEKDAY_NAMES[weekdayIndex(day)];
}

export function weekOf(day: number): number {
  return Math.ceil(day / 7);
}

export const isSaturday = (day: number) => weekdayIndex(day) === 0;
export const isSunday = (day: number) => weekdayIndex(day) === 1;
export const isMonday = (day: number) => weekdayIndex(day) === 2;
export const isFriday = (day: number) => weekdayIndex(day) === 6;

/** Friday payment days are Days 7…63 (no payment in week 10). */
export function isPaymentDay(day: number): boolean {
  return isFriday(day) && weekOf(day) <= TUNING.debt.lastPaymentWeek;
}

export function paymentDueForWeek(week: number): number {
  if (week < 1 || week > TUNING.debt.lastPaymentWeek) return 0;
  return week === 1 ? TUNING.debt.week1Due : TUNING.debt.weeklyDue;
}

/** Total that should have been paid by the end of the given week. */
export function cumulativeDue(week: number): number {
  let sum = 0;
  for (let w = 1; w <= Math.min(week, TUNING.debt.lastPaymentWeek); w++) sum += paymentDueForWeek(w);
  return sum;
}

const MOONS: Moon[] = ['초승', '상현', '보름', '하현'];

/** The moon runs a compressed ~7 day cycle so every phase shows up each week. */
export function moonOf(day: number): Moon {
  const t = (day - 1) % 7;
  return MOONS[Math.min(3, Math.floor(t / 1.75))];
}

export function tideOf(day: number, seed: number): Tide {
  return hashFloat(seed, 'tide', day) < 0.5 ? '밀물' : '썰물';
}

export function weatherOf(day: number, seed: number): Weather {
  if (day === 67) return '폭풍';
  if (day >= 64 && day <= 66) return day === 66 ? '바람' : '흐림';
  // Day 1 must be bright for the funeral contrast, Day 34 is the festival.
  if (day === 1 || day === 34) return '맑음';
  const r = hashFloat(seed, 'weather', day);
  if (r < 0.5) return '맑음';
  if (r < 0.74) return '흐림';
  if (r < 0.88) return '비';
  return '바람';
}

export const SEGMENT_LABEL: Record<Segment, string> = {
  dawn: '새벽',
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
  night: '밤',
};

export const SEGMENT_CLOCK: Record<Segment, string> = {
  dawn: '04:00',
  morning: '09:00',
  afternoon: '13:00',
  evening: '19:00',
  night: '23:00',
};

export function dayLabel(day: number): string {
  return `${weekOf(day)}주차 ${day}일째 (${weekdayName(day)})`;
}

export type Phase = '장례' | '바다' | '선단 축복제' | '균열' | '거스' | '의심' | '심리' | '그 자리';

export function phaseOf(day: number): Phase {
  const w = weekOf(day);
  if (w <= 1) return '장례';
  if (w <= 4) return '바다';
  if (w === 5) return '선단 축복제';
  if (w === 6) return '균열';
  if (w === 7) return '거스';
  if (w === 8) return '의심';
  if (w === 9) return '심리';
  return '그 자리';
}
