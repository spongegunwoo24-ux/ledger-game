import Phaser from 'phaser';
import type { BackdropKey } from '../core/events';
import type { Segment } from '../core/types';
import { PALETTE, SHADE, TINTS, FONT_TITLE, FONT_HAND } from './palette';
import { Pen } from './pen';
import { addSprite } from './manifest';
import { txt } from '../ui/text';

/**
 * Procedural backdrops for location and cutscene scenes (1280×720).
 * Interiors: wall 0–470, floor 470–720. Actors stand with feet at y≈540.
 */

type C = Phaser.GameObjects.Container;

function gradient(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, top: number, bottom: number) {
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(x, y, w, h);
}

function skyColors(seg: Segment): [number, number] {
  switch (seg) {
    case 'dawn':
      return [0xb9a6dc, 0xffc7c2];
    case 'morning':
      return [0x9fdcef, 0xfff0c4];
    case 'evening':
      return [0x8f86c8, 0xffb37a];
    case 'night':
      return [0x1d2550, 0x3d4a7a];
    default:
      return [0x8fd6ec, 0xd8f3f8];
  }
}

function sun(p: Pen, seg: Segment, x = 980, y = 120) {
  if (seg === 'night') {
    p.circle(x, y, 26, 0xfff3d6, { outline: false });
    p.circle(x + 10, y - 6, 22, 0x1d2550, { outline: false });
    for (let i = 0; i < 30; i++) {
      p.circle((i * 211) % 1280, ((i * 97) % 260) + 10, 1.6, 0xfff3d6, { outline: false, alpha: 0.8 });
    }
    return;
  }
  const c = seg === 'evening' ? 0xff9a5c : seg === 'dawn' ? 0xffc7a8 : PALETTE.butter;
  p.circle(x, y + (seg === 'evening' || seg === 'dawn' ? 160 : 0), 46, c, { outline: false, alpha: 0.9 });
}

function clouds(p: Pen, n = 4, y = 80) {
  for (let i = 0; i < n; i++) {
    const x = 120 + i * 300 + (i % 2) * 60;
    const yy = y + (i % 3) * 30;
    p.ellipse(x, yy, 120, 34, 0xffffff, { outline: false, alpha: 0.8 });
    p.ellipse(x + 40, yy - 14, 80, 34, 0xffffff, { outline: false, alpha: 0.8 });
  }
}

function seaBand(p: Pen, y: number, h: number) {
  p.rect(0, y, 1280, h, PALETTE.sea, { outline: false });
  for (let i = 0; i < 18; i++) {
    const x = (i * 157) % 1280;
    const yy = y + 12 + ((i * 37) % Math.max(10, h - 20));
    p.path([x, yy, x + 14, yy - 5, x + 28, yy], 2, 0xffffff, 0.6);
  }
}

function house(p: Pen, x: number, y: number, w: number, h: number, wall: number, roof: number, door = true) {
  p.rect(x, y, w, h, wall);
  for (let i = 1; i < h / 16; i++) p.line(x + 2, y + i * 16, x + w - 2, y + i * 16, 1.2, 0x000000, 0.08);
  p.poly([x - 14, y + 2, x + w / 2, y - h * 0.45, x + w + 14, y + 2], roof);
  if (door) p.rrect(x + w / 2 - 18, y + h - 54, 36, 54, 4, SHADE.woodDark);
  p.rrect(x + 16, y + 20, 34, 30, 4, SHADE.sky);
  p.rrect(x + w - 50, y + 20, 34, 30, 4, SHADE.sky);
}

function windowFrame(p: Pen, x: number, y: number, w: number, h: number, seg: Segment) {
  const [a, b] = skyColors(seg);
  p.rrect(x - 8, y - 8, w + 16, h + 16, 6, SHADE.woodLight);
  gradient(p.g, x, y, w, h, a, b);
  p.g.lineStyle(3, PALETTE.ink, 1);
  p.g.strokeRect(x, y, w, h);
  p.line(x + w / 2, y, x + w / 2, y + h, 3);
  p.line(x, y + h / 2, x + w, y + h / 2, 3);
}

