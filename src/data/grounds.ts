import type { SnagRisk } from '../config/tuning';
import type { GroundId, Moon, Tide, Weather } from '../core/types';
import { GROUND_NAMES } from './groundNames';

export interface GroundDef {
  id: GroundId;
  name: string;
  /** one-line character shown on the sea map */
  blurb: string;
  /** condition text shown only after the tip is learned */
  bestText: string;
  /** shrimp items on deck for a full-curve tow in neutral conditions */
  baseShrimp: number;
  sizeMix: { small: number; medium: number; large: number };
  crabs: [number, number];
  snag: SnagRisk;
  /** position on the sea map (1280×720) */
  pos: { x: number; y: number };
}

export const GROUNDS: GroundDef[] = [
  {
    id: 'oyster',
    name: GROUND_NAMES.oyster,
    blurb: '중간 크기 새우가 꾸준하다.',
    bestText: '썰물, 보름',
    baseShrimp: 64,
    sizeMix: { small: 0.35, medium: 0.5, large: 0.15 },
    crabs: [1, 3],
    snag: 'low',
    pos: { x: 360, y: 520 },
  },
  {
    id: 'sandbar',
    name: GROUND_NAMES.sandbar,
    blurb: '잔챙이가 아주 많다. 걸릴 일은 거의 없다.',
    bestText: '밀물',
    baseShrimp: 80,
    sizeMix: { small: 0.7, medium: 0.25, large: 0.05 },
    crabs: [0, 2],
    snag: 'veryLow',
    pos: { x: 560, y: 600 },
  },
  {
    id: 'wreck',
    name: GROUND_NAMES.wreck,
    blurb: '큰 새우가 많다. 그물이 잘 걸린다.',
    bestText: '흐린 날',
    baseShrimp: 58,
    sizeMix: { small: 0.15, medium: 0.4, large: 0.45 },
    crabs: [0, 2],
    snag: 'high',
    pos: { x: 840, y: 470 },
  },
  {
    id: 'river',
    name: GROUND_NAMES.river,
    blurb: '게가 많고 새우는 섞여 나온다.',
    bestText: '비 온 다음 날',
    baseShrimp: 48,
    sizeMix: { small: 0.4, medium: 0.45, large: 0.15 },
    crabs: [5, 9],
    snag: 'medium',
    pos: { x: 230, y: 300 },
  },
  {
    id: 'channel',
    name: GROUND_NAMES.channel,
    blurb: '적게 잡히지만 거의 다 큰 놈이다.',
    bestText: '바람 없는 날',
    baseShrimp: 40,
    sizeMix: { small: 0.05, medium: 0.35, large: 0.6 },
    crabs: [0, 1],
    snag: 'medium',
    pos: { x: 1050, y: 590 },
  },
  {
    id: 'gusSpot',
    name: GROUND_NAMES.gusSpot,
    blurb: '거스가 아는 자리. 뭐든 잘 나온다.',
    bestText: '언제나',
    baseShrimp: 74,
    sizeMix: { small: 0.25, medium: 0.45, large: 0.3 },
    crabs: [1, 3],
    snag: 'low',
    pos: { x: 700, y: 330 },
  },
  {
    id: 'theSpot',
    name: GROUND_NAMES.theSpot,
    blurb: '아버지가 X를 그어 둔 자리.',
    bestText: '—',
    baseShrimp: 0,
    sizeMix: { small: 0.3, medium: 0.4, large: 0.3 },
    crabs: [0, 0],
    snag: 'low',
    pos: { x: 1040, y: 220 },
  },
];

export function groundDef(id: GroundId): GroundDef {
  const g = GROUNDS.find((x) => x.id === id);
  if (!g) throw new Error(`unknown ground ${id}`);
  return g;
}

export interface Conditions {
  tide: Tide;
  moon: Moon;
  weather: Weather;
  rainedYesterday: boolean;
}

/** Multiplier on shrimp yield for a ground under the day's conditions. */
export function conditionMultiplier(id: GroundId, c: Conditions): number {
  let m = 1;
  switch (id) {
    case 'oyster':
      if (c.tide === '썰물') m *= 1.15;
      if (c.moon === '보름') m *= 1.2;
      break;
    case 'sandbar':
      m *= c.tide === '밀물' ? 1.25 : 0.9;
      break;
    case 'wreck':
      m *= c.weather === '흐림' ? 1.3 : 0.95;
      break;
    case 'river':
      m *= c.rainedYesterday ? 1.35 : 0.95;
      break;
    case 'channel':
      m *= c.weather === '바람' ? 0.7 : 1.15;
      break;
    default:
      break;
  }
  if (c.weather === '비') m *= 0.95;
  if (c.weather === '바람' && id !== 'channel') m *= 0.92;
  return m;
}

export function isBest(id: GroundId, c: Conditions): boolean {
  switch (id) {
    case 'oyster':
      return c.tide === '썰물' && c.moon === '보름';
    case 'sandbar':
      return c.tide === '밀물';
    case 'wreck':
      return c.weather === '흐림';
    case 'river':
      return c.rainedYesterday;
    case 'channel':
      return c.weather !== '바람';
    case 'gusSpot':
      return true;
    default:
      return false;
  }
}
