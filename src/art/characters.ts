import type Phaser from 'phaser';
import { PALETTE, SHADE } from './palette';
import { bake, Pen } from './pen';

/**
 * Procedural chibi characters (big head, small body, thick soft outline).
 * Each character is recognizable by silhouette + one signature item (DESIGN §4.3).
 */

type HairStyle = 'messy' | 'bun' | 'short' | 'side' | 'bob' | 'pigtails' | 'long' | 'cap' | 'none' | 'thin' | 'curly';
type TopStyle =
  | 'hoodie'
  | 'oilskin'
  | 'vest'
  | 'uniform'
  | 'apron'
  | 'clerical'
  | 'coat'
  | 'sheriff'
  | 'stripe'
  | 'tee'
  | 'dress'
  | 'blouse'
  | 'suit'
  | 'cardigan'
  | 'flannel';
type Hat = 'beanie' | 'bucket' | 'cowboy' | 'beret' | 'trucker' | 'captain' | 'ranger' | 'none';

export interface CharSpec {
  skin: number;
  hair: number;
  hairStyle: HairStyle;
  top: number;
  top2?: number;
  topStyle: TopStyle;
  pants: number;
  shoes: number;
  hat?: Hat;
  hatColor?: number;
  glasses?: boolean;
  beard?: number;
  eyes?: 'dot' | 'closed' | 'tired' | 'wide';
  mouth?: 'smile' | 'flat' | 'grin' | 'small' | 'o';
  /** 0 = upright, 1 = slouched */
  slouch?: number;
  /** body width multiplier */
  wide?: number;
  /** head size multiplier */
  head?: number;
  /** overall height multiplier (kids < 1) */
  height?: number;
  extra?: ('camera' | 'coffeepot' | 'badge' | 'buckle' | 'stethoscope' | 'tie' | 'pearls' | 'cane' | 'notepad')[];
}

