import type Phaser from 'phaser';
import { PALETTE } from './palette';
import { bake, type Pen } from './pen';
import { FISH, type FishDef } from '../data/fish';

/** [변경 1] Procedural fish textures, facing right. Key: fish_<id>. Frame 100×60 logical. */
export const FISH_FRAME = { w: 100, h: 60 };

function eye(p: Pen, x: number, y: number, r = 3.2) {
  p.circle(x, y, r, 0xffffff, { lw: 1.4 });
  p.circle(x + 0.6, y, r * 0.5, PALETTE.ink, { outline: false });
}

function body(p: Pen, f: FishDef) {
  const [c1, c2] = f.colors;
  switch (f.shape) {
    case 'oval':
      p.poly([16, 30, 4, 16, 6, 30, 4, 44], c2);
      p.ellipse(52, 30, 74, 34, c1);
      p.ellipse(56, 37, 50, 12, 0xffffff, { outline: false, alpha: 0.35 });
      p.poly([42, 14, 54, 6, 66, 14], c2, { lw: 1.6 });
      if (f.id === 'redfish' || f.id === 'oldred') p.circle(24, 26, 4, PALETTE.ink, { outline: false });
      if (f.id === 'spot') p.circle(44, 22, 3.6, PALETTE.ink, { outline: false });
      if (f.id === 'pinfish') for (let i = 0; i < 4; i++) p.line(36 + i * 9, 18, 34 + i * 9, 40, 1.6, 0x5d6b8a, 0.7);
      eye(p, 78, 26);
      break;
    case 'slim':
      p.poly([14, 30, 2, 18, 4, 30, 2, 42], c2);
      p.ellipse(52, 30, 82, 24, c1);
      if (f.id === 'specktrout') for (let i = 0; i < 9; i++) p.circle(30 + i * 6, 26 + (i % 3) * 3, 1.4, PALETTE.ink, { outline: false });
      if (f.id === 'spanishmackerel') for (let i = 0; i < 6; i++) p.circle(34 + i * 8, 30, 2, 0xe0c060, { outline: false });
      p.poly([46, 19, 56, 12, 62, 19], c2, { lw: 1.4 });
      eye(p, 84, 27, 2.8);
      break;
    case 'long':
      p.poly([10, 30, 0, 22, 2, 30, 0, 38], c2);
      p.ellipse(50, 30, 86, 16, c1);
      if (f.id === 'needlefish') p.poly([88, 28, 99, 30, 88, 32], c2, { lw: 1.2 });
      if (f.id === 'barracuda') for (let i = 0; i < 5; i++) p.line(30 + i * 10, 24, 28 + i * 10, 34, 2, PALETTE.ink, 0.6);
      eye(p, 82, 28, 2.6);
      break;
    case 'tall':
      p.poly([18, 30, 4, 12, 6, 30, 4, 48], c2);
      p.ellipse(52, 30, 66, 46, c1);
      if (f.id === 'sheepshead') for (let i = 0; i < 5; i++) p.line(32 + i * 9, 10, 32 + i * 9, 50, 3.2, c2, 0.85);
      p.poly([40, 9, 54, 2, 68, 9], c2, { lw: 1.6 });
      if (f.id === 'sheepshead') {
        p.rect(80, 33, 8, 5, 0xffffff, { lw: 1 });
        p.line(84, 33, 84, 38, 0.8, PALETTE.ink);
      }
      eye(p, 74, 24);
      break;
    case 'flat':
      p.ellipse(50, 32, 84, 30, c1);
      for (let i = 0; i < 7; i++) p.circle(28 + i * 9, 30 + (i % 2) * 5, 2.4, c2, { outline: false });
      eye(p, 76, 24, 2.4);
      eye(p, 70, 22, 2.4);
      break;
    case 'ray':
      p.poly([50, 10, 92, 30, 50, 50, 8, 30], c1);
      p.line(8, 30, -0, 30, 2.4, c2);
      for (let i = 0; i < 6; i++) p.circle(40 + (i % 3) * 10, 24 + Math.floor(i / 3) * 12, 2, c2, { outline: false });
      eye(p, 62, 26, 2);
      break;
    case 'eel':
      p.path([4, 34, 20, 26, 36, 34, 52, 26, 68, 32, 90, 28], 9, c1);
      p.path([4, 34, 20, 26, 36, 34, 52, 26, 68, 32, 90, 28], 2.4, PALETTE.ink, 0.5);
      eye(p, 88, 26, 2.2);
      break;
    case 'octopus':
      for (let i = 0; i < 6; i++) p.path([40 + i * 6, 36, 34 + i * 8, 48, 40 + i * 7, 56], 4, c2);
      p.ellipse(56, 26, 42, 36, c1);
      eye(p, 50, 28, 3);
      eye(p, 64, 28, 3);
      break;
    case 'seahorse':
      p.path([50, 10, 58, 22, 54, 36, 46, 48, 52, 54], 9, c1);
      p.poly([56, 12, 70, 14, 58, 20], c1, { lw: 1.4 });
      for (let i = 0; i < 4; i++) p.line(52, 18 + i * 8, 46, 18 + i * 8, 1.6, c2);
      eye(p, 58, 15, 2);
      break;
    case 'shark':
      p.poly([14, 30, 0, 12, 4, 30, 0, 44], c1);
      p.ellipse(52, 31, 80, 26, c1);
      p.ellipse(56, 37, 60, 10, c2, { outline: false });
      p.poly([44, 19, 54, 2, 60, 19], c1, { lw: 1.6 });
      if (f.id === 'bonnethead') p.ellipse(90, 30, 12, 18, c1, { lw: 1.6 });
      eye(p, 82, 27, 2.2);
      break;
    case 'big':
      p.poly([14, 30, 0, 8, 6, 30, 0, 52], c2);
      p.ellipse(54, 30, 80, 46, c1);
      p.ellipse(58, 40, 56, 14, 0xffffff, { outline: false, alpha: f.id === 'tarpon' ? 0.6 : 0.25 });
      if (f.id === 'tarpon') for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) p.arc(30 + i * 9, 20 + r * 8, 4, 200, 340, 1.2, 0x7d8a9a);
      if (f.id === 'goliath' || f.id === 'grouper') for (let i = 0; i < 6; i++) p.ellipse(30 + i * 10, 26 + (i % 2) * 8, 8, 6, c2, { outline: false, alpha: 0.6 });
      if (f.id === 'oldred') {
        p.circle(26, 24, 4, PALETTE.ink, { outline: false });
        p.circle(32, 34, 3.4, PALETTE.ink, { outline: false });
      }
      p.poly([40, 9, 54, 0, 70, 9], c2, { lw: 1.6 });
      p.arc(88, 36, 8, 100, 200, 2.2);
      eye(p, 80, 24, 3.6);
      break;
    case 'puffer':
      p.circle(50, 30, 22, c1);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        p.line(50 + Math.cos(a) * 22, 30 + Math.sin(a) * 22, 50 + Math.cos(a) * 27, 30 + Math.sin(a) * 27, 1.6, c2);
      }
      p.poly([28, 30, 20, 22, 20, 38], c2, { lw: 1.4 });
      eye(p, 62, 24, 3);
      break;
  }
}

