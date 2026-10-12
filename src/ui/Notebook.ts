import Phaser from 'phaser';
import { PALETTE, FONT_TITLE, FONT_HAND } from '../art/palette';
import { G } from '../core/game';
import { notebookEntries } from '../systems/notebook';
import { panel } from './Button';
import { txt } from './text';

/** The quest notebook overlay (always 1–3 concrete tasks + pinned main line). */
export function openNotebook(scene: Phaser.Scene) {
  const c = scene.add.container(0, 0).setDepth(1300);
  const shade = scene.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.45).setOrigin(0).setInteractive();
  c.add(shade);
  const g = scene.add.graphics();
  panel(g, 300, 70, 680, 580, 0xfbf6e8, 14);
  g.fillStyle(PALETTE.coral, 1).fillRect(300, 70, 34, 580);
  g.lineStyle(1.5, 0x9fc3e0, 0.7);
  for (let y = 170; y < 640; y += 44) g.lineBetween(350, y, 960, y);
  c.add(g);
  c.add(txt(scene, 640, 112, '수첩', { size: 34, fontFamily: FONT_TITLE }).setOrigin(0.5));
  const entries = notebookEntries(G.state);
  let y = 150;
  for (const e of entries) {
    const head = `${e.pinned ? '📌 ' : '□ '}${e.when}, ${e.where}`;
    c.add(txt(scene, 360, y, head, { size: 20, color: e.pinned ? '#b04a52' : '#3B3355' }));
    c.add(txt(scene, 392, y + 26, e.text, { size: 28, fontFamily: FONT_HAND, color: '#2d5fa8', wordWrap: { width: 560 } }));
    y += 76;
  }
  c.add(txt(scene, 640, 620, '아무 데나 누르면 닫힌다', { size: 15, color: '#9a96a8' }).setOrigin(0.5));
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 150 });
  shade.on('pointerdown', () => c.destroy());
}