export const CHAR_SPECS: Record<string, CharSpec> = {
  eli: {
    skin: SHADE.skin,
    hair: SHADE.hairBrown,
    hairStyle: 'messy',
    top: 0xa9a6b5,
    top2: 0x8f8c9e,
    topStyle: 'hoodie',
    pants: 0x5f6f94,
    shoes: 0xe9e4f0,
    eyes: 'tired',
    mouth: 'flat',
    slouch: 1,
  },
  gus: {
    skin: 0xf2c3a0,
    hair: SHADE.hairGrey,
    hairStyle: 'none',
    top: 0x6d7fa8,
    top2: SHADE.oilskin,
    topStyle: 'oilskin',
    pants: SHADE.oilskin,
    shoes: 0x56506b,
    hat: 'beanie',
    hatColor: 0xe0505a,
    beard: 0xfaf7f2,
    eyes: 'dot',
    mouth: 'flat',
    wide: 1.1,
  },
  calvin: {
    skin: SHADE.skin,
    hair: 0xb59a7a,
    hairStyle: 'short',
    top: 0xf6f1e4,
    top2: SHADE.tan,
    topStyle: 'vest',
    pants: 0x8a9a7a,
    shoes: 0x7a5a42,
    hat: 'bucket',
    hatColor: 0xd9c9a3,
    glasses: true,
    eyes: 'closed',
    mouth: 'smile',
  },
  toby: {
    skin: 0xffdcc4,
    hair: 0xe0a85a,
    hairStyle: 'short',
    top: SHADE.khaki,
    top2: 0xa8975e,
    topStyle: 'uniform',
    pants: 0x8f8456,
    shoes: 0x4a3f3a,
    eyes: 'wide',
    mouth: 'o',
    head: 1.08,
    extra: ['badge'],
  },
  rosa: {
    skin: 0xe7b48f,
    hair: SHADE.hairDark,
    hairStyle: 'bun',
    top: 0x5b8fbf,
    top2: 0xfffaf0,
    topStyle: 'apron',
    pants: 0x46506e,
    shoes: 0x3b3355,
    eyes: 'dot',
    mouth: 'flat',
    extra: ['coffeepot'],
  },
  matthew: {
    skin: SHADE.skin,
    hair: 0x8a8296,
    hairStyle: 'side',
    top: SHADE.black,
    top2: 0xffffff,
    topStyle: 'clerical',
    pants: SHADE.black,
    shoes: 0x2a2535,
    eyes: 'dot',
    mouth: 'small',
  },
  nora: {
    skin: 0xffdcc4,
    hair: 0xc4683f,
    hairStyle: 'bob',
    top: 0xfff3d6,
    top2: 0x6cc4d6,
    topStyle: 'stripe',
    pants: 0x3d5a80,
    shoes: 0xb04a52,
    hat: 'beret',
    hatColor: 0xd7505a,
    eyes: 'wide',
    mouth: 'smile',
    extra: ['camera'],
  },
  dunbar: {
    skin: 0xf0b896,
    hair: 0x9a8a7a,
    hairStyle: 'short',
    top: 0xd9b77e,
    top2: 0x8a5a3a,
    topStyle: 'sheriff',
    pants: 0x5a4a3a,
    shoes: 0x5a3a2a,
    hat: 'cowboy',
    hatColor: 0xb98a55,
    eyes: 'dot',
    mouth: 'grin',
    wide: 1.25,
    extra: ['buckle', 'badge'],
  },
  pike: {
    skin: 0xf6e0d0,
    hair: 0x6d6a7a,
    hairStyle: 'thin',
    top: 0xfdfdfd,
    top2: 0x9fb7c9,
    topStyle: 'coat',
    pants: 0x5d6475,
    shoes: 0x3b3355,
    glasses: false,
    eyes: 'tired',
    mouth: 'small',
    wide: 0.82,
    slouch: 1,
    extra: ['stethoscope'],
  },
  walt: {
    skin: 0xf0bf9a,
    hair: 0x9b8e86,
    hairStyle: 'short',
    top: 0x4f6d8f,
    top2: 0x3d5570,
    topStyle: 'flannel',
    pants: 0x56506b,
    shoes: 0x4a3f3a,
    hat: 'captain',
    hatColor: 0xfffaf0,
    beard: 0xb7aba2,
    eyes: 'dot',
    mouth: 'flat',
    wide: 1.12,
  },
  maisie: {
    skin: 0xffe0cc,
    hair: 0xf2c46b,
    hairStyle: 'pigtails',
    top: 0xffb3c1,
    top2: 0xffffff,
    topStyle: 'dress',
    pants: 0xffe0cc,
    shoes: 0xd7505a,
    eyes: 'wide',
    mouth: 'grin',
    height: 0.78,
    head: 1.05,
  },
  joanne: {
    skin: 0xffdcc4,
    hair: 0xd9a75a,
    hairStyle: 'long',
    top: 0xa8e6cf,
    top2: 0xffffff,
    topStyle: 'blouse',
    pants: 0x6d7fa8,
    shoes: 0x7a5a42,
    eyes: 'dot',
    mouth: 'small',
  },
  hank: {
    skin: 0xe6a982,
    hair: SHADE.hairGrey,
    hairStyle: 'thin',
    top: 0xd95f4f,
    top2: 0x9c3f35,
    topStyle: 'flannel',
    pants: 0x56506b,
    shoes: 0x4a3f3a,
    hat: 'trucker',
    hatColor: 0x4f8f6f,
    beard: 0xe6e1e8,
    eyes: 'tired',
    mouth: 'flat',
  },
  dewey: {
    skin: 0xc98b65,
    hair: SHADE.hairDark,
    hairStyle: 'short',
    top: 0x5a8fb0,
    top2: 0x3f6f8f,
    topStyle: 'tee',
    pants: 0x46506e,
    shoes: 0x3b3355,
    hat: 'trucker',
    hatColor: 0xffd45e,
    eyes: 'dot',
    mouth: 'grin',
    wide: 1.15,
  },
  priya: {
    skin: 0xc98d66,
    hair: SHADE.hairDark,
    hairStyle: 'long',
    top: 0xc9b6e4,
    top2: 0x3b3355,
    topStyle: 'blouse',
    pants: 0x46506e,
    shoes: 0x3b3355,
    glasses: false,
    eyes: 'dot',
    mouth: 'small',
  },
  cole: {
    skin: SHADE.skin,
    hair: 0x8a8296,
    hairStyle: 'side',
    top: 0x56607a,
    top2: 0xd7505a,
    topStyle: 'suit',
    pants: 0x56607a,
    shoes: 0x2a2535,
    glasses: true,
    eyes: 'dot',
    mouth: 'flat',
    extra: ['tie'],
  },
  mabel: {
    skin: 0xffdcc4,
    hair: 0xe8e2ef,
    hairStyle: 'curly',
    top: 0xf2a6c8,
    top2: 0xffffff,
    topStyle: 'cardigan',
    pants: 0x8f7aa8,
    shoes: 0x7a5a42,
    glasses: true,
    eyes: 'dot',
    mouth: 'smile',
    extra: ['pearls'],
  },
  vince: {
    skin: 0xe7b48f,
    hair: SHADE.hairDark,
    hairStyle: 'side',
    top: 0x3f3a52,
    top2: 0xffd45e,
    topStyle: 'tee',
    pants: 0x2f2a3d,
    shoes: 0x2a2535,
    eyes: 'tired',
    mouth: 'flat',
  },
  lucia: {
    skin: 0xd9a27e,
    hair: SHADE.hairDark,
    hairStyle: 'long',
    top: 0x8f6f9f,
    top2: 0xffffff,
    topStyle: 'cardigan',
    pants: 0x46506e,
    shoes: 0x3b3355,
    eyes: 'tired',
    mouth: 'flat',
  },
  webbs: {
    skin: 0xf6e0d0,
    hair: 0xe8e2ef,
    hairStyle: 'side',
    top: 0x8fa8bf,
    top2: 0xffffff,
    topStyle: 'cardigan',
    pants: 0x6d6a7a,
    shoes: 0x4a3f3a,
    glasses: true,
    eyes: 'tired',
    mouth: 'small',
  },
  ada: {
    skin: 0xa8714f,
    hair: 0xe8e2ef,
    hairStyle: 'curly',
    top: 0xffcf3f,
    top2: 0xffffff,
    topStyle: 'cardigan',
    pants: 0x6d7fa8,
    shoes: 0x7a5a42,
    eyes: 'dot',
    mouth: 'smile',
    extra: ['cane'],
  },
  lee: {
    skin: 0xf0c8a8,
    hair: SHADE.hairDark,
    hairStyle: 'short',
    top: 0x7cae7a,
    top2: 0x4f7f4d,
    topStyle: 'uniform',
    pants: 0x5d6b4a,
    shoes: 0x4a3f3a,
    hat: 'ranger',
    hatColor: 0xc8b67a,
    eyes: 'dot',
    mouth: 'smile',
    extra: ['notepad'],
  },
  townsfolk: {
    skin: 0xf0c8a8,
    hair: 0x7a5236,
    hairStyle: 'short',
    top: 0x9fb7c9,
    top2: 0x7f97a9,
    topStyle: 'tee',
    pants: 0x56506b,
    shoes: 0x4a3f3a,
    eyes: 'dot',
    mouth: 'flat',
  },
  fisherman: {
    skin: 0xe6a982,
    hair: SHADE.hairBrown,
    hairStyle: 'short',
    top: 0x6d7fa8,
    top2: 0xffcf3f,
    topStyle: 'oilskin',
    pants: 0xffcf3f,
    shoes: 0x56506b,
    hat: 'trucker',
    hatColor: 0xd95f4f,
    eyes: 'dot',
    mouth: 'flat',
  },
};

