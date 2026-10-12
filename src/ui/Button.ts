import Phaser from 'phaser';
import { PALETTE } from '../art/palette';
import { sfx } from '../audio/sfx';
import { txt } from './text';

export interface ButtonOpts {
  w?: number;
  h?: number;
  size?: number;
  fill?: number;
  textColor?: string;
  disabled?: boolean;
  sub?: string;
  /** play no click sound */
  silent?: boolean;
}

/** Rounded pastel button with hover lift. Returns a container. */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  private sub?: Phaser.GameObjects.Text;
  private bw: number;
  private bh: number;
  private fill: number;
  private _disabled = false;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, o: ButtonOpts = {}) {
    super(scene, x, y);
    this.bw = o.w ?? 220;
    this.bh = o.h ?? 52;
    this.fill = o.fill ?? PALETTE.butter;
    this.bg = scene.add.graphics();
    this.add(this.bg);
    this.label = txt(scene, 0, o.sub ? -9 : 0, text, { size: o.size ?? 22, color: o.textColor, align: 'center' }).setOrigin(0.5);
    this.add(this.label);
    if (o.sub) {
      this.sub = txt(scene, 0, 14, o.sub, { size: 14, color: '#6b6385', align: 'center' }).setOrigin(0.5);
      this.add(this.sub);
    }
    this.setSize(this.bw, this.bh);
    this.setInteractive({ useHandCursor: true });
    this.draw(false);
    this.on('pointerover', () => !this._disabled && this.draw(true));
    this.on('pointerout', () => this.draw(false));
    this.on('pointerdown', () => {
      if (this._disabled) return;
      if (!o.silent) sfx('click');
      this.scene.tweens.add({ targets: this, scale: 0.96, duration: 60, yoyo: true });
      onClick();
    });
    this.setDisabled(!!o.disabled);
    scene.add.existing(this);
  }

  private draw(hover: boolean) {
    const g = this.bg;
    g.clear();
    const w = this.bw;
    const h = this.bh;
    const r = Math.min(18, h / 2);
    g.fillStyle(PALETTE.ink, 0.18);
    g.fillRoundedRect(-w / 2 + 2, -h / 2 + 5, w, h, r);
    g.fillStyle(this._disabled ? 0xd9d4e3 : this.fill, 1);
    g.fillRoundedRect(-w / 2, -h / 2 - (hover ? 2 : 0), w, h, r);
    g.lineStyle(3, PALETTE.ink, 1);
    g.strokeRoundedRect(-w / 2, -h / 2 - (hover ? 2 : 0), w, h, r);
  }

  setDisabled(d: boolean): this {
    this._disabled = d;
    this.label.setAlpha(d ? 0.45 : 1);
    this.sub?.setAlpha(d ? 0.45 : 1);
    if (this.input) this.input.cursor = d ? 'default' : 'pointer';
    this.draw(false);
    return this;
  }

  setText(t: string): this {
    this.label.setText(t);
    return this;
  }

  setSub(t: string): this {
    this.sub?.setText(t);
    return this;
  }
}

/** Draws a soft paper panel into a Graphics. */
export function panel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number = 0xfffaf0,
  r = 20,
  alpha = 1,
): Phaser.GameObjects.Graphics {
  g.fillStyle(PALETTE.ink, 0.2 * alpha);
  g.fillRoundedRect(x + 3, y + 6, w, h, r);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, r);
  g.lineStyle(3, PALETTE.ink, alpha);
  g.strokeRoundedRect(x, y, w, h, r);
  return g;
}
