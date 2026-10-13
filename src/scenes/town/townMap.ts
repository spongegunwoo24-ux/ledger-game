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

/** [변경 2] the creek on the west side (riverbank fishing spot) */
export const CREEK: [number, number][] = [
  [0, 600],
  [120, 680],
  [165, 800],
  [130, 1000],
  [95, 1300],
];

function distToPolyline(x: number, y: number, pts: [number, number][]): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const len2 = (x1 - x0) ** 2 + (y1 - y0) ** 2;
    const t = Math.max(0, Math.min(1, ((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / len2));
    best = Math.min(best, Math.hypot(x - (x0 + t * (x1 - x0)), y - (y0 + t * (y1 - y0))));
  }
  return best;
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
  if (distToPolyline(x, y, CREEK) < 46) return false;
  for (const s of SPOTS) {
    if (!s.hw) continue;
    if (x > s.x - s.hw - FOOT && x < s.x + s.hw + FOOT && y > s.y - s.hh - FOOT && y < s.y + FOOT) return false;
  }
  return true;
}

/** [변경 2] grid pathfinding (A*, 8 directions) so tap-to-walk and map travel go around buildings and water */
const CELL = 32;
const GW = Math.ceil(WORLD.w / CELL);
const GH = Math.ceil(WORLD.h / CELL);
let grid: Uint8Array | null = null;

function walkGrid(): Uint8Array {
  if (grid) return grid;
  grid = new Uint8Array(GW * GH);
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) grid[gy * GW + gx] = walkable(gx * CELL + CELL / 2, gy * CELL + CELL / 2) ? 1 : 0;
  return grid;
}

function nearestOpen(gx: number, gy: number): [number, number] | null {
  const g = walkGrid();
  for (let r = 0; r < 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = gx + dx;
        const y = gy + dy;
        if (x >= 0 && y >= 0 && x < GW && y < GH && g[y * GW + x]) return [x, y];
      }
    }
  }
  return null;
}

/** waypoints from a to b (world coords), ending exactly at b; [] if unreachable */
export function findPath(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number }[] {
  const g = walkGrid();
  const s0 = nearestOpen(Math.floor(a.x / CELL), Math.floor(a.y / CELL));
  const t0 = nearestOpen(Math.floor(b.x / CELL), Math.floor(b.y / CELL));
  if (!s0 || !t0) return [];
  const start = s0[1] * GW + s0[0];
  const goal = t0[1] * GW + t0[0];
  const gScore = new Float32Array(GW * GH).fill(Infinity);
  const came = new Int32Array(GW * GH).fill(-1);
  const closed = new Uint8Array(GW * GH);
  const open: number[] = [start];
  const f = new Float32Array(GW * GH).fill(Infinity);
  const h = (i: number) => Math.hypot((i % GW) - t0[0], Math.floor(i / GW) - t0[1]);
  gScore[start] = 0;
  f[start] = h(start);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur === goal) break;
    closed[cur] = 1;
    const cx = cur % GW;
    const cy = Math.floor(cur / GW);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const ni = ny * GW + nx;
        if (!g[ni] || closed[ni]) continue;
        // no corner cutting
        if (dx && dy && (!g[cy * GW + nx] || !g[ny * GW + cx])) continue;
        const ng = gScore[cur] + (dx && dy ? Math.SQRT2 : 1);
        if (ng < gScore[ni]) {
          gScore[ni] = ng;
          came[ni] = cur;
          f[ni] = ng + h(ni);
          if (!open.includes(ni)) open.push(ni);
        }
      }
    }
  }
  if (came[goal] === -1 && goal !== start) return [];
  const cells: number[] = [];
  for (let c = goal; c !== -1 && c !== start; c = came[c]) cells.push(c);
  cells.reverse();
  // keep only turning points
  const pts: { x: number; y: number }[] = [];
  let prevDir = '';
  cells.forEach((c, i) => {
    const prev = i === 0 ? start : cells[i - 1];
    const dir = `${(c % GW) - (prev % GW)},${Math.floor(c / GW) - Math.floor(prev / GW)}`;
    const p = { x: (c % GW) * CELL + CELL / 2, y: Math.floor(c / GW) * CELL + CELL / 2 };
    if (dir !== prevDir && i > 0) pts.push({ x: (prev % GW) * CELL + CELL / 2, y: Math.floor(prev / GW) * CELL + CELL / 2 });
    prevDir = dir;
    if (i === cells.length - 1) pts.push(p);
  });
  pts.push({ x: b.x, y: b.y });
  return pts;
}
