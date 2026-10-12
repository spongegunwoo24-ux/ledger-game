import { TUNING } from '../config/tuning';
import type { FeelId, GroundId, Segment } from './types';

export const SAVE_VERSION = 3;

export type FlagValue = boolean | number | string;

/** [변경 2] one fish kept on ice */
export interface HeldFish {
  uid: number;
  id: string;
  inches: number;
  /** day it was caught (a day on ice lowers the price) */
  day: number;
}

export interface CatchHold {
  /** pounds */
  small: number;
  medium: number;
  large: number;
  /** count */
  crabs: number;
  /** [변경 2] fish on ice, one entry per fish (sold one by one from the inventory) */
  fish: HeldFish[];
  golden: number;
  /** combo + freshness bonus in dollars, paid with the sale */
  bonus: number;
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
  /** [변경 1] minutes since midnight (04:00 = 240) */
  time: number;
  /** amount paid toward the debt since last Friday (includes prepayments) */
  paidThisWeek: number;
  /** late fees added to the debt so far */
  fees: number;
  /** Friday shortfalls this season (2 = repossession) */
  shortfalls: number;
  /** a Friday shortfall to be paid (with fee) by Monday 17:00 */
  overdue: { amount: number; deadlineDay: number } | null;
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
  /** [변경 1] bait counts by bait id */
  bait: Record<string, number>;
  /** caught fish records: species id → { count, best size in inches } */
  fishLog: Record<string, { count: number; best: number; firstDay: number }>;
  /** quest id shown large in the tracker */
  trackedQuest: string | null;
  /** "지난 이야기": event ids already seen or skipped, with day */
  story: { id: string; day: number; skipped: boolean }[];
  /** times Ledger was fed today/treated (guide accuracy) */
  ledgerFed: number;
  /** sorting combo best (for fun stats) */
  bestCombo: number;
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
    time: 10 * 60,
    paidThisWeek: 0,
    fees: 0,
    shortfalls: 0,
    overdue: null,
    payments: [],
    hold: { small: 0, medium: 0, large: 0, crabs: 0, fish: [], golden: 0, bonus: 0 },
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
    bait: { shrimp: 10 },
    fishLog: {},
    trackedQuest: null,
    story: [],
    ledgerFed: 0,
    bestCombo: 0,
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
  return h.small + h.medium + h.large + h.crabs + h.fish.length + h.golden <= 0;
}

export function hasItem(s: GameState, id: string): boolean {
  return (s.items[id] ?? 0) > 0;
}

export function owns(s: GameState, shopId: string): boolean {
  return (s.purchases[shopId] ?? 0) > 0;
}
