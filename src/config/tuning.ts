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
    /** a Friday shortfall must be paid by Monday 17:00 with this late fee */
    lateFee: 0.1,
    /** second Friday shortfall in the season = repossession */
    maxShortfalls: 2,
  },

  /** [변경 1] day clock. Minutes since midnight; speeds in game minutes per real second. */
  clock: {
    wake: 4 * 60,
    seaEnd: 8 * 60,
    afternoon: 9 * 60,
    payDeadline: 17 * 60,
    dusk: 19 * 60,
    night: 23 * 60,
    seaSpeed: 1,
    landSpeed: 2,
    /** minutes of sailing per 100 px on the sea map */
    sailPer100px: 6,
    /** minutes of walking per 100 px on the town map (interim until M2) */
    walkPer100px: 9,
  },

  prices: {
    small: 1.0,
    medium: 1.6,
    large: 2.6,
    crab: 1.5,
    goldenShrimp: 30,
    marketMultiplier: 1.5,
    rosaMultiplier: 1.6,
    rosaMaxLbsPerDay: 30,
    canneryOversupplyLbs: 450,
    canneryOversupplyMult: 0.8,
    /** [변경 2] each day a fish spends on ice takes this share off its price, down to the floor */
    stalePerDay: 0.25,
    staleFloor: 0.5,
  },

  costs: {
    /** [변경 2] diesel for one trip out (was $5) */
    fuel: 12,
    netRepair: 40,
    /** [변경 2] food, power and water, paid every night */
    living: 8,
  },

  gusCan: {
    amount: 150,
    firstDay: 1,
    lastDay: 44,
  },

  // Net (game minutes; at sea 1 real second = 1 game minute)
  trawl: {
    /** minutes for the net to fill to its capacity */
    netFullMinutes: 75,
    goodTowMin: 55,
    goodTowMax: 85,
    // snag chance per minute, multiplied by ((t - grace) / ramp)
    snagGraceMinutes: 20,
    snagRampMinutes: 50,
    snagHaulLossMin: 0.3,
    snagHaulLossMax: 0.6,
    tornNetYieldMult: 0.55,
    goodWinchHaulMult: 1.8,
    // max items that can appear on deck from one tow (performance + sorting time)
    maxItemsPerTow: 70,
    lbsPerShrimpItem: 0.25,
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

  /** [변경 1] rod fishing */
  fishing: {
    baitSpeed: 230,
    sinkSpeed: 45,
    /** px below the surface the line reaches (long line upgrade adds more) */
    lineLength: 330,
    longLineExtra: 120,
    perfectWindow: 0.3,
    goodWindow: 0.7,
    maxFish: 13,
    spawnEverySec: 1.6,
    fight: { rare: 3, veryRare: 4, legendary: 9 },
  },

  /** [변경 2] lowered (was +1% per step, max 25%, fresh +8% / +4%) */
  combo: {
    perStep: 0.006,
    max: 0.15,
    fresh1Sec: 20,
    fresh1: 0.05,
    fresh2Sec: 40,
    fresh2: 0.02,
  },

  letters: {
    perEvening: 1,
    perSunday: 2,
  },
} as const;

export type SnagRisk = 'veryLow' | 'low' | 'medium' | 'high';

export const SNAG_PER_MINUTE: Record<SnagRisk, number> = {
  veryLow: 0.0012,
  low: 0.0025,
  medium: 0.0045,
  high: 0.0085,
};