function interior(p: Pen, wall: number, floor: number, stripe = true) {
  p.rect(0, 0, 1280, 470, wall, { outline: false });
  if (stripe) for (let i = 0; i < 1280; i += 64) p.rect(i, 0, 28, 470, 0xffffff, { outline: false, alpha: 0.12 });
  p.rect(0, 380, 1280, 90, 0x000000, { outline: false, alpha: 0.05 });
  p.line(0, 380, 1280, 380, 3, 0x000000, 0.12);
  p.rect(0, 470, 1280, 250, floor, { outline: false });
  for (let i = 0; i < 6; i++) p.line(0, 490 + i * 42, 1280, 490 + i * 42, 2, 0x000000, 0.08);
  p.line(0, 470, 1280, 470, 4, PALETTE.ink);
}

function outdoorBase(p: Pen, seg: Segment, horizon = 330, ground: number = PALETTE.sand) {
  const [a, b] = skyColors(seg);
  gradient(p.g, 0, 0, 1280, horizon, a, b);
  sun(p, seg);
  if (seg !== 'night') clouds(p);
  p.rect(0, horizon, 1280, 720 - horizon, ground, { outline: false });
}

function label(c: C, scene: Phaser.Scene, x: number, y: number, s: string, size = 22, color = '#3B3355', font?: string) {
  const t = txt(scene, x, y, s, { size, color, fontFamily: font }).setOrigin(0.5);
  c.add(t);
  return t;
}

function shelf(p: Pen, x: number, y: number, w: number, items: number[]) {
  p.rect(x, y, w, 10, SHADE.wood);
  items.forEach((col, i) => {
    const ix = x + 16 + i * ((w - 32) / Math.max(1, items.length - 1));
    p.rrect(ix - 9, y - 30, 18, 30, 4, col);
  });
}

function table(p: Pen, x: number, y: number, w: number) {
  p.rect(x + 10, y + 12, 10, 70, SHADE.woodDark);
  p.rect(x + w - 20, y + 12, 10, 70, SHADE.woodDark);
  p.rrect(x, y, w, 16, 4, SHADE.wood);
}

function candleRow(p: Pen, x: number, y: number, n: number) {
  for (let i = 0; i < n; i++) {
    const cx = x + i * 26;
    p.rrect(cx - 6, y - 26, 12, 26, 3, 0xfffaf0);
    p.ellipse(cx, y - 34, 8, 14, PALETTE.butter, { outline: false });
    p.ellipse(cx, y - 32, 4, 7, 0xffa45c, { outline: false });
  }
}

export interface BackdropOpts {
  seg?: Segment;
  /** church candle count (D13) */
  candles?: number;
  /** population sign number (D12) */
  population?: number;
}

