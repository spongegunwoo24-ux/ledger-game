import Phaser from 'phaser';
import { fishTexKey } from '../../art/fish';
import { TEX_SCALE } from '../../art/pen';
import { TUNING } from '../../config/tuning';
import { range, type Rng } from '../../core/rng';
import { baitDef, type BaitId } from '../../data/bait';
import { fishDef, type FishDef, type Layer } from '../../data/fish';
import { pickFish, rollSize, type SpawnContext } from '../../systems/fishSpawn';

/** Layout of the underwater cross-section. */
export const WATER_Y = 250;
export const BED_Y = 680;
export const LAYER_BAND: Record<Layer, [number, number]> = {
  surface: [WATER_Y + 25, 390],
  middle: [390, 550],
  bottom: [550, BED_Y - 15],
};

export type FishState = 'wander' | 'approach' | 'flee' | 'bite' | 'hooked' | 'gone' | 'netted';

export interface Swimmer {
  uid: number;
  def: FishDef;
  inches: number;
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  homeY: number;
  phase: number;
  state: FishState;
  /** time (ms) the bite started */
  biteAt: number;
  /** cooldown before it is interested again (ms timestamp) */
  calmUntil: number;
  revealed: boolean;
  width: number;
  /** legendary/rare effects attached */
  fx?: Phaser.GameObjects.GameObject[];
}

export interface Bait {
  type: BaitId;
  x: number;
  y: number;
  /** smoothed speed px/s */
  speed: number;
  /** ms since it stopped moving */
  stillFor: number;
}

export interface NetZone {
  active: boolean;
  x: number;
  y: number;
  r: number;
}

export interface SeaLifeEvents {
  appear?: (s: Swimmer) => void;
  bite?: (s: Swimmer) => void;
  stripped?: (s: Swimmer) => void;
  netted?: (s: Swimmer) => void;
  netBump?: (s: Swimmer) => void;
  left?: (s: Swimmer) => void;
}

let uidSeq = 1;

/** Living water: fish spawned from the shared table swim, notice the bait, and swim into the net. */
export class SeaLife {
  fish: Swimmer[] = [];
  private spawnAcc = 0;
  private legendSpawned = false;
  /** visual size multiplier */
  constructor(
    private scene: Phaser.Scene,
    private ctx: () => SpawnContext,
    private rng: Rng,
    private ev: SeaLifeEvents,
    private depth = 5,
  ) {}

  setLegendSpawned(v: boolean) {
    this.legendSpawned = v;
  }

  populate(n: number) {
    for (let i = 0; i < n; i++) this.spawn(undefined, true);
  }

  /** Spawn a fish (random from the table, or a forced species for debug). */
  spawn(forced?: FishDef, initial = false): Swimmer | null {
    const c = this.ctx();
    const def =
      forced ??
      pickFish(this.rng, c, (f) => f.rarity === 'legendary' && (this.legendSpawned || this.fish.some((x) => x.def.rarity === 'legendary')));
    if (!def) return null;
    if (def.rarity === 'legendary') this.legendSpawned = true;
    const count = def.behavior === 'school' && !forced ? Math.round(range(this.rng, 3, 6)) : 1;
    const dir: 1 | -1 = this.rng() < 0.5 ? 1 : -1;
    const band = LAYER_BAND[def.layer];
    const baseY = range(this.rng, band[0], band[1]);
    let first: Swimmer | null = null;
    for (let i = 0; i < count; i++) {
      const inches = rollSize(this.rng, def);
      const width = 26 + inches * 2.1;
      const x = initial ? range(this.rng, 60, 1220) : dir === 1 ? -width - i * 40 : 1280 + width + i * 40;
      const y = Phaser.Math.Clamp(baseY + range(this.rng, -22, 22), band[0], band[1]);
      const img = this.scene.add
        .image(x, y, fishTexKey(def.id))
        .setDepth(this.depth)
        .setScale((width / (100 * TEX_SCALE)) * dir, width / (100 * TEX_SCALE));
      const sw: Swimmer = {
        uid: uidSeq++,
        def,
        inches,
        img,
        x,
        y,
        dir,
        speed: this.baseSpeed(def) * range(this.rng, 0.8, 1.2),
        homeY: y,
        phase: this.rng() * Math.PI * 2,
        state: 'wander',
        biteAt: 0,
        calmUntil: 0,
        revealed: false,
        width,
      };
      this.silhouette(sw, true);
      this.fish.push(sw);
      if (!first) first = sw;
    }
    if (first) this.ev.appear?.(first);
    return first;
  }

  forceSpawn(id: string): Swimmer | null {
    const d = fishDef(id);
    return d ? this.spawn(d) : null;
  }

  private baseSpeed(def: FishDef): number {
    if (def.behavior === 'hunter') return 70;
    if (def.layer === 'bottom') return 26;
    if (def.rarity === 'legendary') return 30;
    return 42;
  }

  private silhouette(s: Swimmer, on: boolean) {
    if (on) s.img.setTint(0x1f4a5e).setAlpha(0.55);
    else s.img.clearTint().setAlpha(1);
    s.revealed = !on;
  }

  mouth(s: Swimmer) {
    return { x: s.x + s.dir * s.width * 0.45, y: s.y };
  }

  /** Does this fish want this bait at all? */
  likes(s: Swimmer, bait: Bait): boolean {
    if (s.def.netOnly) return false;
    if (bait.type === 'lure') return s.def.baits.includes('lure') || s.def.behavior === 'hunter';
    return s.def.baits.includes(bait.type) || (bait.type === 'shrimp' && s.def.baits.length > 0 && s.def.behavior !== 'hunter');
  }

