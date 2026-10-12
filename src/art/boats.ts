import type Phaser from 'phaser';
import { PALETTE, SHADE } from './palette';
import { bake, type Pen } from './pen';

/** Mary Lou side view, bow to the right. Frame 480×240, waterline at y≈196. */
export function drawMaryLou(p: Pen, hullColor: number = SHADE.white): void {
  // hull
  p.poly([30, 150, 440, 128, 470, 112, 452, 172, 420, 214, 70, 214, 40, 190], hullColor);
  p.poly([34, 160, 446, 136, 462, 126, 456, 146, 38, 174], PALETTE.coral, { lw: 2 });
  p.poly([70, 214, 420, 214, 432, 200, 52, 200], PALETTE.seaDeep, { lw: 2 });
  // rail
  p.line(30, 150, 440, 128, 3, PALETTE.ink);
  for (let i = 0; i < 12; i++) {
    const x = 50 + i * 32;
    const y = 149 - i * 1.7;
    p.line(x, y, x, y - 12, 2, PALETTE.ink);
  }
  p.line(44, 136, 430, 116, 2.6, PALETTE.ink);
  // wheelhouse (forward)
  p.rrect(300, 66, 96, 70, 8, PALETTE.mint);
  p.rrect(292, 58, 112, 14, 5, PALETTE.butter);
  p.rrect(312, 80, 22, 22, 4, SHADE.sky);
  p.rrect(342, 80, 22, 22, 4, SHADE.sky);
  p.rrect(372, 80, 16, 22, 4, SHADE.sky);
  // tiny childhood photo tucked in the window frame (D11)
  p.rect(314, 82, 7, 9, 0xfbf1d9, { lw: 1 });
  p.rrect(312, 108, 18, 26, 3, PALETTE.mint);
  // mast + stays
  p.rect(256, 10, 7, 128, SHADE.woodDark, { lw: 2 });
  p.line(259, 14, 150, 132, 1.4, PALETTE.ink, 0.6);
  p.line(259, 14, 380, 66, 1.4, PALETTE.ink, 0.6);
  p.circle(259, 10, 6, PALETTE.coral);
  // winch
  p.rrect(200, 112, 40, 24, 6, SHADE.grey);
  p.circle(220, 124, 9, SHADE.greyDark);
  // net pile at stern
  p.ellipse(90, 132, 70, 22, 0x9fb7a0);
  for (let i = 0; i < 5; i++) p.line(62 + i * 12, 124, 70 + i * 12, 140, 1.2, 0x5f7f60);
}

export function drawCalvinBoat(p: Pen): void {
  p.poly([20, 70, 230, 64, 252, 50, 240, 92, 220, 108, 40, 108, 24, 96], 0xf2ead8);
  p.poly([22, 76, 236, 70, 248, 60, 244, 76, 24, 86], SHADE.tan, { lw: 1.8 });
  p.poly([40, 108, 220, 108, 228, 100, 30, 100], 0x6d6a7a, { lw: 1.8 });
  p.rrect(140, 30, 66, 40, 6, SHADE.tan);
  p.rrect(150, 38, 18, 14, 3, SHADE.sky);
  p.rrect(176, 38, 18, 14, 3, SHADE.sky);
  p.rrect(4, 58, 18, 34, 4, 0x46506e);
  p.line(13, 92, 13, 112, 3, 0x46506e);
  p.rrect(60, 56, 40, 14, 3, 0x8a9a7a);
}

/** Gulls, palms and other small scenery sprites. */
export function generateBoats(scene: Phaser.Scene): void {
  bake(scene, 'boat_marylou', 480, 240, (p) => drawMaryLou(p));
  bake(scene, 'boat_calvin', 260, 120, (p) => drawCalvinBoat(p));
  bake(scene, 'boat_other', 260, 120, (p) => {
    p.poly([20, 70, 230, 64, 252, 50, 240, 92, 220, 108, 40, 108, 24, 96], 0xbfe8f2);
    p.poly([22, 76, 236, 70, 248, 60, 244, 76, 24, 86], 0x5a8fb0, { lw: 1.8 });
    p.rrect(150, 26, 60, 44, 6, 0xfffaf0);
    p.rect(110, 0, 5, 70, SHADE.woodDark, { lw: 1.6 });
  });
  bake(scene, 'sc_gull', 40, 20, (p) => {
    p.path([2, 12, 10, 4, 20, 12, 30, 4, 38, 12], 2.6, PALETTE.ink);
  });
  bake(scene, 'sc_palm', 120, 200, (p) => {
    p.path([60, 196, 64, 150, 60, 100, 66, 56], 9, SHADE.woodDark);
    p.path([60, 196, 64, 150, 60, 100, 66, 56], 5, SHADE.wood);
    const leaf = SHADE.palm;
    p.poly([66, 56, 10, 62, 30, 46], leaf);
    p.poly([66, 56, 116, 66, 96, 44], leaf);
    p.poly([66, 56, 30, 20, 56, 30], leaf);
    p.poly([66, 56, 104, 20, 80, 32], leaf);
    p.poly([66, 56, 66, 6, 76, 30], leaf);
    p.circle(62, 62, 6, 0x9c6f4a);
    p.circle(72, 62, 6, 0x9c6f4a);
  });
  bake(scene, 'sc_buoy', 30, 44, (p) => {
    p.poly([6, 30, 24, 30, 20, 8, 10, 8], PALETTE.coral);
    p.rect(8, 16, 14, 5, 0xfffaf0, { lw: 1.4 });
    p.line(15, 8, 15, 2, 2);
  });
  bake(scene, 'sc_lighthouse', 120, 260, (p) => {
    p.poly([36, 250, 84, 250, 74, 60, 46, 60], 0xfffaf0);
    for (let i = 0; i < 3; i++) p.poly([44 - i * 3, 90 + i * 56, 76 + i * 3, 90 + i * 56, 77 + i * 3, 110 + i * 56, 43 - i * 3, 110 + i * 56], PALETTE.coral, { lw: 1.8 });
    p.rrect(40, 34, 40, 28, 4, PALETTE.butter);
    p.poly([34, 36, 86, 36, 60, 10], PALETTE.ink);
    p.rect(30, 60, 60, 6, PALETTE.ink);
    p.rrect(20, 244, 80, 12, 4, 0x9a96a8);
  });
}
