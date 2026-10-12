import Phaser from 'phaser';
import { PALETTE } from './palette';

/** Texture resolution multiplier: textures are drawn at 2× and displayed at 0.5×. */
export const TEX_SCALE = 2;

export interface PenOpts {
  outline?: boolean;
  alpha?: number;
  lw?: number;
  stroke?: number;
}

/**
 * Small drawing helper over Phaser.Graphics. All coordinates are "logical"
 * and multiplied by `s` (plus an offset), so the same drawing code can render
 * a sprite and a large portrait. Every shape gets a soft thick ink outline.
 */
export class Pen {
  constructor(
    public g: Phaser.GameObjects.Graphics,
    public s = TEX_SCALE,
    public ox = 0,
    public oy = 0,
    public lw = 2.4,
  ) {}

  private X(x: number) {
    return this.ox + x * this.s;
  }
  private Y(y: number) {
    return this.oy + y * this.s;
  }
  private L(v: number) {
    return v * this.s;
  }

  private begin(fill: number, o: PenOpts) {
    this.g.fillStyle(fill, o.alpha ?? 1);
    this.g.lineStyle(this.L(o.lw ?? this.lw), o.stroke ?? PALETTE.ink, o.alpha ?? 1);
  }

  circle(x: number, y: number, r: number, fill: number, o: PenOpts = {}) {
    this.begin(fill, o);
    this.g.fillCircle(this.X(x), this.Y(y), this.L(r));
    if (o.outline !== false) this.g.strokeCircle(this.X(x), this.Y(y), this.L(r));
    return this;
  }

  ellipse(x: number, y: number, w: number, h: number, fill: number, o: PenOpts = {}) {
    this.begin(fill, o);
    this.g.fillEllipse(this.X(x), this.Y(y), this.L(w), this.L(h));
    if (o.outline !== false) this.g.strokeEllipse(this.X(x), this.Y(y), this.L(w), this.L(h));
    return this;
  }

  rrect(x: number, y: number, w: number, h: number, r: number, fill: number, o: PenOpts = {}) {
    this.begin(fill, o);
    const rr = Math.min(this.L(r), this.L(w) / 2, this.L(h) / 2);
    this.g.fillRoundedRect(this.X(x), this.Y(y), this.L(w), this.L(h), rr);
    if (o.outline !== false) this.g.strokeRoundedRect(this.X(x), this.Y(y), this.L(w), this.L(h), rr);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, fill: number, o: PenOpts = {}) {
    this.begin(fill, o);
    this.g.fillRect(this.X(x), this.Y(y), this.L(w), this.L(h));
    if (o.outline !== false) this.g.strokeRect(this.X(x), this.Y(y), this.L(w), this.L(h));
    return this;
  }

  poly(points: number[], fill: number, o: PenOpts = {}) {
    this.begin(fill, o);
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < points.length; i += 2) pts.push({ x: this.X(points[i]), y: this.Y(points[i + 1]) });
    this.g.fillPoints(pts, true);
    if (o.outline !== false) this.g.strokePoints(pts, true);
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number, width = 2.4, color: number = PALETTE.ink, alpha = 1) {
    this.g.lineStyle(this.L(width), color, alpha);
    this.g.lineBetween(this.X(x1), this.Y(y1), this.X(x2), this.Y(y2));
    return this;
  }

  /** open polyline */
  path(points: number[], width = 2.4, color: number = PALETTE.ink, alpha = 1) {
    this.g.lineStyle(this.L(width), color, alpha);
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < points.length; i += 2) pts.push({ x: this.X(points[i]), y: this.Y(points[i + 1]) });
    this.g.strokePoints(pts, false);
    return this;
  }

  /** arc stroke, angles in degrees (0 = right, clockwise) */
  arc(x: number, y: number, r: number, from: number, to: number, width = 2.4, color: number = PALETTE.ink) {
    this.g.lineStyle(this.L(width), color, 1);
    this.g.beginPath();
    this.g.arc(this.X(x), this.Y(y), this.L(r), Phaser.Math.DegToRad(from), Phaser.Math.DegToRad(to), false);
    this.g.strokePath();
    return this;
  }

  /** filled pie / half-disc, angles in degrees */
  pie(x: number, y: number, r: number, from: number, to: number, fill: number, o: PenOpts = {}) {
    this.begin(fill, o);
    this.g.beginPath();
    this.g.moveTo(this.X(x), this.Y(y));
    this.g.arc(this.X(x), this.Y(y), this.L(r), Phaser.Math.DegToRad(from), Phaser.Math.DegToRad(to), false);
    this.g.closePath();
    this.g.fillPath();
    if (o.outline !== false) this.g.strokePath();
    return this;
  }
}

/** Draws into a fresh Graphics, bakes it into a texture and destroys the Graphics. */
export function bake(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (p: Pen) => void,
  scale = TEX_SCALE,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(new Pen(g, scale));
  g.generateTexture(key, Math.ceil(w * scale), Math.ceil(h * scale));
  g.destroy();
}
