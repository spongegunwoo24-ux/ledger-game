import Phaser from 'phaser';
import { PALETTE, SHADE } from '../art/palette';
import { addSprite } from '../art/manifest';
import { ambientWaves, music, sfx, Winch } from '../audio/sfx';
import { TUNING } from '../config/tuning';
import { G } from '../core/game';
import { makeRng, hash32, pick, range, type Rng } from '../core/rng';
import type { GroundId, Weather } from '../core/types';
import { initView } from '../core/view';
import { GUS_TOW } from '../data/dialogue/gusDeck';
import { groundDef } from '../data/grounds';
import { conditionsFor, rollHaul, snagChancePerSecond, towCurve } from '../systems/fishing';
import { Bubble } from '../ui/Bubble';
import { Button } from '../ui/Button';
import { Hud } from '../ui/Hud';
import { CHAR_NAMES } from '../data/names';

export interface TrawlData {
  ground: GroundId;
  tutorial?: boolean;
  towIndex?: number;
}

type Phase = 'ready' | 'dropping' | 'towing' | 'hauling' | 'done';

const WATER_Y = 330;

interface Swimmer {
  img: Phaser.GameObjects.Image;
  vx: number;
  caught: boolean;
}

/**
 * Side-view trawling. No numeric gauge: winch pitch, tow-line vibration,
 * boat tilt, the visible net bag and Gus's comments are the feedback.
 */
export class TrawlScene extends Phaser.Scene {
  private d!: TrawlData;
  private phase: Phase = 'ready';
  private t = 0;
  private secAcc = 0;
  private rng!: Rng;
  private winch = new Winch();
  private boat!: Phaser.GameObjects.Container;
  private waves!: Phaser.GameObjects.Graphics;
  private lineG!: Phaser.GameObjects.Graphics;
  private netG!: Phaser.GameObjects.Graphics;
  private swimmers: Swimmer[] = [];
  private bubble!: Bubble;
  private btn!: Button;
  private gusSprite: Phaser.GameObjects.Image | null = null;
  private netPos = { x: 210, y: 560 };
  private netDepth = 0; // 0 = at boat, 1 = deployed
  private snagged = false;
  private snagLoss = 0;
  private said = new Set<string>();
  private weather: Weather = '맑음';
  private tutorialStep = 0;
  private alone = false;

  constructor() {
    super('Trawl');
  }

  init(d: TrawlData) {
    this.d = d;
    this.phase = 'ready';
    this.t = 0;
    this.secAcc = 0;
    this.swimmers = [];
    this.netDepth = 0;
    this.snagged = false;
    this.snagLoss = 0;
    this.said.clear();
    this.tutorialStep = 0;
  }

  create() {
    initView(this);
    const s = G.state;
    this.rng = makeRng(hash32(s.seed, 'trawl', s.day, this.d.towIndex ?? 0));
    this.weather = conditionsFor(s.day, s.seed).weather;
    this.alone = s.day >= 45 || !!s.flags.gusGone;
    const g = groundDef(this.d.ground);
    this.cameras.main.fadeIn(400, 21, 18, 31);
    music(null);
    ambientWaves(true, 0.07);
    this.drawWorld(g.id);
    new Hud(this, { notebook: false });
    this.add
      .text(640, 96, g.name, { fontFamily: '"Jua", sans-serif', fontSize: '26px', color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 6, resolution: 2 })
      .setOrigin(0.5)
      .setDepth(600);
    this.bubble = new Bubble(this);
    this.btn = new Button(this, 640, 668, '그물 내리기', () => this.press(), { w: 300, h: 60, size: 26, fill: PALETTE.coral, sub: 'Space' });
    this.btn.setDepth(650);
    this.input.keyboard?.on('keydown-SPACE', () => this.press());
    if (s.netTorn) {
      this.time.delayedCall(600, () => this.gusSay('그물 찢어진 채로 나왔다. 반은 빠져나갈 거다.', 3600));
    } else if (this.d.tutorial) {
      this.time.delayedCall(500, () => this.tutorialNext());
    } else if (g.snag === 'high') {
      this.time.delayedCall(600, () => this.gusSay(pick(this.rng, GUS_TOW.riskyGround)));
    }
    this.events.once('shutdown', () => this.winch.stop());
  }

