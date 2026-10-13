import type Phaser from 'phaser';
import { PALETTE, SHADE } from './palette';
import { bake, type Pen } from './pen';

/** Catch, bins, props. Each texture key is listed in art/manifest.ts. */

function shrimp(p: Pen, k: number, body: number, stripe: number) {
  // C-shaped body from head (right) to tail (left)
  const cx = 34;
  const cy = 22;
  const segs = 6;
  for (let i = segs; i >= 0; i--) {
    const a = Math.PI * (0.05 + (i / segs) * 0.85);
    const r = 13 * k;
    const x = cx + Math.cos(a) * r * 1.25;
    const y = cy - Math.sin(a) * r * 0.75 + 4 * k;
    const size = (11 - i * 0.9) * k;
    p.ellipse(x, y, size * 1.25, size, body, { lw: 1.8 });
    if (i > 0 && i < segs) p.arc(x, y, size * 0.45, 200, 340, 1.2, stripe);
  }
  // tail fan
  const tx = cx - 13 * k * 1.25;
  const ty = cy + 4 * k;
  p.poly([tx + 2, ty - 1, tx - 9 * k, ty + 6 * k, tx - 2, ty + 8 * k, tx + 4 * k, ty + 9 * k], stripe, { lw: 1.6 });
  // head
  const hx = cx + 13 * k * 1.25 * Math.cos(Math.PI * 0.05) + 2;
  const hy = cy + 3 * k;
  p.ellipse(hx, hy, 13 * k, 10 * k, body, { lw: 1.8 });
  p.circle(hx + 3 * k, hy - 2 * k, 1.8, PALETTE.ink, { outline: false });
  // antennae
  p.path([hx + 4 * k, hy - 3 * k, hx + 14 * k, hy - 14 * k, hx + 22 * k, hy - 12 * k], 1.2, stripe);
  p.path([hx + 3 * k, hy - 4 * k, hx + 8 * k, hy - 16 * k, hx + 2 * k, hy - 20 * k], 1.2, stripe);
  // legs
  for (let i = 0; i < 4; i++) p.line(cx + (i - 1) * 4 * k, cy + 9 * k, cx + (i - 1) * 4 * k + 1, cy + 13 * k, 1.2, stripe);
}

function crab(p: Pen) {
  const c = 0xff7a5c;
  for (let i = 0; i < 3; i++) {
    p.path([16, 24 + i * 4, 6, 28 + i * 5, 4, 34 + i * 4], 2, PALETTE.ink);
    p.path([44, 24 + i * 4, 54, 28 + i * 5, 56, 34 + i * 4], 2, PALETTE.ink);
  }
  p.circle(10, 10, 6, c);
  p.circle(50, 10, 6, c);
  p.line(13, 14, 18, 20, 3, c);
  p.line(47, 14, 42, 20, 3, c);
  p.ellipse(30, 26, 34, 22, c);
  p.circle(25, 16, 3, 0xffffff, { lw: 1.4 });
  p.circle(35, 16, 3, 0xffffff, { lw: 1.4 });
  p.circle(25, 16, 1.4, PALETTE.ink, { outline: false });
  p.circle(35, 16, 1.4, PALETTE.ink, { outline: false });
  p.arc(30, 27, 4, 30, 150, 1.6);
}

function fish(p: Pen, body: number, belly: number, striped: boolean) {
  p.poly([8, 20, 0, 10, 0, 30], body);
  p.ellipse(28, 20, 40, 20, body);
  p.ellipse(30, 24, 26, 8, belly, { outline: false });
  if (striped) for (let i = 0; i < 4; i++) p.line(18 + i * 7, 12, 17 + i * 7, 26, 1.6, 0x5d6b8a);
  p.poly([24, 11, 30, 4, 36, 11], body, { lw: 1.6 });
  p.circle(41, 17, 3, 0xffffff, { lw: 1.4 });
  p.circle(41.5, 17, 1.4, PALETTE.ink, { outline: false });
}