/** Builds a backdrop container (depth 0). */
export function drawBackdrop(scene: Phaser.Scene, key: BackdropKey, o: BackdropOpts = {}): C {
  const seg = o.seg ?? 'afternoon';
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  c.add(g);
  const p = new Pen(g, 1);
  switch (key) {
    case 'black':
      p.rect(0, 0, 1280, 720, 0x15121f, { outline: false });
      break;

    case 'cemetery': {
      outdoorBase(p, seg, 360, SHADE.grass);
      p.rect(0, 300, 1280, 60, PALETTE.sea, { outline: false });
      p.rect(0, 356, 1280, 8, SHADE.foam, { outline: false, alpha: 0.6 });
      for (let i = 0; i < 9; i++) {
        const x = 60 + i * 150;
        const y = 420 + (i % 3) * 30;
        p.rrect(x, y - 60, 52, 64, 22, 0xdcd8e6);
        p.line(x + 16, y - 30, x + 36, y - 30, 2, 0x9a96a8);
      }
      // fresh grave
      p.ellipse(640, 600, 260, 70, 0x9c7a5a);
      p.rrect(610, 470, 60, 90, 6, 0xd9d4e3);
      label(c, scene, 640, 505, 'W. H.', 16, '#6b6385');
      c.add(addSprite(scene, 1180, 380, 'sc_palm', 0.9));
      c.add(addSprite(scene, 90, 380, 'sc_palm', 0.8));
      break;
    }

    case 'bank': {
      interior(p, 0xd8e9e0, 0xc9b9a0);
      windowFrame(p, 80, 90, 200, 160, seg);
      p.rrect(420, 60, 440, 60, 8, PALETTE.mint);
      label(c, scene, 640, 90, '걸프 코스트 저축은행', 26, '#3B3355', FONT_TITLE);
      // counter with Priya's desk
      p.rrect(330, 380, 620, 110, 8, SHADE.wood);
      p.rect(330, 380, 620, 18, SHADE.woodLight);
      // open drawer with Daniel's nameplate (visible, unremarked)
      p.rect(760, 420, 130, 40, SHADE.woodDark);
      p.rect(768, 424, 114, 30, 0x6d4f36, { outline: false });
      c.add(addSprite(scene, 825, 438, 'prop_nameplate', 0.8));
      label(c, scene, 825, 438, 'DANIEL WEBB', 10, '#4a3a20');
      p.rrect(1000, 160, 180, 220, 6, 0xb9b4c7);
      p.circle(1090, 270, 50, 0x9a96a8);
      p.circle(1090, 270, 20, 0xd9d4e3);
      // calendar
      p.rect(470, 160, 90, 110, 0xfffaf0);
      p.rect(470, 160, 90, 26, PALETTE.coral);
      break;
    }

    case 'dock':
    case 'dockDusk': {
      const sg = key === 'dockDusk' ? 'evening' : seg;
      outdoorBase(p, sg, 300, PALETTE.sea);
      seaBand(p, 300, 420);
      c.add(addSprite(scene, 1180, 250, 'sc_lighthouse', 0.7));
      // pier planks
      p.rect(0, 470, 1280, 250, SHADE.wood);
      for (let i = 0; i < 1280; i += 80) p.line(i, 470, i, 720, 2, SHADE.woodDark);
      p.line(0, 470, 1280, 470, 4, PALETTE.ink);
      for (let i = 0; i < 8; i++) p.rect(40 + i * 170, 470, 18, 60, SHADE.woodDark);
      // bollard
      p.rrect(1010, 440, 34, 40, 8, 0x6d6a7a);
      c.add(addSprite(scene, 320, 420, 'boat_marylou', 0.8));
      c.add(addSprite(scene, 120, 640, 'bin_crate', 0.9));
      break;
    }

    case 'church': {
      interior(p, 0xf3ead8, 0xc9a07a, false);
      // arched windows with lilac glass
      for (let i = 0; i < 3; i++) {
        const x = 150 + i * 450;
        p.rrect(x, 80, 120, 230, 60, PALETTE.lilac);
        p.line(x + 60, 80, x + 60, 310, 3);
        p.line(x, 200, x + 120, 200, 3);
      }
      p.rrect(560, 220, 160, 160, 10, 0xfffaf0);
      p.rect(634, 140, 12, 90, 0xd9b45a);
      p.rect(610, 165, 60, 12, 0xd9b45a);
      // candles (missing-persons candles: D13)
      p.rect(860, 360, 280, 30, SHADE.woodDark);
      candleRow(p, 880, 360, o.candles ?? 7);
      for (let i = 0; i < 3; i++) {
        p.rrect(80 + i * 150, 520 + (i % 2) * 6, 130, 30, 6, SHADE.woodDark);
        p.rrect(820 + i * 150, 520 + (i % 2) * 6, 130, 30, 6, SHADE.woodDark);
      }
      break;
    }

    case 'home':
    case 'homeNight': {
      const night = key === 'homeNight';
      interior(p, night ? 0x8f8ab0 : 0xe8d9c4, night ? 0x7a6a5a : 0xb89a7a);
      windowFrame(p, 90, 100, 180, 150, night ? 'night' : seg);
      // case wall
      p.rect(470, 60, 330, 250, 0xd9b48a);
      for (let i = 0; i < 6; i++) p.rect(490 + (i % 3) * 100, 80 + Math.floor(i / 3) * 110, 80, 90, 0xfffaf0, { lw: 2 });
      p.path([530, 125, 630, 125, 730, 235], 2, PALETTE.killerRed, 0.8);
      // shelf
      p.rect(900, 150, 280, 12, SHADE.wood);
      p.rect(900, 260, 280, 12, SHADE.wood);
      // armchair and lamp
      p.rrect(860, 420, 170, 110, 26, night ? 0x8a7aa8 : PALETTE.lilac);
      p.rrect(880, 380, 130, 70, 22, night ? 0x9a8ab8 : 0xd9c9ef);
      p.rect(1100, 320, 8, 200, 0x6d6a7a);
      p.poly([1070, 330, 1138, 330, 1124, 280, 1084, 280], PALETTE.butter);
      if (night) p.circle(1104, 330, 90, PALETTE.butter, { outline: false, alpha: 0.18 });
      table(p, 260, 470, 200);
      break;
    }

    case 'wheelhouse': {
      interior(p, PALETTE.mint, SHADE.wood, false);
      windowFrame(p, 120, 70, 1040, 220, seg);
      p.rrect(520, 330, 240, 120, 10, SHADE.woodDark);
      p.circle(640, 360, 70, SHADE.wood);
      p.circle(640, 360, 20, SHADE.woodDark);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        p.line(640 + Math.cos(a) * 20, 360 + Math.sin(a) * 20, 640 + Math.cos(a) * 88, 360 + Math.sin(a) * 88, 6, SHADE.woodDark);
      }
      // childhood photo in the window frame (D11)
      p.rect(128, 78, 46, 56, 0xfbf1d9, { lw: 2 });
      p.circle(151, 100, 9, SHADE.skin, { lw: 1.4 });
      p.rect(141, 110, 20, 18, 0xa9a6b5, { lw: 1.4 });
      break;
    }

    case 'diner': {
      interior(p, 0xffe0e3, 0xd9e4ec);
      for (let x = 0; x < 1280; x += 40) for (let y = 470; y < 720; y += 40) if (((x + y) / 40) % 2 === 0) p.rect(x, y, 40, 40, 0xffffff, { outline: false, alpha: 0.7 });
      p.line(0, 470, 1280, 470, 4, PALETTE.ink);
      windowFrame(p, 70, 90, 260, 170, seg);
      // neon sign
      p.rrect(430, 50, 420, 70, 30, 0x3b3355);
      label(c, scene, 640, 85, '로사의 식당', 34, '#FF8B94', FONT_TITLE);
      // counter + stools
      p.rrect(380, 330, 760, 150, 10, PALETTE.mint);
      p.rect(380, 330, 760, 20, 0xfffaf0);
      for (let i = 0; i < 6; i++) {
        p.rect(430 + i * 120, 500, 10, 60, 0x9a96a8);
        p.ellipse(435 + i * 120, 500, 64, 22, PALETTE.coral);
      }
      // mug wall: Sal's mug on its hook (D14)
      for (let i = 0; i < 7; i++) {
        p.line(920 + i * 40, 170, 920 + i * 40, 180, 2);
        p.rrect(908 + i * 40, 180, 24, 26, 4, i === 3 ? 0xffe29a : 0xfffaf0);
      }
      label(c, scene, 1040, 225, 'SAL', 11, '#9a7a3a');
      break;
    }

    case 'sheriff': {
      interior(p, 0xe6dcc8, 0xa89a88);
      windowFrame(p, 80, 100, 160, 140, seg);
      p.rrect(420, 60, 440, 56, 8, 0x8a5a3a);
      label(c, scene, 640, 88, '보안관 사무소', 26, '#FFF3D6', FONT_TITLE);
      // poster: re-election
      p.rect(920, 140, 170, 210, 0xfffaf0);
      label(c, scene, 1005, 180, '던바를', 22, '#D7263D', FONT_TITLE);
      label(c, scene, 1005, 215, '다시 한번!', 22, '#D7263D', FONT_TITLE);
      label(c, scene, 1005, 270, '펠리컨 코브를\n지킨 보안관', 15, '#3B3355');
      p.rrect(330, 380, 400, 100, 6, SHADE.woodDark);
      p.rect(350, 360, 80, 24, 0xfffaf0);
      p.rect(1120, 160, 120, 300, 0x9a96a8);
      for (let i = 0; i < 5; i++) p.line(1130 + i * 24, 160, 1130 + i * 24, 460, 4, 0x6d6a7a);
      break;
    }

    case 'fishMarket': {
      outdoorBase(p, seg, 300, 0xd9e4ec);
      p.rect(0, 120, 1280, 40, PALETTE.coral);
      for (let i = 0; i < 16; i++) p.rect(i * 80, 120, 40, 40, 0xfffaf0, { outline: false });
      p.poly([0, 160, 1280, 160, 1280, 200, 0, 200], PALETTE.coral, { alpha: 0.3, outline: false });
      label(c, scene, 640, 80, '펠리컨 코브 어시장', 34, '#3B3355', FONT_TITLE);
      for (let i = 0; i < 4; i++) {
        p.rrect(80 + i * 300, 360, 240, 110, 10, 0xb9e0ec);
        for (let j = 0; j < 8; j++) p.ellipse(110 + i * 300 + j * 26, 380, 22, 14, j % 2 ? SHADE.shrimp : 0xd9d3a8, { lw: 1.4 });
      }
      break;
    }

    case 'secondhand': {
      interior(p, 0xf2e2f0, 0xc9a07a);
      label(c, scene, 640, 60, '메이블의 중고품점', 30, '#3B3355', FONT_TITLE);
      shelf(p, 80, 200, 380, [PALETTE.coral, PALETTE.mint, PALETTE.butter, PALETTE.lilac, 0xb9b4c7]);
      shelf(p, 80, 320, 380, [0xffc7a8, 0xa8e6cf, 0xc9b6e4, 0xffe29a]);
      p.rrect(820, 330, 260, 140, 16, PALETTE.lilac);
      p.rrect(840, 300, 220, 60, 16, 0xd9c9ef);
      p.rect(560, 120, 160, 200, 0xd9b45a);
      p.rect(575, 135, 130, 170, 0xbfe8f2);
      break;
    }

    case 'pawn': {
      interior(p, 0xd4d8c8, 0x8f8a7a);
      label(c, scene, 640, 60, '빈스 전당포 · 사고 팝니다', 28, '#3B3355', FONT_TITLE);
      p.rect(0, 380, 1280, 10, 0x6d6a7a, { outline: false });
      for (let i = 0; i < 10; i++) p.line(100 + i * 110, 100, 100 + i * 110, 300, 3, 0x6d6a7a);
      p.rrect(160, 140, 140, 60, 10, 0x9c6f4a);
      p.circle(520, 180, 40, 0xd9b45a);
      p.rrect(860, 130, 60, 160, 20, 0x9c6f4a);
      p.rrect(330, 380, 620, 100, 6, 0xb9b4c7);
      break;
    }

    case 'pharmacy': {
      outdoorBase(p, seg, 520, 0xd9d4e3);
      house(p, 320, 160, 640, 360, 0xe6f2ec, 0x9a96a8, false);
      p.rrect(560, 340, 160, 180, 6, 0x8fa8b8);
      p.rrect(575, 360, 130, 90, 4, 0xbfe8f2, { alpha: 0.6 });
      p.rect(590, 380, 100, 50, 0xf5ead2, { lw: 2 });
      label(c, scene, 640, 405, '곧 돌아옵니다', 13, '#b0a890');
      label(c, scene, 640, 210, 'PIKE 약국', 30, '#9a96a8', FONT_TITLE);
      break;
    }

    case 'calvinCabin': {
      interior(p, 0xe2c9a0, 0x9c7a5a);
      windowFrame(p, 90, 110, 180, 140, seg);
      // wall of framed knots
      for (let i = 0; i < 12; i++) {
        const x = 420 + (i % 6) * 100;
        const y = 90 + Math.floor(i / 6) * 130;
        p.rect(x, y, 80, 100, 0x6d4f36);
        p.rect(x + 8, y + 8, 64, 72, 0xfbf1d9, { lw: 1.6 });
        if (i < 11) {
          p.circle(x + 40, y + 40, 12, 0xffffff, { alpha: 0, lw: 2.4, stroke: 0xc9a06a });
          p.path([x + 22, y + 60, x + 34, y + 44, x + 46, y + 36, x + 58, y + 22], 2.4, 0xc9a06a);
        }
        p.rect(x + 22, y + 82, 36, 10, 0xffffff, { lw: 1 });
      }
      p.rrect(1080, 380, 160, 100, 10, SHADE.woodDark);
      p.rrect(60, 380, 200, 90, 8, 0x8a9a7a);
      break;
    }

    case 'calvinYard': {
      outdoorBase(p, seg, 330, SHADE.grass);
      house(p, 760, 120, 380, 220, 0xf2ead8, SHADE.tan);
      p.rect(0, 330, 1280, 6, 0x000000, { outline: false, alpha: 0.05 });
      for (let i = 0; i < 12; i++) p.rect(20 + i * 60, 300, 10, 60, 0xfffaf0);
      p.line(0, 315, 720, 315, 4, 0xfffaf0);
      // shrimp boil pot
      p.rrect(420, 430, 140, 110, 12, 0x9a96a8);
      p.ellipse(490, 430, 140, 30, 0xb9b4c7);
      for (let i = 0; i < 3; i++) p.path([460 + i * 30, 410, 470 + i * 30, 380, 460 + i * 30, 350], 3, 0xffffff, 0.6);
      table(p, 620, 470, 300);
      for (let i = 0; i < 6; i++) p.ellipse(660 + i * 44, 466, 24, 12, SHADE.shrimp, { lw: 1.4 });
      for (let i = 0; i < 5; i++) {
        const x = 80 + i * 260;
        p.line(x, 240, x + 260, 250, 1.6, PALETTE.ink, 0.6);
        p.circle(x + 130, 252, 8, [PALETTE.butter, PALETTE.coral, PALETTE.mint][i % 3], { lw: 1.4 });
      }
      break;
    }

    case 'gusHouse': {
      interior(p, 0xc9d3e0, 0x8a7a6a);
      windowFrame(p, 100, 110, 150, 130, seg);
      p.rect(480, 100, 200, 140, 0xd9b48a);
      p.circle(580, 170, 46, 0xfff3d6, { lw: 2 });
      table(p, 380, 450, 280);
      p.rrect(860, 380, 300, 90, 8, 0x6d7fa8);
      p.rrect(880, 350, 120, 50, 14, 0xe8e2ef);
      p.rect(1180, 120, 40, 260, SHADE.woodDark);
      break;
    }

    case 'edithHouse': {
      interior(p, 0xf2e6d6, 0xb8a080);
      windowFrame(p, 100, 110, 170, 140, seg);
      p.rect(500, 120, 120, 150, 0xd9c9ef);
      p.rect(660, 140, 100, 120, 0xffd6c4);
      for (let i = 0; i < 5; i++) p.rrect(360 + i * 130, 480, 100, 70, 6, 0xd9b48a);
      break;
    }

    case 'board': {
      outdoorBase(p, seg, 380, 0xe6dcc8);
      house(p, 40, 170, 260, 210, PALETTE.mint, PALETTE.coral);
      house(p, 980, 170, 260, 210, 0xffe0e3, 0x9fb7c9);
      // notice board
      p.rect(470, 170, 14, 280, SHADE.woodDark);
      p.rect(796, 170, 14, 280, SHADE.woodDark);
      p.rrect(440, 150, 400, 230, 8, 0xc99a6b);
      p.rect(456, 166, 368, 198, 0xb07a4f, { lw: 2 });
      const colors = [0xfffaf0, 0xf5ead2, 0xece2c8, 0xe2d6b8, 0xd8ccae, 0xcfc4a6, 0xc6bc9e];
      for (let i = 0; i < 7; i++) {
        const x = 470 + (i % 4) * 88;
        const y = 180 + Math.floor(i / 4) * 92;
        p.rect(x, y, 76, 84, colors[i], { lw: 1.6 });
        p.circle(x + 38, y + 32, 14, 0xd9d4e3, { lw: 1.2 });
        p.line(x + 14, y + 60, x + 62, y + 60, 1.4, 0x9a96a8);
        p.line(x + 14, y + 70, x + 52, y + 70, 1.4, 0x9a96a8);
      }
      label(c, scene, 640, 400, '실종 — 연락 바람', 16, '#6b6385');
      break;
    }

    case 'lighthouse': {
      outdoorBase(p, seg, 360, PALETTE.sea);
      seaBand(p, 360, 360);
      p.poly([700, 720, 760, 520, 900, 470, 1280, 450, 1280, 720], 0xb9b4c7);
      p.poly([780, 520, 900, 480, 1000, 500, 920, 560], 0xd9d4e3, { outline: false });
      c.add(addSprite(scene, 1050, 330, 'sc_lighthouse', 1.2));
      break;
    }

    case 'dunes':
    case 'boathouse': {
      outdoorBase(p, seg, 300, PALETTE.sand);
      p.rect(0, 280, 1280, 40, PALETTE.sea, { outline: false });
      p.poly([0, 420, 200, 330, 420, 400, 640, 320, 900, 410, 1100, 340, 1280, 380, 1280, 720, 0, 720], 0xf0d8a0);
      for (let i = 0; i < 14; i++) p.path([60 + i * 90, 400 + (i % 3) * 20, 66 + i * 90, 370 + (i % 3) * 20], 3, 0x9fbf7a);
      if (key === 'boathouse') {
        p.rect(560, 200, 420, 240, 0xb8a080);
        p.poly([540, 206, 770, 120, 1000, 206], 0x9a7a5a);
        p.rect(640, 300, 260, 140, 0x5a4a3a);
        for (let i = 0; i < 6; i++) p.line(560, 220 + i * 36, 980, 220 + i * 36, 1.6, 0x7a6a5a);
        p.rect(560, 436, 420, 26, 0x6d5a4a);
      }
      break;
    }

    case 'courthouse': {
      interior(p, 0xe6e0d0, 0x9c7a5a, false);
      for (let i = 0; i < 4; i++) p.rect(140 + i * 300, 60, 40, 320, 0xf5ead2);
      p.rrect(520, 200, 240, 200, 8, SHADE.woodDark);
      p.circle(640, 120, 50, 0xd9b45a);
      break;
    }

    case 'deck':
    case 'sea':
    default: {
      outdoorBase(p, seg, 280, PALETTE.sea);
      seaBand(p, 280, 440);
      break;
    }
  }
  return c;
}

/** Color-grading overlay rectangle for the segment (time of day). */
export function addTint(scene: Phaser.Scene, seg: Segment, depth = 50): Phaser.GameObjects.Rectangle {
  const t = TINTS[seg];
  return scene.add.rectangle(0, 0, 1280, 720, t.color, t.alpha).setOrigin(0).setDepth(depth).setBlendMode(Phaser.BlendModes.MULTIPLY);
}

export { FONT_HAND, SHADE };
