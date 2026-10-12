import { TUNING } from '../config/tuning';
import type { FeelId, GroundId, Segment } from './types';

export const SAVE_VERSION = 1;

export type FlagValue = boolean | number | string;

export interface CatchHold {
  /** pounds */
  small: number;
  medium: number;
  large: number;
  /** count */
  crabs: number;
}

export interface DayStats {
  earned: number;
  lbsCaught: number;
  stolen: number;
  trips: number;
  turtlesSaved: number;
  bycatchFed: number;
}

export interface WeekStats extends DayStats {
  paid: number;
  canneryLbs: number;
  spent: number;
}

export interface QuestState {
  state: 'active' | 'done';
  step: number;
  /** generic counter for repeat steps (e.g. 3 ice deliveries) */
  progress: number;
  startedDay: number;
  /** last day a step was advanced, so "next day" steps can wait */
  lastDay: number;
}

export interface PaymentRecord {
  day: number;
  due: number;
  paid: number;
  short: number;
}

export interface GameState {
  version: number;
  seed: number;
  day: number;
  segment: Segment;
  money: number;
  debt: number;
  /** amount paid toward the debt since last Friday (includes prepayments) */
  paidThisWeek: number;
  zeroStreak: number;
  extensionUsed: boolean;
  payments: PaymentRecord[];
  hold: CatchHold;
  flags: Record<string, FlagValue>;
  feelings: Record<FeelId, number>;
  /** last day a gift was given per NPC */
  giftDay: Partial<Record<FeelId, number>>;
  quests: Record<string, QuestState>;
  lettersRead: number[];
  lettersBurned: number[];
  lettersToday: number;
  evidence: string[];
  rewritten: string[];
  items: Record<string, number>;
  curiosities: string[];
  purchases: Record<string, number>;
  decor: Record<string, string>;
  deckWear: number;
  netTorn: boolean;
  slotsUsed: number;
  eventsDone: string[];
  logbook: string[];
  logbookStruck: string[];
  tips: GroundId[];
  calvinMemory: string[];
  today: DayStats;
  week: WeekStats;
  totals: { earned: number; stolen: number; lbs: number; turtlesSaved: number };
  theSpotAttempts: number;
}

export const FEELING_START: Record<FeelId, number> = {
  rosa: 5,
  webbs: 0,
  lucia: 0,
  fishermen: 25,
  kids: 10,
  maisie: 30,
  joanne: 30,
  gus: 25,
  matthew: 65,
  nora: 45,
  mabel: 30,
  hank: 25,
  priya: 60,
  toby: 70,
  dunbar: 40,
  pike: 45,
  calvin: 90,
  ada: 40,
};

export function emptyDayStats(): DayStats {
  return { earned: 0, lbsCaught: 0, stolen: 0, trips: 0, turtlesSaved: 0, bycatchFed: 0 };
}

export function emptyWeekStats(): WeekStats {
  return { ...emptyDayStats(), paid: 0, canneryLbs: 0, spent: 0 };
}

export function newGame(seed = Math.floor(Math.random() * 1e9)): GameState {
  return {
    version: SAVE_VERSION,
    seed,
    day: 1,
    segment: 'morning',
    money: 40,
    debt: TUNING.debt.total,
    paidThisWeek: 0,
    zeroStreak: 0,
    extensionUsed: false,
    payments: [],
    hold: { small: 0, medium: 0, large: 0, crabs: 0 },
    flags: {},
    feelings: { ...FEELING_START },
    giftDay: {},
    quests: {},
    lettersRead: [],
    lettersBurned: [],
    lettersToday: 0,
    evidence: [],
    rewritten: [],
    items: {},
    curiosities: [],
    purchases: {},
    decor: {},
    deckWear: 0,
    netTorn: false,
    slotsUsed: 0,
    eventsDone: [],
    logbook: [],
    logbookStruck: [],
    tips: [],
    calvinMemory: [],
    today: emptyDayStats(),
    week: emptyWeekStats(),
    totals: { earned: 0, stolen: 0, lbs: 0, turtlesSaved: 0 },
    theSpotAttempts: 0,
  };
}

export function cloneState(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}

export function flag(s: GameState, key: string): FlagValue | undefined {
  return s.flags[key];
}

export function hasFlag(s: GameState, key: string): boolean {
  const v = s.flags[key];
  return v !== undefined && v !== false && v !== 0 && v !== '';
}

export function setFlag(s: GameState, key: string, value: FlagValue = true): void {
  s.flags[key] = value;
}

export function holdIsEmpty(h: CatchHold): boolean {
  return h.small + h.medium + h.large + h.crabs <= 0;
}

export function hasItem(s: GameState, id: string): boolean {
  return (s.items[id] ?? 0) > 0;
}

export function owns(s: GameState, shopId: string): boolean {
  return (s.purchases[shopId] ?? 0) > 0;
}