  private tutorialNext() {
    if (!this.d.tutorial || this.tutorialStep >= GUS_TOW.tutorial.length) return;
    // first line before dropping, the rest while towing
    if (this.tutorialStep === 0) this.gusSay(GUS_TOW.tutorial[0], 4000);
    this.tutorialStep++;
  }

  private gusSay(text: string, ms = 2800) {
    if (this.alone) {
      // Eli alone (after Day 44): the deck is quiet; only Eli's own short thought
      return;
    }
    const x = this.gusSprite ? this.gusSprite.x + this.boat.x : 420;
    const y = this.gusSprite ? this.boat.y - 150 : 200;
    this.bubble.say(x, y, `${CHAR_NAMES.gus}: ${text}`, ms);
  }

  private drawWorld(ground: GroundId) {
    const s = G.state;
    const dawn = s.segment === 'dawn';
    // sky
    const sky = this.add.graphics().setDepth(0);
    const [top, bot] = dawn ? [0xb9a6dc, 0xffc7c2] : [0x8fd6ec, 0xd8f3f8];
    sky.fillGradientStyle(top, top, bot, bot, 1).fillRect(0, 0, 1280, WATER_Y + 10);
    if (this.weather === '흐림' || this.weather === '비') sky.fillStyle(0x9a96a8, 0.35).fillRect(0, 0, 1280, WATER_Y + 10);
    const sun = this.add.circle(1000, dawn ? 300 : 110, 50, dawn ? 0xffc7a8 : PALETTE.butter, 0.95).setDepth(1);
    if (dawn) this.tweens.add({ targets: sun, y: 230, duration: 120000 });
    for (let i = 0; i < 4; i++) {
      const cl = this.add.ellipse(150 + i * 330, 80 + (i % 2) * 50, 160, 40, 0xffffff, 0.75).setDepth(1);
      this.tweens.add({ targets: cl, x: cl.x - 200, duration: 60000 + i * 9000, repeat: -1, yoyo: true });
    }
    addSprite(this, 1210, WATER_Y - 40, 'sc_lighthouse', 0.35).setDepth(2);
    for (let i = 0; i < 3; i++) {
      const gull = addSprite(this, 200 + i * 300, 150 + i * 30, 'sc_gull', 0.8).setDepth(2);
      this.tweens.add({ targets: gull, x: gull.x + 120, y: gull.y - 20, duration: 4000 + i * 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    // underwater
    const water = this.add.graphics().setDepth(3);
    const deepTop = ground === 'river' ? 0x7fb8a8 : ground === 'channel' ? 0x4f9fb8 : PALETTE.sea;
    const deepBot = ground === 'river' ? 0x4f7f6f : ground === 'channel' ? 0x24506a : PALETTE.seaDeep;
    water.fillGradientStyle(deepTop, deepTop, deepBot, deepBot, 1).fillRect(0, WATER_Y, 1280, 720 - WATER_Y);
    // light rays
    for (let i = 0; i < 6; i++) water.fillStyle(0xffffff, 0.05).fillTriangle(100 + i * 220, WATER_Y, 160 + i * 220, WATER_Y, 60 + i * 220, 720);
    // seabed
    const bed = this.add.graphics().setDepth(4);
    const bedColor = ground === 'sandbar' ? 0xf0d8a0 : ground === 'river' ? 0x8a7a5a : ground === 'oyster' ? 0xc9b48a : 0xb8a888;
    bed.fillStyle(bedColor, 1);
    bed.beginPath();
    bed.moveTo(0, 720);
    for (let x = 0; x <= 1280; x += 40) bed.lineTo(x, (ground === 'sandbar' ? 640 : 670) + Math.sin(x / 90) * 10);
    bed.lineTo(1280, 720);
    bed.closePath();
    bed.fillPath();
    if (ground === 'wreck') {
      bed.fillStyle(0x6d5a4a, 1).fillRect(820, 560, 260, 90);
      bed.fillStyle(0x5a4a3a, 1).fillRect(900, 470, 14, 110);
      bed.lineStyle(3, PALETTE.ink, 0.6).strokeRect(820, 560, 260, 90);
    }
    if (ground === 'oyster') for (let i = 0; i < 9; i++) bed.fillStyle(0x9c7a5a, 1).fillRect(80 + i * 140, 590, 10, 90);
    if (ground === 'river') for (let i = 0; i < 6; i++) bed.fillStyle(0x6f9f5a, 0.8).fillEllipse(100 + i * 220, 660, 60, 26);
    for (let i = 0; i < 10; i++) bed.fillStyle(0x7fcf9f, 0.7).fillTriangle(40 + i * 130, 690, 52 + i * 130, 620 - (i % 3) * 20, 64 + i * 130, 690);

    // swimmers (shrimp silhouettes)
    const density = Math.max(6, Math.round(groundDef(ground).baseShrimp / 3));
    for (let i = 0; i < density; i++) this.spawnSwimmer(true);

    // net + line layers
    this.netG = this.add.graphics().setDepth(6);
    this.lineG = this.add.graphics().setDepth(7);

    // boat
    this.boat = this.add.container(700, WATER_Y + 8).setDepth(10);
    const ml = addSprite(this, 0, 0, 'boat_marylou').setOrigin(0.5, 200 / 240);
    this.boat.add(ml);
    // graffiti visible on the hull if not painted over (D09)
    if (s.flags.graffiti) {
      const k = this.add.text(-40, -50, 'KILLER', { fontFamily: '"Jua", sans-serif', fontSize: '30px', color: '#D7263D', resolution: 2 }).setAngle(-3);
      this.boat.add(k);
    } else if (s.flags.paintedOver === 'cheap' && this.weather === '맑음') {
      const k = this.add.text(-40, -50, 'KILLER', { fontFamily: '"Jua", sans-serif', fontSize: '30px', color: '#D7263D', resolution: 2 }).setAngle(-3).setAlpha(0.16);
      this.boat.add(k);
    }
    const name = this.add.text(90, -66, 'MARY LOU', { fontFamily: '"Jua", sans-serif', fontSize: '18px', color: '#3B3355', resolution: 2 }).setAngle(-2.6);
    this.boat.add(name);
    // crew
    const eli = addSprite(this, 70, -96, 'ch_eli', 0.62);
    this.boat.add(eli);
    if (!this.alone) {
      this.gusSprite = addSprite(this, -60, -92, 'ch_gus', 0.62);
      this.boat.add(this.gusSprite);
    }
    if (s.flags.ledgerAboard) {
      const led = addSprite(this, 205, -118, 'ch_ledger', 0.55).setFlipX(true);
      this.boat.add(led);
      this.tweens.add({ targets: led, angle: { from: -3, to: 3 }, duration: 900, yoyo: true, repeat: -1 });
    }
    // waves in front
    this.waves = this.add.graphics().setDepth(12);

    // rain
    if (this.weather === '비') {
      const rain = this.add.graphics().setDepth(20);
      this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          rain.clear();
          rain.lineStyle(2, 0xffffff, 0.45);
          for (let i = 0; i < 70; i++) {
            const x = (i * 97 + this.time.now * 0.6) % 1300;
            const y = (i * 53 + this.time.now * 0.9) % 720;
            rain.lineBetween(x, y, x - 6, y + 16);
          }
        },
      });
    }
  }

