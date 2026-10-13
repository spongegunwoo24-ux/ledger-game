import type { LocId } from '../../core/types';

/**
 * [변경 2] The walkable afternoon town (DESIGN §5.2). World coordinates; the screen shows 1280×720 of it.
 * Building positions follow the old node map ×2 so the town keeps the same geography.
 */
export const WORLD = { w: 2560, h: 1440 };

export type BuildingStyle = 'house' | 'diner' | 'church' | 'bank' | 'office' | 'shop' | 'lighthouse' | 'pier' | 'dunes' | 'board' | 'closed' | 'home';

export interface TownSpot {
  loc: LocId;
  /** base (front middle) of the building */
  x: number;
  y: number;
  style: BuildingStyle;
  color: number;
  /** collision box half width / height above the base */
  hw: number;
  hh: number;
}

export const SPOTS: TownSpot[] = [
  { loc: 'home', x: 340, y: 520, style: 'home', color: 0xffc7a8, hw: 95, hh: 105 },
  { loc: 'secondhand', x: 840, y: 380, style: 'shop', color: 0xc9b6e4, hw: 95, hh: 100 },
  { loc: 'diner', x: 1120, y: 690, style: 'diner', color: 0xff8b94, hw: 110, hh: 100 },
  { loc: 'church', x: 1520, y: 420, style: 'church', color: 0xfff3d6, hw: 90, hh: 120 },
  { loc: 'pharmacy', x: 2120, y: 500, style: 'closed', color: 0xd9d4e3, hw: 90, hh: 100 },
  { loc: 'lighthouse', x: 2330, y: 270, style: 'lighthouse', color: 0xfffaf0, hw: 45, hh: 60 },
  { loc: 'gusHouse', x: 480, y: 880, style: 'house', color: 0xb9c8d8, hw: 85, hh: 95 },
  { loc: 'bank', x: 1330, y: 900, style: 'bank', color: 0xe8e1d0, hw: 105, hh: 105 },
  { loc: 'sheriff', x: 1800, y: 740, style: 'office', color: 0xd8b98a, hw: 100, hh: 100 },
  { loc: 'calvinCabin', x: 2300, y: 830, style: 'house', color: 0x9fd69a, hw: 85, hh: 95 },
  { loc: 'dunes', x: 260, y: 1210, style: 'dunes', color: 0xf5e3b3, hw: 0, hh: 0 },
  { loc: 'dock', x: 660, y: 1170, style: 'pier', color: 0xc99a6b, hw: 0, hh: 0 },
  { loc: 'fishMarket', x: 960, y: 1210, style: 'shop', color: 0xa6e1ea, hw: 100, hh: 95 },
  { loc: 'board', x: 1530, y: 1130, style: 'board', color: 0xc99a6b, hw: 60, hh: 30 },
  { loc: 'edithHouse', x: 1820, y: 1250, style: 'house', color: 0xe2bf8f, hw: 85, hh: 95 },
  { loc: 'pawn', x: 2040, y: 1070, style: 'shop', color: 0xffe29a, hw: 95, hh: 95 },
];

export function spotOf(loc: LocId): TownSpot | undefined {
  return SPOTS.find((s) => s.loc === loc);
}

/** where Eli stands to go in */
export function doorOf(sp: TownSpot): { x: number; y: number } {
  if (sp.style === 'pier') return { x: sp.x, y: sp.y - 30 };
  if (sp.style === 'dunes' || sp.style === 'board') return { x: sp.x, y: sp.y + 40 };
  return { x: sp.x, y: sp.y + 34 };
}

/** coastline: sea is below this y (bottom of the map) */
const COAST: [number, number][] = [
  [0, 1290],
  [300, 1320],
  [560, 1250],
  [820, 1320],
  [1200, 1390],
  [2560, 1395],
];

export function coastY(x: number): number {
  for (let i = 1; i < COAST.length; i++) {
    const [x0, y0] = COAST[i - 1];
    const [x1, y1] = COAST[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return COAST[COAST.length - 1][1];
}

export function coastline(): [number, number][] {
  return COAST;
}

/** the north-east bay by the lighthouse */
export const BAY: [number, number][] = [
  [2180, 0],
  [2560, 0],
  [2560, 360],
  [2470, 330],
  [2420, 200],
  [2300, 90],
];

export const ROADS: [number, number][][] = [
  [
    [340, 560],
    [840, 420],
    [1120, 730],
    [1520, 460],
    [2120, 540],
    [2330, 310],
  ],
  [
    [480, 920],
    [1120, 730],
    [1330, 940],
    [1800, 780],
    [2300, 870],
  ],
  [
    [260, 1240],
    [660, 1150],
    [960, 1250],
    [1330, 940],
    [1530, 1170],
    [1820, 1290],
    [2040, 1110],
  ],
];

function inPoly(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export const EDGE = 40;
const FOOT = 14;

/** Can Eli's feet stand here? (inside the map, not in the sea, not inside a building; the pier is walkable) */
export function walkable(x: number, y: number): boolean {
  if (x < EDGE || x > WORLD.w - EDGE || y < 120 || y > WORLD.h - EDGE) return false;
  const pier = spotOf('dock')!;
  const onPier = Math.abs(x - pier.x) < 34 && y > pier.y - 40 && y < pier.y + 210;
  if (!onPier && y > coastY(x) - 18) return false;
  if (inPoly(x, y, BAY)) return false;
  for (const s of SPOTS) {
    if (!s.hw) continue;
    if (x > s.x - s.hw - FOOT && x < s.x + s.hw + FOOT && y > s.y - s.hh - FOOT && y < s.y + FOOT) return false;
  }
  return true;
}