function turtle(p: Pen) {
  const skin = 0x9fd69a;
  p.ellipse(14, 18, 14, 10, skin);
  p.ellipse(14, 46, 14, 10, skin);
  p.ellipse(58, 18, 12, 9, skin);
  p.ellipse(58, 46, 12, 9, skin);
  p.poly([62, 32, 72, 29, 72, 35], skin, { lw: 1.6 });
  p.circle(8, 32, 9, skin);
  p.circle(5, 29, 1.6, PALETTE.ink, { outline: false });
  p.ellipse(38, 32, 50, 38, 0x6fae6a);
  for (const [x, y] of [
    [38, 32],
    [26, 24],
    [50, 24],
    [26, 40],
    [50, 40],
  ]) {
    p.circle(x, y, 6.5, 0x8fcf7f, { lw: 1.6 });
  }
}

function basket(p: Pen, label: string, tint: number) {
  void label;
  p.ellipse(50, 70, 92, 14, 0x3b3355, { outline: false, alpha: 0.12 });
  p.poly([8, 22, 92, 22, 82, 70, 18, 70], 0xe2bf8f);
  for (let i = 0; i < 4; i++) p.line(12 + i * 1.2, 32 + i * 10, 88 - i * 1.2, 32 + i * 10, 1.4, 0xb08a5f);
  for (let i = 0; i < 7; i++) p.line(20 + i * 10, 24, 22 + i * 9.4, 68, 1.4, 0xb08a5f);
  p.ellipse(50, 22, 86, 16, tint);
  p.ellipse(50, 22, 72, 9, 0xb08a5f, { outline: false, alpha: 0.4 });
}

function bucket(p: Pen) {
  p.ellipse(40, 70, 70, 12, 0x3b3355, { outline: false, alpha: 0.12 });
  p.poly([10, 20, 70, 20, 62, 70, 18, 70], 0x7ab8d8);
  p.line(13, 34, 67, 34, 2, 0x5a98b8);
  p.ellipse(40, 20, 60, 14, 0x9fd0e8);
  p.ellipse(40, 21, 50, 9, 0x4f86a6, { outline: false });
  p.arc(40, 22, 30, 190, 350, 2.4);
}

function barrel(p: Pen) {
  p.ellipse(40, 78, 72, 12, 0x3b3355, { outline: false, alpha: 0.12 });
  p.rrect(8, 14, 64, 64, 14, 0x8f9fb8);
  p.line(8, 30, 72, 30, 3, 0x6d7d96);
  p.line(8, 62, 72, 62, 3, 0x6d7d96);
  p.ellipse(40, 16, 60, 14, 0x6d7d96);
  p.ellipse(40, 16, 48, 8, 0x46506e, { outline: false });
}

function crate(p: Pen) {
  p.ellipse(40, 64, 72, 10, 0x3b3355, { outline: false, alpha: 0.12 });
  p.rrect(6, 16, 68, 46, 5, SHADE.woodLight);
  p.line(6, 32, 74, 32, 1.6, SHADE.woodDark);
  p.line(6, 46, 74, 46, 1.6, SHADE.woodDark);
  p.rrect(6, 10, 68, 10, 4, SHADE.wood);
}

