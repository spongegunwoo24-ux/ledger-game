import Phaser from 'phaser';
import { PALETTE, FONT_HAND, FONT_TITLE, CSS } from '../art/palette';
import { TEX_SCALE } from '../art/pen';
import { hashFloat } from '../core/rng';
import { sfx } from '../audio/sfx';
import { panel } from './Button';
import { txt } from './text';

const DEPTH = 1200;

function clickToClose(scene: Phaser.Scene, objs: Phaser.GameObjects.GameObject[], delay = 300): Promise<void> {
  return new Promise((res) => {
    const zone = scene.add.zone(0, 0, 1280, 720).setOrigin(0).setDepth(DEPTH + 50).setInteractive();
    let armed = false;
    scene.time.delayedCall(delay, () => (armed = true));
    let closed = false;
    const close = () => {
      if (!armed || closed) return;
      closed = true;
      window.removeEventListener('keydown', onKey);
      zone.destroy();
      objs.forEach((o) => o.destroy());
      res();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') close();
    };
    zone.on('pointerdown', close);
    window.addEventListener('keydown', onKey);
  });
}

/** Big item reveal with caption. */
export function showItem(scene: Phaser.Scene, key: string, caption?: string): Promise<void> {
  sfx('chime');
  const shade = scene.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.45).setOrigin(0).setDepth(DEPTH);
  const glow = scene.add.image(640, 300, 'fx_sparkle').setScale(6).setAlpha(0.5).setDepth(DEPTH);
  scene.tweens.add({ targets: glow, angle: 360, duration: 6000, repeat: -1 });
  const img = scene.add
    .image(640, 300, scene.textures.exists(key) ? key : 'fx_sparkle')
    .setScale(3.2 / TEX_SCALE)
    .setDepth(DEPTH + 1);
  scene.tweens.add({ targets: img, scale: { from: 1 / TEX_SCALE, to: 3.2 / TEX_SCALE }, duration: 300, ease: 'Back.Out' });
  const objs: Phaser.GameObjects.GameObject[] = [shade, glow, img];
  if (caption) {
    const t = txt(scene, 640, 470, caption, { size: 26, color: '#FFF3D6', align: 'center', wordWrap: { width: 900 } })
      .setOrigin(0.5)
      .setDepth(DEPTH + 1);
    objs.push(t);
  }
  return clickToClose(scene, objs);
}

/** Full-screen chapter/title card. */
export function titleCard(scene: Phaser.Scene, title: string, sub?: string): Promise<void> {
  const bg = scene.add.rectangle(0, 0, 1280, 720, 0x2a2440, 1).setOrigin(0).setDepth(DEPTH).setAlpha(0);
  const t = txt(scene, 640, sub ? 330 : 360, title, { size: 52, color: '#FFE29A', fontFamily: FONT_TITLE, align: 'center' })
    .setOrigin(0.5)
    .setDepth(DEPTH + 1)
    .setAlpha(0);
  const objs: Phaser.GameObjects.GameObject[] = [bg, t];
  const targets: Phaser.GameObjects.GameObject[] = [bg, t];
  if (sub) {
    const s = txt(scene, 640, 410, sub, { size: 24, color: '#F5E3B3', align: 'center', wordWrap: { width: 1000 } })
      .setOrigin(0.5)
      .setDepth(DEPTH + 1)
      .setAlpha(0);
    objs.push(s);
    targets.push(s);
  }
  scene.tweens.add({ targets, alpha: 1, duration: 600 });
  return clickToClose(scene, objs, 900);
}

export interface LetterLook {
  /** 0..1 handwriting shakiness */
  jitter?: number;
  /** number of 검열필 stamps */
  stamps?: number;
  seed?: number;
  /** pen color */
  ink?: string;
  /** shrimp doodle (L01, D18) */
  shrimpDoodle?: boolean;
  footer?: string;
}

/**
 * Lined prison-paper letter view with handwriting jitter and censorship stamps (D17).
 * Returns the container; caller destroys it.
 */
