import type { Rng } from '../core/rng';
import type { Pattern } from '../data/fish';

/** [변경 1] Rod fight for rare+ fish: hold the direction opposite to the pull and tap Space. */
export type Dir = 'left' | 'right' | 'up' | 'down' | 'none';

export const OPPOSITE: Record<Dir, Dir> = { left: 'right', right: 'left', up: 'down', down: 'up', none: 'none' };

const STRENGTH: Record<Pattern, number> = { A: 0.28, B: 0.32, C: 0.42, D: 0.18, E: 0.25, F: 0.1 };

export class FightModel {
  progress = 0;
  tension = 0;
  t = 0;
  pull: Dir = 'left';
  jumping = false;
  running = false;
  result: 'win' | 'lose' | null = null;
  loseReason: 'snap' | 'slip' | null = null;
  private phaseT = 0;
  private nextSwitch = 0.8;

  constructor(
    readonly pattern: Pattern,
    readonly duration: number,
    private rng: Rng,
    private tensionMult = 1,
  ) {
    this.pull = rng() < 0.5 ? 'left' : 'right';
    if (pattern === 'C') this.pull = 'down';
  }

  /** the key the player should hold right now */
  get want(): Dir {
    return OPPOSITE[this.pull];
  }

  private strength(): number {
    let s = STRENGTH[this.pattern];
    if (this.pattern === 'D' && this.running) s = 0.95;
    return s * this.tensionMult;
  }

  update(dt: number, holding: Dir) {
    if (this.result) return;
    this.t += dt;
    this.phaseT += dt;
    // pattern behaviour
    switch (this.pattern) {
      case 'B':
        if (this.phaseT > 0.8) {
          this.phaseT = 0;
          this.pull = this.pull === 'left' ? 'right' : 'left';
        }
        break;
      case 'D':
        if (this.phaseT > this.nextSwitch) {
          this.phaseT = 0;
          this.running = !this.running;
          this.nextSwitch = this.running ? 0.6 : 1.2 + this.rng() * 0.8;
          this.pull = this.rng() < 0.5 ? 'left' : 'right';
        }
        break;
      case 'E':
        if (this.phaseT > (this.jumping ? 0.55 : 1.4)) {
          this.phaseT = 0;
          this.jumping = !this.jumping;
          if (!this.jumping) this.pull = this.pull === 'left' ? 'right' : 'left';
        }
        break;
      case 'F':
        if (this.phaseT > 1.2) {
          this.phaseT = 0;
          this.pull = this.rng() < 0.5 ? 'left' : 'right';
        }
        break;
      default:
        break;
    }
    if (holding === this.want && !this.jumping) this.tension = Math.max(0, this.tension - 0.45 * dt);
    else this.tension += this.strength() * dt;
    if (this.tension >= 1) this.lose('snap');
    if (this.t > this.duration * 3) this.lose('slip');
  }

  tap(holding: Dir) {
    if (this.result) return;
    if (this.jumping) {
      this.tension += 0.3 * this.tensionMult;
    } else if (holding === this.want || this.pattern === 'F') {
      this.progress += 1 / (this.duration * 5) * (this.pattern === 'C' ? 0.85 : 1);
      this.tension += 0.015 * this.tensionMult;
    } else {
      this.tension += 0.1 * this.tensionMult;
    }
    if (this.tension >= 1) this.lose('snap');
    else if (this.progress >= 1) this.result = 'win';
  }

  private lose(r: 'snap' | 'slip') {
    this.result = 'lose';
    this.loseReason = r;
  }
}