function darker(c: number, f = 0.82): number {
  const r = Math.round(((c >> 16) & 255) * f);
  const g = Math.round(((c >> 8) & 255) * f);
  const b = Math.round((c & 255) * f);
  return (r << 16) | (g << 8) | b;
}

/**
 * Draws a chibi in a 96×128 logical frame, feet at y≈124.
 */
export function drawChibi(p: Pen, c: CharSpec): void {
  const hm = c.height ?? 1;
  const wide = c.wide ?? 1;
  const slouch = c.slouch ?? 0;
  const headR = 29 * (c.head ?? 1);
  const cx = 48;
  // body geometry
  const bodyW = 40 * wide;
  const bodyX = cx - bodyW / 2;
  const legTop = 124 - 24 * hm;
  const bodyTop = legTop - 34 * hm;
  const bodyH = 38 * hm;
  const headCx = cx + slouch * 3;
  const headCy = bodyTop - headR * 0.72 + slouch * 4;

  // ground shadow
  p.ellipse(cx, 123, 46 * wide, 8, 0x3b3355, { outline: false, alpha: 0.14 });

  // legs + shoes
  const legH = 22 * hm;
  if (c.topStyle === 'dress') {
    p.rrect(cx - 10, legTop, 7, legH, 3, c.skin);
    p.rrect(cx + 3, legTop, 7, legH, 3, c.skin);
  } else {
    p.rrect(cx - 12, legTop - 2, 11, legH + 2, 4, c.pants);
    p.rrect(cx + 1, legTop - 2, 11, legH + 2, 4, c.pants);
  }
  p.ellipse(cx - 7, 121, 17, 8, c.shoes);
  p.ellipse(cx + 7, 121, 17, 8, c.shoes);

  // coat tails below the body
  if (c.topStyle === 'coat') {
    p.rrect(bodyX - 1, bodyTop + 6, bodyW + 2, bodyH + 12, 8, c.top);
  }
  if (c.topStyle === 'dress') {
    p.poly([cx - 18, legTop + 4, cx + 18, legTop + 4, cx + 12, bodyTop + 4, cx - 12, bodyTop + 4], c.top);
  }

  // arms
  const armY = bodyTop + 6;
  const armH = 24 * hm;
  p.rrect(bodyX - 8, armY, 12, armH, 6, c.topStyle === 'oilskin' ? c.top : c.top);
  p.rrect(bodyX + bodyW - 4, armY, 12, armH, 6, c.top);
  p.circle(bodyX - 2, armY + armH, 5, c.skin);
  p.circle(bodyX + bodyW + 2, armY + armH, 5, c.skin);

  // torso
  if (c.topStyle !== 'dress') p.rrect(bodyX, bodyTop, bodyW, bodyH, 13, c.top);

  // torso details per style
  const t2 = c.top2 ?? darker(c.top);
  switch (c.topStyle) {
    case 'hoodie':
      p.rrect(cx - 11, bodyTop + 20, 22, 11, 5, t2);
      p.line(cx - 4, bodyTop + 4, cx - 5, bodyTop + 14, 1.6);
      p.line(cx + 4, bodyTop + 4, cx + 5, bodyTop + 14, 1.6);
      break;
    case 'oilskin':
      p.rrect(cx - 15 * wide, bodyTop + 8, 30 * wide, bodyH - 6, 6, t2);
      p.line(cx - 10, bodyTop + 9, cx - 13, bodyTop, 2.4);
      p.line(cx + 10, bodyTop + 9, cx + 13, bodyTop, 2.4);
      p.rrect(cx - 6, bodyTop + 16, 12, 8, 2, darker(t2, 0.9));
      break;
    case 'vest':
      p.poly([bodyX + 2, bodyTop + 6, cx - 4, bodyTop + 4, cx - 6, bodyTop + bodyH - 2, bodyX + 4, bodyTop + bodyH - 4], t2);
      p.poly([bodyX + bodyW - 2, bodyTop + 6, cx + 4, bodyTop + 4, cx + 6, bodyTop + bodyH - 2, bodyX + bodyW - 4, bodyTop + bodyH - 4], t2);
      p.rrect(bodyX + 5, bodyTop + 18, 9, 8, 2, darker(t2, 0.9));
      p.rrect(bodyX + bodyW - 14, bodyTop + 18, 9, 8, 2, darker(t2, 0.9));
      break;
    case 'uniform':
      p.line(cx, bodyTop + 4, cx, bodyTop + bodyH - 6, 1.6);
      p.rect(bodyX + 1, bodyTop + bodyH - 10, bodyW - 2, 5, t2, { lw: 1.6 });
      p.rrect(bodyX + 6, bodyTop + 9, 9, 7, 2, t2, { lw: 1.6 });
      p.rrect(bodyX + bodyW - 15, bodyTop + 9, 9, 7, 2, t2, { lw: 1.6 });
      break;
    case 'apron':
      p.rrect(cx - 13, bodyTop + 8, 26, bodyH + 4, 5, t2);
      p.rrect(cx - 6, bodyTop + 22, 12, 7, 2, darker(t2, 0.93), { lw: 1.6 });
      break;
    case 'clerical':
      p.rect(cx - 6, bodyTop + 1, 12, 6, t2, { lw: 1.6 });
      p.line(cx, bodyTop + 10, cx, bodyTop + bodyH - 4, 1.2, 0x55506a);
      break;
    case 'coat':
      p.line(cx, bodyTop + 4, cx, bodyTop + bodyH + 14, 1.6);
      p.poly([cx - 3, bodyTop + 1, cx - 12, bodyTop + 14, cx - 3, bodyTop + 12], darker(c.top, 0.93), { lw: 1.6 });
      p.poly([cx + 3, bodyTop + 1, cx + 12, bodyTop + 14, cx + 3, bodyTop + 12], darker(c.top, 0.93), { lw: 1.6 });
      p.rrect(bodyX + bodyW - 15, bodyTop + 20, 10, 8, 2, darker(c.top, 0.95), { lw: 1.6 });
      break;
    case 'sheriff':
      p.rect(bodyX + 1, bodyTop + bodyH - 11, bodyW - 2, 7, t2, { lw: 1.8 });
      p.line(cx, bodyTop + 4, cx, bodyTop + bodyH - 11, 1.6);
      break;
    case 'stripe':
      for (let i = 0; i < 4; i++) p.line(bodyX + 3, bodyTop + 9 + i * 7, bodyX + bodyW - 3, bodyTop + 9 + i * 7, 3, t2);
      p.rrect(bodyX, bodyTop, bodyW, bodyH, 13, 0xffffff, { alpha: 0 });
      break;
    case 'flannel':
      for (let i = 0; i < 3; i++) p.line(bodyX + 4, bodyTop + 10 + i * 9, bodyX + bodyW - 4, bodyTop + 10 + i * 9, 2, t2);
      for (let i = 0; i < 3; i++) p.line(bodyX + 9 + i * 11, bodyTop + 4, bodyX + 9 + i * 11, bodyTop + bodyH - 4, 2, t2);
      break;
    case 'blouse':
      p.poly([cx - 8, bodyTop + 1, cx, bodyTop + 9, cx + 8, bodyTop + 1], t2, { lw: 1.6 });
      break;
    case 'suit':
      p.poly([cx - 7, bodyTop + 1, cx, bodyTop + 16, cx + 7, bodyTop + 1], 0xffffff, { lw: 1.6 });
      break;
    case 'cardigan':
      p.line(cx, bodyTop + 4, cx, bodyTop + bodyH - 4, 1.6);
      p.circle(cx + 3, bodyTop + 14, 1.6, PALETTE.ink, { outline: false });
      p.circle(cx + 3, bodyTop + 24, 1.6, PALETTE.ink, { outline: false });
      break;
    case 'tee':
      p.rrect(cx - 7, bodyTop + 10, 14, 8, 3, t2, { lw: 1.6 });
      break;
    default:
      break;
  }

  // extras on the body
  const ex = c.extra ?? [];
  if (ex.includes('badge')) {
    const bx = bodyX + 11;
    const by = bodyTop + 12;
    p.poly(
      [bx, by - 5, bx + 1.6, by - 1.6, bx + 5, by - 1.4, bx + 2.4, by + 1.2, bx + 3.2, by + 5, bx, by + 3, bx - 3.2, by + 5, bx - 2.4, by + 1.2, bx - 5, by - 1.4, bx - 1.6, by - 1.6],
      SHADE.yellow,
      { lw: 1.4 },
    );
  }
  if (ex.includes('buckle')) p.rrect(cx - 8, bodyTop + bodyH - 13, 16, 11, 3, SHADE.yellow, { lw: 1.8 });
  if (ex.includes('tie')) p.poly([cx - 3, bodyTop + 4, cx + 3, bodyTop + 4, cx + 4, bodyTop + 22, cx, bodyTop + 26, cx - 4, bodyTop + 22], t2, { lw: 1.4 });
  if (ex.includes('stethoscope')) {
    p.path([cx - 9, bodyTop + 2, cx - 10, bodyTop + 18, cx - 4, bodyTop + 24], 1.8, 0x55607a);
    p.path([cx + 9, bodyTop + 2, cx + 10, bodyTop + 14], 1.8, 0x55607a);
    p.circle(cx - 3, bodyTop + 25, 3, 0xc9d3e0, { lw: 1.4 });
  }
  if (ex.includes('pearls')) {
    for (let i = -3; i <= 3; i++) p.circle(cx + i * 3.4, bodyTop + 4 + Math.abs(i) * -0.6 + 3, 1.7, 0xffffff, { lw: 1 });
  }
  if (ex.includes('camera')) {
    p.line(bodyX + 6, bodyTop + 1, bodyX + bodyW - 4, bodyTop + bodyH - 10, 2.6, 0x3b3355);
    p.rrect(bodyX + bodyW - 14, bodyTop + bodyH - 16, 16, 12, 3, 0x46506e, { lw: 1.8 });
    p.circle(bodyX + bodyW - 6, bodyTop + bodyH - 10, 3.6, 0xbfe8f2, { lw: 1.4 });
  }

  // held items (right hand)
  const hx = bodyX + bodyW + 2;
  const hy = armY + armH;
  if (ex.includes('coffeepot')) {
    p.rrect(hx - 2, hy - 4, 16, 18, 5, 0xe8e2ef);
    p.rect(hx, hy - 7, 12, 4, 0x3b3355, { lw: 1.4 });
    p.path([hx + 14, hy, hx + 19, hy + 3, hx + 14, hy + 8], 2);
    p.rrect(hx, hy + 6, 12, 7, 2, 0x8a5a3a, { outline: false });
  }
  if (ex.includes('cane')) p.line(hx + 2, hy, hx + 4, 122, 2.6, 0x9c6f4a);
  if (ex.includes('notepad')) p.rrect(hx - 3, hy - 6, 11, 14, 2, 0xfffaf0, { lw: 1.6 });

  // head
  const hr = headR;
  // hair behind head (bun, long, pigtails)
  if (c.hairStyle === 'long') {
    p.rrect(headCx - hr - 2, headCy - 4, hr * 2 + 4, hr + 16, 12, c.hair);
  }
  if (c.hairStyle === 'pigtails') {
    p.circle(headCx - hr - 4, headCy + 4, 9, c.hair);
    p.circle(headCx + hr + 4, headCy + 4, 9, c.hair);
  }
  if (c.hairStyle === 'bun') {
    p.circle(headCx, headCy - hr - 4, 11, c.hair);
  }
  // ears
  p.circle(headCx - hr + 1, headCy + 4, 5, c.skin);
  p.circle(headCx + hr - 1, headCy + 4, 5, c.skin);
  // face
  p.ellipse(headCx, headCy, hr * 2, hr * 2 * 0.96, c.skin);

  // hair on top
  const top = headCy - hr;
  switch (c.hairStyle) {
    case 'messy':
      p.pie(headCx, headCy - 2, hr + 1, 180, 360, c.hair);
      p.poly(
        [headCx - hr, headCy - 2, headCx - hr + 6, top + 4, headCx - 12, top - 6, headCx - 4, top + 2, headCx + 4, top - 7, headCx + 10, top + 2, headCx + hr - 2, top + 1, headCx + hr, headCy - 2, headCx + 8, headCy - 9, headCx - 2, headCy - 6, headCx - 10, headCy - 9],
        c.hair,
      );
      break;
    case 'bun':
    case 'short':
    case 'side':
    case 'curly':
      p.pie(headCx, headCy - 1, hr + 1, 180, 360, c.hair);
      p.poly([headCx - hr, headCy - 1, headCx - hr + 4, headCy - 12, headCx + (c.hairStyle === 'side' ? 6 : 0), headCy - 8, headCx + hr - 4, headCy - 12, headCx + hr, headCy - 1], c.hair, { outline: false });
      if (c.hairStyle === 'curly') {
        for (let i = 0; i < 7; i++) {
          const a = Math.PI + (i / 6) * Math.PI;
          p.circle(headCx + Math.cos(a) * hr * 0.92, headCy - 2 + Math.sin(a) * hr * 0.92, 7, c.hair);
        }
      }
      if (c.hairStyle === 'side') p.line(headCx + 6, top + 2, headCx + 2, headCy - 9, 1.6, darker(c.hair, 0.7));
      break;
    case 'bob':
    case 'long':
    case 'pigtails':
      p.pie(headCx, headCy - 1, hr + 2, 180, 360, c.hair);
      p.rrect(headCx - hr - 2, headCy - 4, 9, 22, 4, c.hair);
      p.rrect(headCx + hr - 7, headCy - 4, 9, 22, 4, c.hair);
      p.poly([headCx - hr + 2, headCy - 3, headCx - 6, headCy - 11, headCx + 10, headCy - 8, headCx + hr - 2, headCy - 3], c.hair, { outline: false });
      break;
    case 'thin':
      p.pie(headCx, headCy - 3, hr + 1, 200, 340, c.hair);
      break;
    default:
      break;
  }

  // eyes
  const ey = headCy + 3;
  const exl = headCx - 10;
  const exr = headCx + 10;
  switch (c.eyes ?? 'dot') {
    case 'closed':
      p.arc(exl, ey + 2, 4.2, 200, 340, 2.4);
      p.arc(exr, ey + 2, 4.2, 200, 340, 2.4);
      break;
    case 'tired':
      p.ellipse(exl, ey + 1, 6, 6.5, PALETTE.ink, { outline: false });
      p.ellipse(exr, ey + 1, 6, 6.5, PALETTE.ink, { outline: false });
      p.line(exl - 4, ey - 2.5, exl + 4, ey - 2.5, 2.2, c.skin === SHADE.skin ? 0xf2c4a6 : darker(c.skin, 0.92));
      p.line(exr - 4, ey - 2.5, exr + 4, ey - 2.5, 2.2, c.skin === SHADE.skin ? 0xf2c4a6 : darker(c.skin, 0.92));
      p.line(exl - 4, ey - 2, exl + 4, ey - 2, 1.8);
      p.line(exr - 4, ey - 2, exr + 4, ey - 2, 1.8);
      break;
    case 'wide':
      p.ellipse(exl, ey, 7.5, 9, PALETTE.ink, { outline: false });
      p.ellipse(exr, ey, 7.5, 9, PALETTE.ink, { outline: false });
      p.circle(exl + 1.6, ey - 2, 1.8, 0xffffff, { outline: false });
      p.circle(exr + 1.6, ey - 2, 1.8, 0xffffff, { outline: false });
      break;
    default:
      p.ellipse(exl, ey, 6, 7.5, PALETTE.ink, { outline: false });
      p.ellipse(exr, ey, 6, 7.5, PALETTE.ink, { outline: false });
      p.circle(exl + 1.4, ey - 1.6, 1.4, 0xffffff, { outline: false });
      p.circle(exr + 1.4, ey - 1.6, 1.4, 0xffffff, { outline: false });
  }
  // blush
  p.ellipse(headCx - 17, headCy + 11, 9, 5, SHADE.blush, { outline: false, alpha: 0.7 });
  p.ellipse(headCx + 17, headCy + 11, 9, 5, SHADE.blush, { outline: false, alpha: 0.7 });

  // beard (covers mouth)
  if (c.beard !== undefined) {
    p.poly(
      [headCx - hr + 4, headCy + 4, headCx - hr + 8, headCy + 18, headCx - 8, headCy + hr + 4, headCx + 8, headCy + hr + 4, headCx + hr - 8, headCy + 18, headCx + hr - 4, headCy + 4, headCx + 8, headCy + 12, headCx - 8, headCy + 12],
      c.beard,
    );
    p.line(headCx - 5, headCy + 15, headCx + 5, headCy + 15, 1.8);
  } else {
    const my = headCy + 14;
    switch (c.mouth ?? 'small') {
      case 'smile':
        p.arc(headCx, my - 3, 5, 25, 155, 2.2);
        break;
      case 'grin':
        p.pie(headCx, my - 1, 5.5, 0, 180, 0xd7505a, { lw: 1.8 });
        break;
      case 'o':
        p.ellipse(headCx, my, 5, 6, 0xd7505a, { lw: 1.6 });
        break;
      case 'flat':
        p.line(headCx - 4, my, headCx + 4, my, 2);
        break;
      default:
        p.arc(headCx, my - 2, 3.4, 30, 150, 2);
    }
  }

  if (c.glasses) {
    p.circle(exl, ey, 7.5, 0xffffff, { alpha: 0.25, lw: 2 });
    p.circle(exr, ey, 7.5, 0xffffff, { alpha: 0.25, lw: 2 });
    p.line(exl + 7.5, ey, exr - 7.5, ey, 2);
  }

  // hats
  const hc = c.hatColor ?? 0xffffff;
  switch (c.hat ?? 'none') {
    case 'beanie':
      p.pie(headCx, headCy - 4, hr + 1, 180, 360, hc);
      p.rrect(headCx - hr - 1, headCy - 10, hr * 2 + 2, 10, 4, darker(hc, 0.85));
      p.circle(headCx, top - 6, 6, darker(hc, 0.9));
      for (let i = -2; i <= 2; i++) p.line(headCx + i * 9, headCy - 9, headCx + i * 9, headCy - 1, 1.2, darker(hc, 0.6));
      break;
    case 'bucket':
      p.ellipse(headCx, headCy - 9, hr * 2 + 18, 14, darker(hc, 0.9));
      p.poly([headCx - hr + 3, headCy - 10, headCx - hr + 8, top - 8, headCx + hr - 8, top - 8, headCx + hr - 3, headCy - 10], hc);
      p.line(headCx - hr + 5, headCy - 14, headCx + hr - 5, headCy - 14, 2.6, 0x8a7a5a);
      break;
    case 'cowboy':
      p.poly([headCx - hr - 16, headCy - 8, headCx - hr - 8, headCy - 15, headCx + hr + 8, headCy - 15, headCx + hr + 16, headCy - 8, headCx + hr, headCy - 11, headCx - hr, headCy - 11], darker(hc, 0.9));
      p.poly([headCx - hr + 4, headCy - 13, headCx - hr + 8, top - 10, headCx - 4, top - 4, headCx + 4, top - 4, headCx + hr - 8, top - 10, headCx + hr - 4, headCy - 13], hc);
      p.line(headCx - hr + 5, headCy - 17, headCx + hr - 5, headCy - 17, 2.6, 0x5a3a2a);
      break;
    case 'beret':
      p.ellipse(headCx - 3, top + 4, hr * 2 + 6, 20, hc);
      p.circle(headCx - 2, top - 6, 3, darker(hc, 0.8));
      break;
    case 'trucker':
      p.pie(headCx, headCy - 5, hr, 180, 360, hc);
      p.rect(headCx - hr + 2, headCy - 16, hr * 2 - 4, 10, 0xfffaf0, { lw: 1.6 });
      p.ellipse(headCx + hr - 2, headCy - 6, 26, 7, darker(hc, 0.85));
      break;
    case 'captain':
      p.rrect(headCx - hr + 2, top - 6, hr * 2 - 4, 16, 5, hc);
      p.rect(headCx - hr + 2, top + 6, hr * 2 - 4, 6, 0x3b3355, { lw: 1.6 });
      p.ellipse(headCx + 4, headCy - 13, 34, 7, 0x3b3355);
      p.circle(headCx, top + 1, 3, SHADE.yellow, { lw: 1.2 });
      break;
    case 'ranger':
      p.ellipse(headCx, headCy - 10, hr * 2 + 20, 10, darker(hc, 0.9));
      p.poly([headCx - hr + 6, headCy - 11, headCx - 6, top - 10, headCx, top - 4, headCx + 6, top - 10, headCx + hr - 6, headCy - 11], hc);
      break;
    default:
      break;
  }
}