  private spawnSwimmer(initial: boolean) {
    const size = pick(this.rng, ['it_shrimp_small', 'it_shrimp_medium', 'it_shrimp_large']);
    const img = addSprite(this, initial ? range(this.rng, 0, 1280) : 1320, range(this.rng, WATER_Y + 60, 650), size, 0.45)
      .setDepth(5)
      .setAlpha(0.7)
      .setTint(0xffd6cc);
    this.swimmers.push({ img, vx: range(this.rng, 0.2, 0.6), caught: false });
  }

  private press() {
    if (this.phase === 'ready') this.drop();
    else if (this.phase === 'towing') this.haul();
  }

  private drop() {
    this.phase = 'dropping';
    sfx('splash');
    sfx('creak');
    this.winch.start();
    this.btn.setText('끌어올리기').setDisabled(true);
    for (let i = 0; i < 14; i++) {
      const p = this.add.image(this.boat.x - 230 + range(this.rng, -20, 20), WATER_Y, 'fx_splash').setDepth(13).setScale(range(this.rng, 0.3, 0.7));
      this.tweens.add({ targets: p, y: WATER_Y - range(this.rng, 30, 90), x: p.x + range(this.rng, -60, 30), alpha: 0, duration: 700, onComplete: () => p.destroy() });
    }
    this.tweens.add({
      targets: this,
      netDepth: 1,
      duration: 2000,
      ease: 'Sine.Out',
      onComplete: () => {
        this.phase = 'towing';
        this.btn.setDisabled(false);
        if (!this.d.tutorial) this.gusSay(pick(this.rng, GUS_TOW.start));
        else this.gusSay(GUS_TOW.tutorial[1], 4200);
      },
    });
  }