export function buildLetter(scene: Phaser.Scene, title: string, body: string, look: LetterLook = {}): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0).setDepth(DEPTH);
  const shade = scene.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.5).setOrigin(0);
  c.add(shade);
  const g = scene.add.graphics();
  c.add(g);
  const x = 240;
  const y = 30;
  const w = 800;
  const h = 640;
  panel(g, x, y, w, h, 0xfbf6e8, 8);
  g.lineStyle(1.5, 0x9fc3e0, 0.8);
  for (let ly = y + 110; ly < y + h - 20; ly += 38) g.lineBetween(x + 20, ly, x + w - 20, ly);
  g.lineStyle(2, 0xf2a0a8, 0.8);
  g.lineBetween(x + 90, y + 10, x + 90, y + h - 10);
  const header = txt(scene, x + 110, y + 40, title, { size: 22, color: '#7d7896' });
  c.add(header);
  const jitter = look.jitter ?? 0;
  const seed = look.seed ?? 1;
  const measure = txt(scene, 0, 0, '', { size: 30, fontFamily: FONT_HAND, wordWrap: { width: w - 150, useAdvancedWrap: true } });
  const lines = measure.getWrappedText(body);
  measure.destroy();
  lines.forEach((line, i) => {
    const jx = (hashFloat(seed, 'jx', i) - 0.5) * 10 * jitter;
    const jy = (hashFloat(seed, 'jy', i) - 0.5) * 6 * jitter;
    const ang = (hashFloat(seed, 'ja', i) - 0.5) * 3 * jitter;
    const t = txt(scene, x + 110 + jx, y + 82 + i * 38 + jy, line, { size: 30, fontFamily: FONT_HAND, color: look.ink ?? '#2f3a5c' });
    t.setAngle(ang);
    c.add(t);
  });
  if (look.shrimpDoodle) {
    const s = scene.add.image(x + w - 130, y + h - 110, 'it_shrimp_medium').setScale(1.6 / TEX_SCALE).setAngle(-12).setAlpha(0.85);
    c.add(s);
    g.lineStyle(2, 0x2f3a5c, 0.7);
    g.strokeEllipse(x + w - 130, y + h - 110, 150, 100);
  }
  for (let i = 0; i < (look.stamps ?? 0); i++) {
    const sx = x + 160 + hashFloat(seed, 'sx', i) * (w - 320);
    const sy = y + 120 + hashFloat(seed, 'sy', i) * (h - 220);
    const st = txt(scene, sx, sy, '검열필', { size: 26, color: CSS.killerRed, fontFamily: FONT_TITLE })
      .setOrigin(0.5)
      .setAngle((hashFloat(seed, 'sa', i) - 0.5) * 40)
      .setAlpha(0.55);
    const sg = scene.add.graphics();
    sg.lineStyle(3, PALETTE.killerRed, 0.55);
    sg.strokeRoundedRect(-52, -22, 104, 44, 6);
    sg.setPosition(sx, sy).setAngle(st.angle);
    c.add([sg, st]);
  }
  if (look.footer) c.add(txt(scene, x + w - 40, y + h - 40, look.footer, { size: 18, color: '#7d7896' }).setOrigin(1, 0.5));
  return c;
}

export function showLetter(scene: Phaser.Scene, title: string, body: string, look: LetterLook = {}): Promise<void> {
  sfx('paper');
  const c = buildLetter(scene, title, body, look);
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 250 });
  return clickToClose(scene, [c], 500);
}

/** [변경 1] An official paper: bank notice, repayment table, red warning letter. */
export function showNotice(scene: Phaser.Scene, title: string, lines: string[], tone: 'official' | 'red'): Promise<void> {
  sfx('paper');
  const c = scene.add.container(0, 0).setDepth(DEPTH);
  c.add(scene.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.5).setOrigin(0));
  const g = scene.add.graphics();
  const h = 170 + lines.length * 44;
  const y = 360 - h / 2;
  panel(g, 240, y, 800, h, tone === 'red' ? 0xfff0f0 : 0xfffdf6, 6);
  g.fillStyle(tone === 'red' ? PALETTE.killerRed : 0x3d5570, 1).fillRect(240, y, 800, 14);
  c.add(g);
  c.add(txt(scene, 640, y + 56, title, { size: 34, fontFamily: FONT_TITLE, color: tone === 'red' ? CSS.killerRed : '#3d5570' }).setOrigin(0.5));
  c.add(txt(scene, 640, y + 92, '걸프 코스트 저축은행 · 펠리컨 코브 지점', { size: 15, color: '#7d7896' }).setOrigin(0.5));
  lines.forEach((l, i) => c.add(txt(scene, 300, y + 130 + i * 44, l, { size: 23, wordWrap: { width: 680 } })));
  if (tone === 'red') {
    const st = txt(scene, 900, y + h - 50, '연체', { size: 40, fontFamily: FONT_TITLE, color: CSS.killerRed }).setOrigin(0.5).setAngle(-14).setAlpha(0.75);
    c.add(st);
    scene.tweens.add({ targets: st, scale: { from: 2.2, to: 1 }, alpha: { from: 0, to: 0.75 }, duration: 260, delay: 400, ease: 'Back.Out', onStart: () => sfx('thud') });
  }
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 220 });
  return clickToClose(scene, [c], 700);
}