/** Pelican "Ledger" in a 96×96 logical frame. pose: perch | fly | gulp */
export function drawPelican(p: Pen, pose: 'perch' | 'fly' | 'gulp'): void {
  const beak = 0xffa34d;
  const pouch = 0xffbf73;
  if (pose === 'fly') {
    p.poly([48, 50, 4, 30, 14, 46, 30, 52], 0xfffaf0);
    p.poly([48, 50, 92, 30, 82, 46, 66, 52], 0xfffaf0);
    p.line(8, 34, 18, 44, 1.6, 0x3b3355);
    p.ellipse(48, 54, 40, 22, 0xfffaf0);
    p.circle(30, 46, 9, 0xfffaf0);
    p.poly([24, 44, -2, 52, 6, 56, 24, 50], beak);
    p.ellipse(12, 55, 18, 8, pouch);
    p.circle(30, 43, 2.2, PALETTE.ink, { outline: false });
    return;
  }
  // legs
  p.line(44, 78, 42, 92, 3, beak);
  p.line(54, 78, 56, 92, 3, beak);
  p.ellipse(40, 93, 10, 4, beak);
  p.ellipse(58, 93, 10, 4, beak);
  // body
  p.ellipse(50, 66, 46, 34, 0xfffaf0);
  p.poly([60, 56, 82, 70, 68, 78, 56, 72], 0xe9e4f0);
  p.line(64, 64, 76, 70, 1.4, 0xb9b4c7);
  // neck + head
  p.rrect(34, 30, 14, 34, 7, 0xfffaf0);
  p.circle(40, 28, 11, 0xfffaf0);
  p.circle(37, 25, 2.4, PALETTE.ink, { outline: false });
  p.circle(37.6, 24.4, 0.8, 0xffffff, { outline: false });
  p.ellipse(44, 19, 8, 4, 0xffe29a, { outline: false });
  if (pose === 'gulp') {
    p.poly([32, 26, 6, 18, 8, 22, 32, 30], beak);
    p.ellipse(18, 34, 26, 18, pouch);
    p.poly([31, 30, 6, 30, 10, 26], 0xffd7a8, { lw: 1.6 });
  } else {
    p.poly([31, 24, 4, 32, 8, 36, 31, 31], beak);
    p.ellipse(17, 38, 26, 12, pouch);
  }
}