// ---------- curiosities ----------
function curio(p: Pen, id: string) {
  switch (id) {
    case 'c_bottle':
      p.rrect(14, 6, 8, 10, 2, 0x8fcf9f);
      p.rrect(8, 14, 20, 26, 7, 0x9fdfaf, { alpha: 0.9 });
      p.ellipse(18, 36, 14, 4, PALETTE.sand, { outline: false });
      break;
    case 'c_coin':
      p.circle(18, 22, 13, 0xd9b45a);
      p.circle(18, 22, 9, 0xe8c86a, { lw: 1.4 });
      p.line(14, 22, 22, 22, 1.4, 0x9a7a3a);
      break;
    case 'c_compass':
      p.circle(18, 22, 14, 0xc9a15a);
      p.circle(18, 22, 10, 0xfffaf0, { lw: 1.6 });
      p.poly([18, 13, 21, 22, 18, 31, 15, 22], 0xd7505a, { lw: 1.2 });
      p.line(10, 15, 24, 28, 1.2, 0x7d7896);
      break;
    case 'c_doll':
      p.circle(18, 22, 13, 0xffe0cc);
      p.pie(18, 20, 14, 180, 360, 0xf2c46b);
      p.circle(13, 23, 2.2, PALETTE.ink, { outline: false });
      p.line(20, 23, 25, 23, 1.6);
      p.ellipse(11, 28, 5, 3, SHADE.blush, { outline: false });
      break;
    case 'c_key':
      p.circle(10, 22, 7, 0xb5763f);
      p.circle(10, 22, 3, 0xf5e3b3, { lw: 1.2 });
      p.rect(16, 20, 18, 4, 0xb5763f, { lw: 1.4 });
      p.rect(28, 24, 3, 5, 0xb5763f, { lw: 1.2 });
      p.rect(23, 24, 3, 4, 0xb5763f, { lw: 1.2 });
      break;
    case 'c_seaglass':
      p.poly([8, 18, 16, 8, 30, 12, 30, 28, 18, 34, 8, 28], 0x7fc8e8, { alpha: 0.9 });
      p.ellipse(16, 16, 6, 3, 0xffffff, { outline: false, alpha: 0.7 });
      break;
    case 'c_soldier':
      p.rect(13, 22, 10, 14, 0x5a7ab8, { lw: 1.4 });
      p.circle(18, 17, 5, 0xffe0cc, { lw: 1.4 });
      p.rect(13, 8, 10, 6, 0xd7505a, { lw: 1.4 });
      p.line(23, 24, 27, 16, 2.4, 0x5a7ab8);
      break;
    case 'c_shell':
      p.poly([6, 30, 18, 6, 32, 30], 0xffd6c4);
      p.ellipse(19, 30, 28, 10, 0xffc0a8);
      for (let i = 0; i < 3; i++) p.line(12 + i * 6, 26, 18, 10, 1.2, 0xd99a88);
      break;
    case 'c_spoon':
      p.ellipse(10, 22, 12, 16, 0xdfe3ea);
      p.rrect(14, 20, 20, 4, 2, 0xdfe3ea, { lw: 1.4 });
      break;
    case 'c_marble':
      p.circle(18, 22, 10, 0xbfe8f2, { alpha: 0.9 });
      p.arc(18, 22, 5, 20, 250, 2.4, 0xffd45e);
      p.circle(15, 18, 2, 0xffffff, { outline: false });
      break;
    case 'c_lure':
      p.ellipse(18, 22, 24, 10, 0xff8b94);
      p.circle(26, 21, 2, PALETTE.ink, { outline: false });
      p.line(6, 22, 2, 18, 1.4);
      p.ellipse(14, 22, 6, 6, 0xffe29a, { lw: 1.2 });
      break;
    case 'c_dice':
      p.rrect(8, 12, 20, 20, 4, 0xe2bf8f);
      p.circle(13, 17, 1.6, PALETTE.ink, { outline: false });
      p.circle(23, 17, 1.6, PALETTE.ink, { outline: false });
      p.circle(13, 27, 1.6, PALETTE.ink, { outline: false });
      p.circle(23, 27, 1.6, PALETTE.ink, { outline: false });
      break;
    case 'c_harmonica':
      p.rrect(4, 16, 30, 12, 3, 0xb9b4c7);
      for (let i = 0; i < 6; i++) p.rect(7 + i * 4.4, 20, 2.4, 4, 0x46506e, { outline: false });
      break;
    case 'c_sanddollar':
      p.circle(18, 22, 13, 0xf5ead2);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        p.ellipse(18 + Math.cos(a) * 5, 22 + Math.sin(a) * 5, 3, 6, 0xd9c9a3, { outline: false });
      }
      break;
    default:
      p.circle(18, 22, 10, 0xc9b6e4);
  }
}

