import Phaser from 'phaser';
import { addTint, drawBackdrop, type BackdropOpts } from '../art/backdrops';
import { charTexKey } from '../art/characters';
import { TEX_SCALE } from '../art/pen';
import type { BackdropKey } from '../core/events';
import type { CharId, Point, Segment } from '../core/types';

/** Actor display scales (textures are 96×128 logical). */
const ACTOR_SCALE: Partial<Record<CharId, number>> = { ledger: 1.1, biscuit: 0.9 };
const DEFAULT_SCALE = 1.5;

/**
 * A backdrop plus positioned character sprites. Used by cutscenes and location scenes.
 * Feet anchor: sprites use origin (0.5, 0.97).
 */
export class Stage {
  backdrop: Phaser.GameObjects.Container | null = null;
  tint: Phaser.GameObjects.Rectangle | null = null;
  actors = new Map<CharId, Phaser.GameObjects.Image>();
  private bobs = new Map<CharId, Phaser.Tweens.Tween>();
  private notes = new Map<CharId, Phaser.Time.TimerEvent>();
  /** holds backdrop + actors so the "camera" step can zoom them together */
  root: Phaser.GameObjects.Container;
  layer: Phaser.GameObjects.Container;

  constructor(
    public scene: Phaser.Scene,
    public seg: Segment = 'afternoon',
  ) {
    this.root = scene.add.container(0, 0).setDepth(0);
    this.layer = scene.add.container(0, 0);
    this.root.add(this.layer);
  }

  setBackdrop(key: BackdropKey, seg?: Segment, opts: BackdropOpts = {}) {
    if (seg) this.seg = seg;
    this.backdrop?.destroy();
    this.tint?.destroy();
    this.backdrop = drawBackdrop(this.scene, key, { seg: this.seg, ...opts });
    this.root.addAt(this.backdrop, 0);
    this.tint = key === 'black' ? null : addTint(this.scene, this.seg, 40);
  }

  texFor(who: CharId): string {
    return who === 'ledger' ? 'ch_ledger' : charTexKey(who);
  }

  place(who: CharId, at: Point, face: 1 | -1 = 1): Phaser.GameObjects.Image {
    this.remove(who);
    const key = this.texFor(who);
    const tex = this.scene.textures.exists(key) ? key : charTexKey('townsfolk');
    const sc = (ACTOR_SCALE[who] ?? DEFAULT_SCALE) / TEX_SCALE;
    const img = this.scene.add.image(at.x, at.y, tex).setOrigin(0.5, 0.97).setScale(sc * face, sc);
    img.setData('baseScale', sc);
    this.layer.add(img);
    this.actors.set(who, img);
    this.sortDepth();
    const bob = this.scene.tweens.add({
      targets: img,
      scaleY: sc * 1.025,
      duration: 900 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    this.bobs.set(who, bob);
    if (who === 'toby') this.setNotes('toby', true);
    return img;
  }

  /** Floating ♪ particles over a character (Toby's whistle, D06). */
  setNotes(who: CharId, on: boolean) {
    this.notes.get(who)?.remove();
    this.notes.delete(who);
    if (!on) return;
    const ev = this.scene.time.addEvent({
      delay: 1400,
      loop: true,
      callback: () => {
        const a = this.actors.get(who);
        if (!a) return;
        const n = this.scene.add.image(a.x + 30, a.y - a.displayHeight * 0.85, 'fx_note').setScale(0.5).setDepth(30);
        this.scene.tweens.add({ targets: n, y: n.y - 40, x: n.x + 16, alpha: 0, duration: 1300, onComplete: () => n.destroy() });
      },
    });
    this.notes.set(who, ev);
  }

  remove(who: CharId) {
    this.bobs.get(who)?.remove();
    this.bobs.delete(who);
    this.notes.get(who)?.remove();
    this.notes.delete(who);
    this.actors.get(who)?.destroy();
    this.actors.delete(who);
  }

  clearActors() {
    for (const k of [...this.actors.keys()]) this.remove(k);
  }

  private sortDepth() {
    this.layer.sort('y');
  }

  move(who: CharId, to: Point, ms = 900): Promise<void> {
    const a = this.actors.get(who);
    if (!a) return Promise.resolve();
    const sc = a.getData('baseScale') as number;
    if (to.x !== a.x) a.setScale(sc * (to.x < a.x ? -1 : 1), a.scaleY);
    return new Promise((res) => {
      this.scene.tweens.add({
        targets: a,
        x: to.x,
        y: to.y,
        duration: ms,
        ease: 'Sine.InOut',
        onUpdate: () => this.sortDepth(),
        onComplete: () => res(),
      });
      // little hop while walking
      this.scene.tweens.add({ targets: a, angle: { from: -3, to: 3 }, duration: 160, yoyo: true, repeat: Math.max(0, Math.floor(ms / 320) - 1) });
    });
  }

  exit(who: CharId, to?: Point, ms = 900): Promise<void> {
    const a = this.actors.get(who);
    if (!a) return Promise.resolve();
    if (!to) {
      return new Promise((res) => {
        this.scene.tweens.add({
          targets: a,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            this.remove(who);
            res();
          },
        });
      });
    }
    return this.move(who, to, ms).then(() => this.remove(who));
  }

  face(who: CharId, dir: 1 | -1) {
    const a = this.actors.get(who);
    if (!a) return;
    const sc = a.getData('baseScale') as number;
    a.setScale(sc * dir, a.scaleY);
  }

  /** Zoom/pan the stage so `to` is centered (zoom 1 = reset). */
  camera(to: Point, zoom = 1, ms = 800): Promise<void> {
    return new Promise((res) => {
      this.scene.tweens.add({
        targets: this.root,
        scale: zoom,
        x: zoom === 1 ? 0 : 640 - to.x * zoom,
        y: zoom === 1 ? 0 : 360 - to.y * zoom,
        duration: ms,
        ease: 'Sine.InOut',
        onComplete: () => res(),
      });
    });
  }

  shake(who: CharId): Promise<void> {
    const a = this.actors.get(who);
    if (!a) return Promise.resolve();
    return new Promise((res) => {
      this.scene.tweens.add({ targets: a, x: a.x + 6, duration: 50, yoyo: true, repeat: 3, onComplete: () => res() });
    });
  }

  destroy() {
    this.clearActors();
    this.backdrop?.destroy();
    this.tint?.destroy();
    this.root.destroy();
  }
}