export const DOG_SPEC = { body: 0xe0b47a, ear: 0x9c6f4a };

export function drawDog(p: Pen): void {
  p.ellipse(48, 92, 48, 6, 0x3b3355, { outline: false, alpha: 0.15 });
  p.rrect(30, 78, 6, 14, 3, DOG_SPEC.body);
  p.rrect(58, 78, 6, 14, 3, DOG_SPEC.body);
  p.ellipse(48, 72, 44, 26, DOG_SPEC.body);
  p.path([70, 66, 78, 56, 80, 60], 3, DOG_SPEC.body);
  p.circle(30, 54, 15, DOG_SPEC.body);
  p.ellipse(19, 52, 9, 18, DOG_SPEC.ear);
  p.ellipse(41, 50, 9, 18, DOG_SPEC.ear);
  p.ellipse(28, 60, 12, 9, 0xf6dcb5, { lw: 1.6 });
  p.circle(25, 57, 2.4, PALETTE.ink, { outline: false });
  p.circle(25, 51, 1.8, PALETTE.ink, { outline: false });
  p.circle(33, 51, 1.8, PALETTE.ink, { outline: false });
  p.rrect(24, 64, 14, 4, 2, 0xff8b94, { lw: 1.4 });
}

export const CHARACTER_KEYS = Object.keys(CHAR_SPECS);