export const CURIO_IDS = [
  'c_bottle',
  'c_coin',
  'c_compass',
  'c_doll',
  'c_key',
  'c_seaglass',
  'c_soldier',
  'c_shell',
  'c_spoon',
  'c_marble',
  'c_lure',
  'c_dice',
  'c_harmonica',
  'c_sanddollar',
];

export function generateItems(scene: Phaser.Scene): void {
  bake(scene, 'it_shrimp_small', 64, 44, (p) => shrimp(p, 0.62, SHADE.shrimpPale, 0xf2a08f));
  bake(scene, 'it_shrimp_medium', 64, 44, (p) => shrimp(p, 0.86, SHADE.shrimp, SHADE.shrimpDeep));
  bake(scene, 'it_shrimp_large', 76, 52, (p) => {
    p.ox = 4;
    p.oy = 4;
    shrimp(p, 1.12, 0xff8a78, 0xd9604f);
  });
  bake(scene, 'it_crab', 60, 46, (p) => crab(p));
  bake(scene, 'it_fish_croaker', 56, 40, (p) => fish(p, 0xd9d3a8, 0xfffaf0, false));
  bake(scene, 'it_fish_pinfish', 56, 40, (p) => fish(p, 0xb9c8d8, 0xfffaf0, true));
  bake(scene, 'it_fish_mullet', 56, 40, (p) => fish(p, 0x9fa8b8, 0xdfe3ea, false));
  bake(scene, 'it_turtle', 76, 64, (p) => turtle(p));
  // trash
  bake(scene, 'it_trash_can', 40, 44, (p) => {
    p.rrect(8, 8, 22, 30, 4, 0xd7505a);
    p.rect(8, 16, 22, 10, 0xfffaf0, { lw: 1.4 });
    p.ellipse(19, 8, 22, 6, 0xb9b4c7);
  });
  bake(scene, 'it_trash_boot', 48, 48, (p) => {
    p.poly([12, 6, 26, 6, 26, 30, 42, 32, 42, 42, 8, 42], 0x5d6b4a);
    p.line(10, 38, 42, 38, 1.6, 0x3b3355);
  });
  bake(scene, 'it_trash_weed', 52, 40, (p) => {
    p.path([6, 34, 14, 10, 20, 30, 28, 6, 34, 30, 44, 12], 4.5, 0x5f9a5a);
    p.path([10, 30, 22, 18, 38, 34], 3, 0x7cba6f);
  });
  bake(scene, 'it_trash_bag', 44, 44, (p) => {
    p.poly([8, 38, 6, 18, 14, 8, 22, 14, 30, 6, 38, 16, 36, 38], 0xe8e2ef, { alpha: 0.9 });
    p.line(14, 20, 20, 30, 1.2, 0xb9b4c7);
  });
  bake(scene, 'it_trash_tire', 52, 52, (p) => {
    p.circle(26, 26, 20, 0x46415a);
    p.circle(26, 26, 9, SHADE.woodLight, { lw: 2 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      p.line(26 + Math.cos(a) * 14, 26 + Math.sin(a) * 14, 26 + Math.cos(a) * 19, 26 + Math.sin(a) * 19, 1.6, 0x2f2a3d);
    }
  });
  for (const id of CURIO_IDS) bake(scene, `it_${id}`, 40, 44, (p) => curio(p, id));
  // story items
  bake(scene, 'it_s_bottle_note', 48, 48, (p) => {
    p.rrect(18, 4, 10, 10, 3, 0xc99a6b);
    p.rrect(10, 12, 26, 32, 9, 0xbfe8f2, { alpha: 0.9 });
    p.rrect(15, 18, 16, 20, 2, 0xfffaf0, { lw: 1.4 });
    p.line(18, 23, 28, 23, 1.2, 0x7d7896);
    p.line(18, 28, 27, 28, 1.2, 0x7d7896);
    p.line(18, 33, 25, 33, 1.2, 0x7d7896);
  });
  bake(scene, 'it_s_tobacco_tin', 48, 40, (p) => {
    p.poly([6, 12, 40, 8, 42, 30, 8, 34], 0xb8463f);
    p.poly([6, 12, 40, 8, 40, 14, 6, 18], 0xd9b45a, { lw: 1.6 });
    p.line(14, 24, 32, 21, 1.4, 0x7a2a25);
  });
  // [변경 2] Hank's crab traps (Q_HANK_TRAPS)
  const trap = (p: Pen, tag: number) => {
    p.rrect(6, 10, 40, 30, 4, 0x9aa8a0, { alpha: 0.9 });
    for (let i = 0; i < 5; i++) p.line(10 + i * 8, 12, 10 + i * 8, 38, 1.2, 0x5f6b66);
    for (let i = 0; i < 3; i++) p.line(8, 18 + i * 8, 44, 18 + i * 8, 1.2, 0x5f6b66);
    p.rrect(34, 4, 12, 9, 2, tag, { lw: 1.2 });
  };
  bake(scene, 'it_s_hank_trap_river', 52, 46, (p) => trap(p, 0xff8b94));
  bake(scene, 'it_s_hank_trap_oyster', 52, 46, (p) => trap(p, 0xffe29a));
  // bins
  bake(scene, 'bin_basket_small', 100, 76, (p) => basket(p, '소', 0xfff3d6));
  bake(scene, 'bin_basket_medium', 100, 76, (p) => basket(p, '중', 0xffe29a));
  bake(scene, 'bin_basket_large', 100, 76, (p) => basket(p, '대', 0xffc7a8));
  bake(scene, 'bin_bucket', 80, 76, (p) => bucket(p));
  bake(scene, 'bin_barrel', 80, 84, (p) => barrel(p));
  bake(scene, 'bin_crate', 80, 70, (p) => crate(p));
  bake(scene, 'bin_icebox', 84, 72, (p) => {
    p.ellipse(42, 66, 74, 10, 0x3b3355, { outline: false, alpha: 0.12 });
    p.rrect(6, 20, 72, 44, 8, 0xdff6fb);
    p.rrect(6, 12, 72, 14, 6, 0x7ab8d8);
    p.rect(12, 34, 60, 6, 0xbfe8f2, { outline: false });
    for (let i = 0; i < 4; i++) p.rrect(14 + i * 15, 44, 11, 9, 2, 0xffffff, { lw: 1 });
  });
  // misc props
  bake(scene, 'fx_splash', 24, 24, (p) => p.circle(12, 12, 8, SHADE.foam, { outline: false }));
  bake(scene, 'fx_dot', 12, 12, (p) => p.circle(6, 6, 5, 0xffffff, { outline: false }));
  bake(scene, 'fx_coin', 24, 24, (p) => {
    p.circle(12, 12, 9, 0xffd45e);
    p.circle(12, 12, 5, 0xffe29a, { lw: 1.2 });
  });
  bake(scene, 'fx_note', 24, 28, (p) => {
    p.circle(8, 21, 5, PALETTE.ink, { outline: false });
    p.line(12, 21, 12, 4, 2.4);
    p.path([12, 4, 20, 8, 20, 13], 2.4);
  });
  bake(scene, 'fx_heart', 24, 24, (p) => {
    p.circle(8, 9, 5, PALETTE.coral, { outline: false });
    p.circle(16, 9, 5, PALETTE.coral, { outline: false });
    p.poly([3.4, 11, 12, 21, 20.6, 11], PALETTE.coral, { outline: false });
  });
  bake(scene, 'fx_sparkle', 24, 24, (p) => {
    p.poly([12, 1, 14.5, 9.5, 23, 12, 14.5, 14.5, 12, 23, 9.5, 14.5, 1, 12, 9.5, 9.5], 0xfffaf0, { outline: false });
  });
  bake(scene, 'prop_paintcan', 44, 48, (p) => {
    p.rrect(6, 12, 32, 30, 4, 0xfffaf0);
    p.rect(6, 22, 32, 10, PALETTE.mint, { lw: 1.4 });
    p.ellipse(22, 12, 32, 8, 0xdfe3ea);
    p.arc(22, 14, 14, 200, 340, 1.8);
  });
  bake(scene, 'prop_letterbox', 120, 80, (p) => {
    p.rrect(6, 20, 108, 54, 6, 0xc9a07a);
    p.rrect(4, 12, 112, 16, 5, 0xb08a5f);
    for (let i = 0; i < 9; i++) p.rrect(14 + i * 10.6, 6 + (i % 2) * 2, 8, 18, 1, 0xfbf1d9, { lw: 1.2 });
  });
  bake(scene, 'prop_logbook', 70, 86, (p) => {
    p.rrect(6, 6, 58, 76, 5, 0x4f6d8f);
    p.rect(10, 6, 6, 76, 0x3d5570, { outline: false });
    p.rrect(22, 22, 32, 14, 2, 0xfbf1d9, { lw: 1.4 });
  });
  bake(scene, 'prop_beer', 24, 44, (p) => {
    p.rrect(6, 14, 12, 28, 4, 0x9a6a2a, { alpha: 0.95 });
    p.rrect(8, 4, 8, 12, 2, 0x9a6a2a);
    p.rect(6, 22, 12, 10, 0xfbf1d9, { lw: 1.2 });
  });
  bake(scene, 'prop_nameplate', 120, 30, (p) => {
    p.rrect(4, 4, 112, 22, 3, 0x9c6f4a);
    p.rrect(10, 8, 100, 14, 2, 0xd9b45a, { lw: 1.2 });
  });
  // [변경 2] week 4 quest props
  const parcel = (p: Pen, x: number, y: number, w: number, h: number) => {
    p.rrect(x, y, w, h, 3, 0xc9a07a);
    p.line(x + w / 2, y, x + w / 2, y + h, 2, 0x7a5236);
    p.line(x, y + h / 2, x + w, y + h / 2, 2, 0x7a5236);
    p.rrect(x + 6, y + 6, w / 2 - 10, h / 2 - 10, 1, 0xfbf1d9, { lw: 1 });
  };
  bake(scene, 'prop_parcel', 70, 56, (p) => parcel(p, 6, 8, 58, 42));
  bake(scene, 'prop_parcels', 120, 90, (p) => {
    parcel(p, 8, 44, 60, 40);
    parcel(p, 58, 48, 56, 36);
    parcel(p, 30, 8, 58, 40);
  });
  bake(scene, 'prop_pharmacy_ledger', 110, 80, (p) => {
    p.rrect(4, 6, 102, 68, 4, 0x7a3b3b);
    p.rect(10, 10, 44, 60, 0xfbf1d9, { lw: 1 });
    p.rect(56, 10, 44, 60, 0xfbf1d9, { lw: 1 });
    for (let i = 0; i < 6; i++) p.line(14, 18 + i * 8, 50, 18 + i * 8, 1, 0x6b6385, 0.6);
  });
  bake(scene, 'prop_daniel_notebook', 64, 86, (p) => {
    p.rrect(6, 6, 52, 76, 4, 0x3b3355);
    p.rect(6, 40, 52, 6, 0x9a96a8, { outline: false });
    p.rrect(18, 16, 28, 12, 2, 0xfbf1d9, { lw: 1.2 });
  });
}