export function fishTexKey(id: string): string {
  return `fish_${id}`;
}

export function generateFish(scene: Phaser.Scene): void {
  for (const f of FISH) bake(scene, fishTexKey(f.id), FISH_FRAME.w, FISH_FRAME.h, (p) => body(p, f));
  // golden shrimp (rare net find)
  bake(scene, 'it_goldshrimp', 64, 44, (p) => {
    p.ellipse(32, 24, 44, 20, 0xffd45e);
    p.ellipse(32, 24, 30, 10, 0xfff3b0, { outline: false });
    p.poly([10, 24, 0, 16, 2, 32], 0xffb84a);
    p.circle(50, 21, 2, PALETTE.ink, { outline: false });
    p.path([52, 18, 62, 8], 1.4, 0xd9a040);
  });
  // soft dark vignette with a hole (legendary darkness)
  if (scene.textures.exists('fx_dark_hole')) scene.textures.remove('fx_dark_hole');
  const tex = scene.textures.createCanvas('fx_dark_hole', 512, 512);
  if (tex) {
    const ctx = tex.getContext();
    const g = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
    g.addColorStop(0, 'rgba(8,8,20,0)');
    g.addColorStop(0.3, 'rgba(8,8,20,0.75)');
    g.addColorStop(1, 'rgba(8,8,20,0.97)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    tex.refresh();
  }
}
