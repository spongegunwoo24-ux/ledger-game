import Phaser from 'phaser';
import { PALETTE } from '../art/palette';
import { txt } from './text';

/** Speech bubble above a point that fades after a while (non-blocking chatter). */
export class Bubble {
  private c: Phaser.GameObjects.Container | null = null;
  private timer: Phaser.Time.TimerEvent | null = null;

  constructor(
    private scene: Phaser.Scene,
    private depth = 700,
  ) {}

  say(x: number, y: number, text: string, ms = 2600, tailRight = false) {
    this.clear();
    const s = this.scene;
    const t = txt(s, 0, 0, text, { size: 19, wordWrap: { width: 300, useAdvancedWrap: true }, align: 'center' }).setOrigin(0.5);
    const w = Math.max(80, t.width + 32);
    const h = t.height + 22;
    const g = s.add.graphics();
    g.fillStyle(PALETTE.ink, 0.18).fillRoundedRect(-w / 2 + 2, -h + 4, w, h, 16);
    g.fillStyle(0xfffaf0, 1).fillRoundedRect(-w / 2, -h, w, h, 16);
    g.lineStyle(3, PALETTE.ink, 1).strokeRoundedRect(-w / 2, -h, w, h, 16);
    const tx = tailRight ? w / 2 - 30 : -w / 2 + 30;
    g.fillStyle(0xfffaf0, 1).fillTriangle(tx - 10, -2, tx + 10, -2, tx + (tailRight ? 8 : -8), 16);
    g.lineStyle(3, PALETTE.ink, 1).lineBetween(tx - 10, 0, tx + (tailRight ? 8 : -8), 16).lineBetween(tx + 10, 0, tx + (tailRight ? 8 : -8), 16);
    t.setY(-h / 2);
    const cx = Phaser.Math.Clamp(x, w / 2 + 10, 1270 - w / 2);
    this.c = s.add.container(cx, y, [g, t]).setDepth(this.depth).setScale(0.6).setAlpha(0);
    s.tweens.add({ targets: this.c, scale: 1, alpha: 1, duration: 160, ease: 'Back.Out' });
    this.timer = s.time.delayedCall(ms, () => this.clear());
  }

  clear() {
    this.timer?.remove();
    this.timer = null;
    const c = this.c;
    this.c = null;
    if (c) this.scene.tweens.add({ targets: c, alpha: 0, duration: 200, onComplete: () => c.destroy() });
  }

  get showing() {
    return !!this.c;
  }
}