export function charTexKey(id: string): string {
  return `ch_${id}`;
}
export function portraitKey(id: string): string {
  return `por_${id}`;
}

export function generateCharacters(scene: Phaser.Scene): void {
  for (const id of CHARACTER_KEYS) {
    const spec = CHAR_SPECS[id];
    bake(scene, charTexKey(id), 96, 128, (p) => drawChibi(p, spec));
    // portrait: same drawing, bigger, cropped to the head and shoulders
    bake(scene, portraitKey(id), 120, 120, (p) => {
      p.s = 2.5;
      p.ox = 120 - 48 * p.s;
      p.oy = 14 - (spec.height !== undefined ? (1 - spec.height) * 110 : 0);
      // portrait background disc
      const g = p.g;
      g.fillStyle(0xfff3d6, 1);
      g.fillCircle(120, 120, 116);
      drawChibi(p, spec);
    });
  }
  bake(scene, 'ch_ledger', 96, 96, (p) => drawPelican(p, 'perch'));
  bake(scene, 'ch_ledger_fly', 96, 96, (p) => drawPelican(p, 'fly'));
  bake(scene, 'ch_ledger_gulp', 96, 96, (p) => drawPelican(p, 'gulp'));
  bake(scene, 'por_ledger', 120, 120, (p) => {
    p.g.fillStyle(0xfff3d6, 1);
    p.g.fillCircle(120, 120, 116);
    p.s = 2.6;
    p.ox = 0;
    p.oy = 4;
    drawPelican(p, 'perch');
  });
  bake(scene, 'ch_biscuit', 96, 96, (p) => drawDog(p));
  bake(scene, 'por_biscuit', 120, 120, (p) => {
    p.g.fillStyle(0xfff3d6, 1);
    p.g.fillCircle(120, 120, 116);
    p.s = 2.6;
    p.ox = 30;
    p.oy = -60;
    drawDog(p);
  });
}
