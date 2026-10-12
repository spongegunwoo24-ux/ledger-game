// All tunable numbers from docs/DESIGN.md live here. Change values here only.

export const TUNING = {
  season: {
    days: 70,
    weeks: 10,
    firstDayWeekday: 'sat',
  },

  debt: {
    total: 4250,
    week1Due: 250,
    weeklyDue: 500,
    lastPaymentWeek: 9,
    repossessZeroFridays: 3,
  },

  prices: {
    small: 1.0,
    medium: 1.6,
    large: 2.6,
    crab: 1.5,
    marketMultiplier: 2,
    rosaMultiplier: 2,
    rosaMaxLbsPerDay: 30,
    canneryOversupplyLbs: 450,
    canneryOversupplyMult: 0.8,
  },

  costs: {
    fuel: 5,
    netRepair: 40,
  },

  gusCan: {
    amount: 150,
    firstDay: 7,
    lastDay: 42,
    thresholdRatio: 0.5,
  },

  // Trawl
  trawl: {
    // seconds for the catch curve to reach ~63% of max
    tau: 42,
    goodTowMin: 60,
    goodTowMax: 90,
    // snag chance per second, multiplied by (t / snagRampSeconds), after snagGraceSeconds
    snagGraceSeconds: 25,
    snagRampSeconds: 60,
    snagHaulLossMin: 0.3,
    snagHaulLossMax: 0.6,
    tornNetYieldMult: 0.55,
    goodWinchHaulMult: 1.8,
    // max items that can appear on deck from one tow (performance + sorting time)
    maxItemsPerTow: 70,
    lbsPerShrimpItem: 1.3,
  },

  sorting: {
    ledgerStealIntervalMs: 8000,
    ledgerFedGraceMs: 8000,
    gusPickIntervalMs: 1150,
    gusShare: 0.5,
    sortingTableShare: 0.3,
    turtleFine: 20,
    turtleFishermenFeel: -3,
  },

  feelings: {
    giftGoodDelta: 2,
    giftBadDelta: -3,
  },

  afternoon: {
    slots: 2,
    slotsWithTruck: 3,
  },

  letters: {
    perEvening: 1,
    perSunday: 2,
  },
} as const;

export type SnagRisk = 'veryLow' | 'low' | 'medium' | 'high';

export const SNAG_PER_SECOND: Record<SnagRisk, number> = {
  veryLow: 0.0012,
  low: 0.0025,
  medium: 0.0045,
  high: 0.0085,
};