  private haul() {
    if (this.phase !== 'towing') return;
    this.phase = 'hauling';
    this.btn.setDisabled(true);
    this.gusSay(pick(this.rng, GUS_TOW.haul), 1600);
    sfx('creak');
    this.tweens.add({
      targets: this,
      netDepth: 0,
      duration: 2200,
      ease: 'Sine.In',
      onComplete: () => this.dump(),
    });
  }

  private dump() {
    this.phase = 'done';
    this.winch.stop();
    sfx('splash');
    const s = G.state;
    const items = rollHaul({
      ground: this.d.ground,
      seconds: this.t,
      conditions: conditionsFor(s.day, s.seed),
      netTornAtStart: s.netTorn && !this.snagged,
      snagged: this.snagged,
      snagLoss: this.snagLoss,
      day: s.day,
      towIndex: this.d.towIndex ?? 0,
      rng: this.rng,
      storyTaken: Object.keys(s.flags).filter((k) => k.startsWith('story_')).map((k) => k.slice(6)),
    });
    if (this.snagged) s.netTorn = true;
    s.today.trips += this.d.towIndex ? 0 : 1;
    s.week.trips += this.d.towIndex ? 0 : 1;
    s.flags.lastGround = this.d.ground;
    this.cameras.main.fadeOut(450, 255, 250, 240);
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.start('Deck', { items, ground: this.d.ground, towIndex: this.d.towIndex ?? 0, tutorial: this.d.tutorial, towSeconds: this.t }),
    );
  }

  private snag() {
    this.snagged = true;
    this.snagLoss = range(this.rng, TUNING.trawl.snagHaulLossMin, TUNING.trawl.snagHaulLossMax);
    sfx('snag');
    this.tweens.add({ targets: this.boat, x: this.boat.x - 18, duration: 120, yoyo: true, ease: 'Sine.Out' });
    this.gusSay(this.alone ? '' : pick(this.rng, GUS_TOW.snag), 2000);
    if (this.alone) this.bubble.say(this.boat.x + 70, this.boat.y - 150, '일라이: 걸렸다. 젠장.', 2000);
    this.time.delayedCall(900, () => this.haul());
  }

  update(time: number, delta: number) {
    const dt = delta / 1000;
    const fill = this.phase === 'towing' || this.phase === 'hauling' ? towCurve(this.t) : 0;
    const visFill = Math.min(1, fill * (G.state.netTorn && !this.snagged ? 0.6 : 1) * (this.snagged ? 1 - this.snagLoss : 1));

    if (this.phase === 'towing') {
      this.t += dt;
      this.secAcc += dt;
      while (this.secAcc >= 1) {
        this.secAcc -= 1;
        if (!this.snagged && this.rng() < snagChancePerSecond(this.d.ground, this.t)) {
          this.snag();
          break;
        }
      }
      this.winch.setLoad(visFill);
      this.commentary(visFill);
    } else if (this.phase === 'hauling') {
      this.winch.setLoad(visFill, true);
    }

    // boat bob + tilt (stern sinks as the net fills)
    const wind = this.weather === '바람' ? 1.8 : 1;
    const bob = Math.sin(time / 700) * 3 * wind;
    this.boat.y = WATER_Y + 8 + bob + visFill * 6;
    this.boat.angle = Math.sin(time / 900) * 1.2 * wind - visFill * 3.5;

    // waves
    const wv = this.waves;
    wv.clear();
    wv.fillStyle(PALETTE.sea, 0.85);
    wv.beginPath();
    wv.moveTo(0, 720);
    for (let x = 0; x <= 1280; x += 20) wv.lineTo(x, WATER_Y + 4 + Math.sin(x / 60 + time / 500) * 4 * wind + Math.sin(x / 23 + time / 300) * 1.5);
    wv.lineTo(1280, WATER_Y + 40);
    wv.lineTo(0, WATER_Y + 40);
    wv.closePath();
    wv.fillPath();
    wv.lineStyle(3, 0xffffff, 0.7);
    wv.beginPath();
    for (let x = 0; x <= 1280; x += 20) {
      const y = WATER_Y + 2 + Math.sin(x / 60 + time / 500) * 4 * wind + Math.sin(x / 23 + time / 300) * 1.5;
      if (x === 0) wv.moveTo(x, y);
      else wv.lineTo(x, y);
    }
    wv.strokePath();
    // wake behind the boat while towing
    if (this.phase === 'towing') {
      for (let i = 0; i < 5; i++) {
        const wx = this.boat.x - 260 - i * 60 - ((time / 6) % 60);
        wv.lineStyle(2, 0xffffff, 0.5 - i * 0.08).lineBetween(wx, WATER_Y + 8, wx + 30, WATER_Y + 8);
      }
    }

    // net position
    const sternX = this.boat.x - 225;
    const sternY = this.boat.y - 150;
    const restX = sternX + 10;
    const restY = this.boat.y - 40;
    const deepX = 230 + Math.sin(time / 1100) * 10;
    const deepY = 560 + Math.sin(time / 800) * 8;
    this.netPos.x = Phaser.Math.Linear(restX, deepX, this.netDepth);
    this.netPos.y = Phaser.Math.Linear(restY, deepY, this.netDepth);

    // tow line with vibration
    const lg = this.lineG;
    lg.clear();
    if (this.netDepth > 0.02) {
      const vib = this.phase === 'towing' ? (visFill * 3 + Math.max(0, this.t - TUNING.trawl.snagGraceSeconds) * 0.04) : 1;
      lg.lineStyle(3, PALETTE.ink, 0.9);
      lg.beginPath();
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const x = Phaser.Math.Linear(sternX, this.netPos.x + 40, u);
        const y = Phaser.Math.Linear(sternY, this.netPos.y - 30, u) + Math.sin(u * Math.PI) * 30 * (1 - visFill * 0.6);
        const off = Math.sin(time / 25 + u * 20) * vib * Math.sin(u * Math.PI);
        if (i === 0) lg.moveTo(x, y + off);
        else lg.lineTo(x, y + off);
      }
      lg.strokePath();
    }

    // net bag
    const ng = this.netG;
    ng.clear();
    if (this.netDepth > 0.02) {
      const len = 70 + visFill * 120;
      const bulge = 26 + visFill * 46;
      const mx = this.netPos.x + 40;
      const my = this.netPos.y - 30;
      ng.fillStyle(0x9fb7a0, 0.55);
      ng.lineStyle(3, 0x5f7f60, 1);
      ng.beginPath();
      ng.moveTo(mx, my - 30);
      ng.lineTo(mx - len * 0.5, my - 20 - bulge * 0.5);
      ng.lineTo(mx - len, my - bulge * 0.2);
      ng.lineTo(mx - len - 8, my + 8);
      ng.lineTo(mx - len, my + bulge * 0.3 + 10);
      ng.lineTo(mx - len * 0.5, my + 20 + bulge * 0.6);
      ng.lineTo(mx, my + 34);
      ng.closePath();
      ng.fillPath();
      ng.strokePath();
      ng.lineStyle(1.4, 0x5f7f60, 0.6);
      for (let i = 1; i < 6; i++) ng.lineBetween(mx - (len * i) / 6, my - 26 - bulge * 0.4 * Math.sin((i / 6) * Math.PI), mx - (len * i) / 6, my + 26 + bulge * 0.5 * Math.sin((i / 6) * Math.PI));
      // catch inside
      const n = Math.floor(visFill * 40);
      for (let i = 0; i < n; i++) {
        const u = ((i * 37) % 100) / 100;
        const v = ((i * 61) % 100) / 100 - 0.5;
        ng.fillStyle(i % 3 === 0 ? SHADE.shrimpDeep : SHADE.shrimp, 0.95);
        ng.fillEllipse(mx - len * (0.35 + u * 0.6), my + v * bulge * 0.9 + 6, 9, 6);
      }
      if (this.snagged) {
        ng.fillStyle(PALETTE.seaDeep, 1).fillEllipse(mx - len * 0.6, my + 10, 26, 18);
      }
      // mouth bar
      ng.lineStyle(5, SHADE.woodDark, 1).lineBetween(mx, my - 32, mx + 4, my + 36);
    }

    // swimmers flow past (relative motion); caught when they reach the mouth while towing
    const towing = this.phase === 'towing';
    for (const sw of this.swimmers) {
      if (sw.caught) continue;
      sw.img.x -= (towing ? 2.2 : 0.4) * (1 + sw.vx) * delta * 0.06;
      sw.img.y += Math.sin(time / 400 + sw.vx * 10) * 0.2;
      if (towing && Math.abs(sw.img.x - (this.netPos.x + 40)) < 24 && Math.abs(sw.img.y - this.netPos.y) < 70 && this.rng() < 0.6) {
        sw.caught = true;
        this.tweens.add({
          targets: sw.img,
          x: this.netPos.x - 20,
          y: this.netPos.y,
          alpha: 0,
          scale: 0.05,
          duration: 300,
          onComplete: () => {
            sw.img.destroy();
          },
        });
        continue;
      }
      if (sw.img.x < -40) {
        sw.img.x = 1320;
        sw.img.y = range(this.rng, WATER_Y + 60, 650);
      }
    }
    this.swimmers = this.swimmers.filter((sw) => !sw.caught || sw.img.active);
    if (towing && this.swimmers.filter((x) => !x.caught).length < 20) this.spawnSwimmer(false);
  }

  /** Test helper: pretend we towed for `seconds`, then haul. */
  testHaul(seconds: number) {
    if (this.phase === 'ready') {
      this.netDepth = 1;
      this.phase = 'towing';
      this.winch.start();
    }
    this.t = seconds;
    this.haul();
  }

  private commentary(fill: number) {
    const say = (key: string, lines: readonly string[], ms?: number) => {
      if (this.said.has(key)) return;
      this.said.add(key);
      this.gusSay(pick(this.rng, lines), ms);
    };
    if (this.d.tutorial) {
      if (this.t > 9 && !this.said.has('tut2')) {
        this.said.add('tut2');
        this.gusSay(GUS_TOW.tutorial[2], 4200);
      }
      if (this.t > 22 && !this.said.has('tut3')) {
        this.said.add('tut3');
        this.gusSay(GUS_TOW.tutorial[3], 4200);
      }
    }
    if (this.t > 12 && fill < 0.35) say('light', GUS_TOW.light);
    if (fill > 0.55) say('heavier', GUS_TOW.heavier);
    if (this.t > TUNING.trawl.goodTowMin) say('good', GUS_TOW.good);
    if (this.t > TUNING.trawl.goodTowMax + 5) say('greedy', GUS_TOW.greedy, 3200);
    if (this.alone && this.t > 40 && !this.said.has('eliAlone')) {
      this.said.add('eliAlone');
      this.bubble.say(this.boat.x + 70, this.boat.y - 150, '일라이: …무거워지네. 영감 말투가 옮았다.', 3000);
    }
  }
}