  update(dtMs: number, now: number, flow: number, bait: Bait | null, net: NetZone, biteLock: boolean) {
    const dt = dtMs / 1000;
    // spawning
    this.spawnAcc += dt;
    if (this.spawnAcc >= TUNING.fishing.spawnEverySec) {
      this.spawnAcc = 0;
      if (this.fish.filter((f) => f.state !== 'gone').length < TUNING.fishing.maxFish) this.spawn();
    }
    const range0 = bait ? baitDef(bait.type).range : 0;
    for (const s of this.fish) {
      if (s.state === 'gone' || s.state === 'netted' || s.state === 'hooked') continue;
      s.phase += dt * 2;
      const fast = bait ? bait.speed > 110 : false;
      const still = bait ? bait.speed < 18 && bait.stillFor > 600 : false;
      const slow = bait ? bait.speed < 70 : false;
      let tx = s.x + s.dir * 100;
      let ty = s.homeY + Math.sin(s.phase) * 10;
      let sp = s.speed;
      if (bait && s.state !== 'flee' && now > s.calmUntil && !biteLock) {
        const m = this.mouth(s);
        const d = Phaser.Math.Distance.Between(m.x, m.y, bait.x, bait.y);
        if (d < range0 && this.likes(s, bait)) {
          let wants = false;
          switch (s.def.behavior) {
            case 'shy':
              if (fast) {
                s.state = 'flee';
                s.calmUntil = now + 4000;
              } else wants = still;
              break;
            case 'hunter':
              wants = fast || (s.state === 'approach' && bait.stillFor < 1500);
              break;
            case 'thief':
              wants = true;
              break;
            case 'school':
              wants = slow;
              break;
            default:
              wants = slow;
          }
          if (wants) s.state = 'approach';
          else if (s.state === 'approach') s.state = 'wander';
        } else if (s.state === 'approach') s.state = 'wander';
      }
      if (s.state === 'approach' && bait) {
        tx = bait.x - s.dir * s.width * 0.45;
        ty = bait.y;
        sp = s.speed * (s.def.behavior === 'hunter' ? 2.2 : s.def.behavior === 'thief' ? 1.6 : 1.1);
        const desired: 1 | -1 = bait.x >= s.x ? 1 : -1;
        if (desired !== s.dir && Math.abs(bait.x - s.x) > s.width * 0.5) this.turn(s, desired);
        const m = this.mouth(s);
        if (Phaser.Math.Distance.Between(m.x, m.y, bait.x, bait.y) < 16 && !biteLock) {
          s.state = 'bite';
          s.biteAt = now;
          this.ev.bite?.(s);
        }
      }
      if (s.state === 'bite' && bait) {
        // nibbling: stays at the bait, shivering
        s.x = bait.x - s.dir * s.width * 0.45 + Math.sin(now / 30) * 2;
        s.y = bait.y;
        if (now - s.biteAt > TUNING.fishing.goodWindow * 1000) {
          s.state = 'flee';
          s.calmUntil = now + 5000;
          this.ev.stripped?.(s);
        }
      } else if (s.state === 'flee') {
        const away: 1 | -1 = bait && bait.x > s.x ? -1 : 1;
        if (away !== s.dir) this.turn(s, away);
        s.x += s.dir * s.speed * 2.6 * dt;
        if (now > s.calmUntil) s.state = 'wander';
      } else {
        const dx = tx - s.x;
        const dy = ty - s.y;
        const len = Math.hypot(dx, dy) || 1;
        s.x += (dx / len) * sp * dt;
        s.y += (dy / len) * sp * 0.6 * dt;
      }
      // relative flow while the boat tows (boat moves right → water moves left)
      s.x -= flow * dt;
      const band = LAYER_BAND[s.def.layer];
      s.y = Phaser.Math.Clamp(s.y, band[0] - 30, band[1] + 30);
      // net: fish near the mouth swim in (legendaries break out)
      if (net.active && s.state !== 'bite' && Phaser.Math.Distance.Between(s.x, s.y, net.x, net.y) < net.r) {
        if (s.def.netProof) {
          if (now > s.calmUntil) {
            s.calmUntil = now + 6000;
            s.state = 'flee';
            this.ev.netBump?.(s);
          }
        } else if (this.rng() < 0.45 * dt) {
          s.state = 'netted';
          this.ev.netted?.(s);
        }
      }
      // reveal when close to the bait
      const near = bait ? Phaser.Math.Distance.Between(s.x, s.y, bait.x, bait.y) < 210 : false;
      if (near && !s.revealed) this.silhouette(s, false);
      else if (!near && s.revealed && s.state !== 'bite') this.silhouette(s, true);
      s.img.setPosition(s.x, s.y + Math.sin(s.phase * 1.5) * 1.5);
      if (s.x < -260 || s.x > 1540) {
        s.state = 'gone';
        this.ev.left?.(s);
      }
    }
    // cleanup
    for (const s of this.fish) if (s.state === 'gone') this.remove(s);
    this.fish = this.fish.filter((s) => s.state !== 'gone');
  }

  turn(s: Swimmer, dir: 1 | -1) {
    s.dir = dir;
    const sx = Math.abs(s.img.scaleX);
    s.img.setScale(sx * dir, s.img.scaleY);
  }

  remove(s: Swimmer) {
    s.state = 'gone';
    s.fx?.forEach((o) => o.destroy());
    s.img.destroy();
  }

  /** fish currently nibbling (for hook timing) */
  biter(): Swimmer | undefined {
    return this.fish.find((f) => f.state === 'bite');
  }

  clear() {
    for (const s of this.fish) this.remove(s);
    this.fish = [];
  }
}

