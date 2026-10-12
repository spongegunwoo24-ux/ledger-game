import Phaser from 'phaser';
import { PALETTE, SHADE, FONT_TITLE, FONT_HAND } from '../art/palette';
import { addSprite } from '../art/manifest';
import { ambientWaves, sfx } from '../audio/sfx';
import { TUNING } from '../config/tuning';
import { G } from '../core/game';
import { owns } from '../core/state';
import type { GroundId } from '../core/types';
import { initView } from '../core/view';
import { seaEndTime } from '../core/clock';
import { hash32, makeRng, range } from '../core/rng';
import { GROUNDS, groundDef, isBest, type GroundDef } from '../data/grounds';

const HARBOR = { x: 185, y: 627 };
import { GROUND_TIPS } from '../data/logbook';
import { conditionsFor, groundAvailable } from '../systems/fishing';
import { spend } from '../systems/economy';
import { Button, panel } from '../ui/Button';
import { Bubble } from '../ui/Bubble';
import { Hud } from '../ui/Hud';
import { txt } from '../ui/text';

const SNAG_TEXT = { veryLow: '거의 안 걸림', low: '잘 안 걸림', medium: '가끔 걸림', high: '자주 걸림' } as const;

/** Top-down sea map: choose a ground. The spot in front of the lighthouse is always refused before Day 67. */
export class SeaMapScene extends Phaser.Scene {
  private card: Phaser.GameObjects.Container | null = null;
  private bubble!: Bubble;
  private selected: GroundId | null = null;

  private from: GroundId | null = null;
  private dive: GroundId | null = null;

  constructor() {
    super('SeaMap');
  }

  init(d: { from?: GroundId }) {
    this.from = d?.from ?? null;
  }

  create() {
    initView(this);
    this.card = null;
    this.selected = null;
    const s = G.state;
    this.cameras.main.fadeIn(300, 21, 18, 31);
    ambientWaves(true, 0.05);
    this.drawMap();
    new Hud(this);
    this.bubble = new Bubble(this, 900);
    txt(this, 640, 100, '어디로 갈까?', { size: 30, fontFamily: FONT_TITLE, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 6 }).setOrigin(0.5);

    for (const g of GROUNDS) this.node(g);

    // Calvin's small boat sits at "his place" every dawn (§8.7)
    if (s.segment === 'dawn' && s.day > 1 && s.day < 67) {
      const cb = addSprite(this, 1090, 268, 'boat_calvin', 0.22).setDepth(5);
      this.tweens.add({ targets: cb, y: 272, angle: 2, duration: 1600, yoyo: true, repeat: -1 });
      const lbl = txt(this, 1090, 290, '캘빈의 배', { size: 13, color: '#FFFAF0' }).setOrigin(0.5, 0).setDepth(5);
      lbl.setAlpha(0.8);
    }

    if (s.day === 6) {
      this.time.delayedCall(500, () => this.bubble.say(700, 280, '거스: 오늘은 내 자리. 따라와.', 3500));
    }
    if (this.from) {
      const back = this.from;
      new Button(this, 130, 670, '← 그대로 있기', () => this.scene.start('Trawl', { ground: back }), { w: 170, h: 48, size: 18, fill: 0xfff3d6 });
    } else {
      new Button(this, 120, 670, '← 항구', () => this.scene.start('Harbor'), { w: 150, h: 48, size: 20, fill: 0xfff3d6 });
    }
    txt(this, 640, 136, this.from ? '어장을 옮기면 가는 동안 시간이 흐른다' : '멀리 갈수록 바다에서 보낼 시간이 줄어든다', { size: 16, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 4 }).setOrigin(0.5);
    if (s.flags.ledgerAboard && !this.from) this.time.delayedCall(700, () => this.ledgerGuide());
  }

  /** [변경 1] Ledger flies over a ground with a school or a rare fish and dives (addictive device 1). */
  private ledgerGuide() {
    const s = G.state;
    const options = GROUNDS.filter((g) => g.id !== 'theSpot' && groundAvailable(s, g.id));
    if (!options.length) return;
    const rng = makeRng(hash32(s.seed, 'ledgerGuide', s.day));
    const hot = options[Math.floor(rng() * options.length)];
    const accuracy = Math.min(0.95, 0.55 + 0.05 * Math.min(8, s.ledgerFed));
    const target = rng() < accuracy ? hot : options[Math.floor(rng() * options.length)];
    this.dive = target.id;
    s.flags[`hotGround_${s.day}`] = hot.id;
    const bird = addSprite(this, HARBOR.x, HARBOR.y - 40, 'ch_ledger_fly', 0.9).setDepth(30);
    sfx('squawk');
    const tw = { t: 0 };
    const start = { x: HARBOR.x, y: HARBOR.y - 40 };
    const end = { x: target.pos.x, y: target.pos.y - 60 };
    const ctrl = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 220 };
    this.tweens.add({
      targets: tw,
      t: 1,
      duration: 2200,
      ease: 'Sine.InOut',
      onUpdate: () => {
        const t = tw.t;
        bird.x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * ctrl.x + t * t * end.x;
        bird.y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * ctrl.y + t * t * end.y;
        bird.setFlipX(end.x < start.x);
      },
      onComplete: () => {
        this.tweens.add({
          targets: bird,
          y: target.pos.y,
          scale: bird.scale * 0.7,
          duration: 300,
          ease: 'Quad.In',
          onComplete: () => {
            sfx('splash');
            for (let i = 0; i < 10; i++) {
              const p = this.add.image(target.pos.x, target.pos.y, 'fx_splash').setDepth(31).setScale(0.4);
              this.tweens.add({ targets: p, x: p.x + range(rng, -40, 40), y: p.y - range(rng, 10, 50), alpha: 0, duration: 600, onComplete: () => p.destroy() });
            }
            bird.setTexture('ch_ledger').setScale(0.6 / 2);
            this.tweens.add({ targets: bird, y: target.pos.y - 34, duration: 400, ease: 'Back.Out' });
            this.tweens.add({ targets: bird, angle: { from: -6, to: 6 }, duration: 700, yoyo: true, repeat: -1, delay: 400 });
            this.bubble.say(target.pos.x, target.pos.y - 70, '장부가 저기서 뭔가를 낚아챘다.', 2600);
          },
        });
      },
    });
  }

  private drawMap() {
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(PALETTE.sea, 0x7fd0e0, PALETTE.seaDeep, PALETTE.seaDeep, 1).fillRect(0, 0, 1280, 720);
    // coast (left + bottom-left) with harbor
    g.fillStyle(PALETTE.sand, 1);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(170, 0);
    g.lineTo(140, 200);
    g.lineTo(80, 380);
    g.lineTo(130, 560);
    g.lineTo(260, 720);
    g.lineTo(0, 720);
    g.closePath();
    g.fillPath();
    g.lineStyle(3, PALETTE.ink, 1).strokePath();
    g.fillStyle(SHADE.grass, 1).fillEllipse(40, 300, 120, 400);
    // river mouth
    g.fillStyle(0x7fb8a8, 1).fillEllipse(150, 300, 90, 40);
    // lighthouse point (top right)
    g.fillStyle(PALETTE.sand, 1);
    g.beginPath();
    g.moveTo(1280, 0);
    g.lineTo(980, 0);
    g.lineTo(1060, 90);
    g.lineTo(1150, 140);
    g.lineTo(1280, 170);
    g.closePath();
    g.fillPath();
    g.lineStyle(3, PALETTE.ink, 1).strokePath();
    addSprite(this, 1150, 110, 'sc_lighthouse', 0.3).setDepth(2);
    // waves
    for (let i = 0; i < 40; i++) g.lineStyle(2, 0xffffff, 0.35).lineBetween(200 + ((i * 173) % 1050), 160 + ((i * 97) % 520), 220 + ((i * 173) % 1050), 160 + ((i * 97) % 520));
    // harbor
    g.fillStyle(SHADE.wood, 1).fillRect(140, 620, 90, 14);
    g.lineStyle(2, PALETTE.ink, 1).strokeRect(140, 620, 90, 14);
    txt(this, 185, 590, '펠리컨 코브 항구', { size: 15 }).setOrigin(0.5);
    // compass
    txt(this, 1220, 660, 'N\n↑', { size: 18, align: 'center', color: '#FFFAF0' }).setOrigin(0.5);
  }

  private node(gd: GroundDef) {
    const s = G.state;
    const avail = groundAvailable(s, gd.id);
    const cond = conditionsFor(s.day, s.seed);
    const c = this.add.container(gd.pos.x, gd.pos.y).setDepth(10);
    const g = this.add.graphics();
    if (gd.id === 'theSpot') {
      // Dad's X, drawn over and over (D20)
      g.lineStyle(6, PALETTE.killerRed, 0.9);
      g.lineBetween(-22, -22, 22, 22).lineBetween(22, -22, -22, 22);
      g.lineStyle(3, PALETTE.killerRed, 0.6);
      g.lineBetween(-26, -18, 18, 26).lineBetween(26, -18, -18, 26);
      if (owns(s, 'fishFinder')) this.staticNoise(gd.pos.x, gd.pos.y);
    } else {
      g.fillStyle(avail ? PALETTE.butter : 0xd9d4e3, 1).fillCircle(0, 0, 26);
      g.lineStyle(3, PALETTE.ink, 1).strokeCircle(0, 0, 26);
      const known = gd.id !== 'gusSpot' ? s.tips.includes(gd.id) : true;
      if (known && avail && isBest(gd.id, cond)) {
        const star = this.add.image(20, -20, 'fx_sparkle').setScale(0.9).setTint(0xffd45e);
        c.add(star);
        this.tweens.add({ targets: star, angle: 360, duration: 4000, repeat: -1 });
      }
      if (owns(s, 'fishFinder') && avail) {
        const blob = this.add.graphics();
        const dens = gd.baseShrimp / 80;
        blob.fillStyle(SHADE.shrimp, 0.35).fillEllipse(0, 0, 70 * dens + 30, 46 * dens + 20);
        c.addAt(blob, 0);
        this.tweens.add({ targets: blob, scale: 1.15, alpha: 0.6, duration: 1200, yoyo: true, repeat: -1 });
      }
      const icon = txt(this, 0, 0, gd.id === 'gusSpot' ? '★' : '≈', { size: 22 }).setOrigin(0.5);
      c.add([g, icon]);
    }
    if (gd.id === 'theSpot') c.add(g);
    const label = txt(this, 0, 34, gd.name, { size: 17, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 5 }).setOrigin(0.5, 0);
    c.add(label);
    c.setSize(80, 80).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => c.setScale(1.08));
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerdown', () => this.select(gd));
    if (s.day === 6 && gd.id === 'gusSpot') {
      this.tweens.add({ targets: c, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    }
  }

  private staticNoise(x: number, y: number) {
    // fish finder shows only static in front of the lighthouse (D21)
    const n = this.add.graphics().setDepth(9);
    this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        n.clear();
        for (let i = 0; i < 60; i++) {
          n.fillStyle(Math.random() < 0.5 ? 0xffffff : 0x3b3355, 0.5);
          n.fillRect(x - 40 + Math.random() * 80, y - 30 + Math.random() * 60, 3, 2);
        }
      },
    });
  }

  private select(gd: GroundDef) {
    const s = G.state;
    sfx('click');
    if (gd.id === 'theSpot') {
      this.refuseSpot();
      return;
    }
    this.selected = gd.id;
    this.card?.destroy();
    const c = this.add.container(0, 0).setDepth(800);
    const shade = this.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.35).setOrigin(0).setInteractive();
    shade.on('pointerdown', () => {
      c.destroy();
      this.card = null;
    });
    c.add(shade);
    const g = this.add.graphics();
    const x = 450;
    panel(g, x, 150, 380, 420, 0xfffaf0, 18);
    c.add(g);
    c.add(txt(this, x + 190, 182, gd.name, { size: 26, fontFamily: FONT_TITLE }).setOrigin(0.5));
    c.add(txt(this, x + 24, 220, gd.blurb, { size: 19, wordWrap: { width: 330 } }));
    c.add(txt(this, x + 24, 276, `그물 걸림: ${SNAG_TEXT[gd.snag]}`, { size: 17, color: '#6b6385' }));
    const avail = groundAvailable(s, gd.id);
    const known = gd.id === 'gusSpot' || s.tips.includes(gd.id);
    const cond = conditionsFor(s.day, s.seed);
    if (known && gd.id !== 'gusSpot') {
      c.add(txt(this, x + 24, 310, `아버지 일지: ${GROUND_TIPS[gd.id as Exclude<GroundId, 'theSpot'>]}`, { size: 22, fontFamily: FONT_HAND, color: '#3b4a6c', wordWrap: { width: 330 } }));
      c.add(txt(this, x + 24, 410, isBest(gd.id, cond) ? '오늘: 딱 좋은 날이다.' : '오늘: 그저 그렇다.', { size: 18, color: isBest(gd.id, cond) ? '#2f8f5f' : '#6b6385' }));
    } else if (gd.id !== 'gusSpot') {
      c.add(txt(this, x + 24, 310, '아버지 일지에서 이 어장 메모를 아직 못 찾았다. 편지나 일지를 더 읽어 보자.', { size: 17, color: '#9a96a8', wordWrap: { width: 330 } }));
    }
    if (gd.id === 'gusSpot' && !avail) {
      c.add(txt(this, x + 24, 310, '거스가 데려갈 때만 갈 수 있다. "남한테 말하지 마."', { size: 18, color: '#9a96a8', wordWrap: { width: 330 } }));
    }
    const fuel = TUNING.costs.fuel;
    const mins = this.sailMinutes(gd.id);
    c.add(txt(this, x + 190, 434, `가는 데 ${mins}분${this.dive === gd.id ? ' · 장부가 다이빙한 곳' : ''}`, { size: 16, color: this.dive === gd.id ? '#b04a52' : '#6b6385' }).setOrigin(0.5));
    c.add(
      new Button(this, x + 190, 470, avail ? (this.from ? '여기로 옮긴다' : `여기로 간다 (기름 $${fuel})`) : '아직 못 간다', () => this.depart(gd.id), {
        w: 300,
        h: 54,
        fill: PALETTE.coral,
        disabled: !avail,
      }),
    );
    c.add(
      new Button(this, x + 190, 532, '다른 데 볼래', () => {
        c.destroy();
        this.card = null;
      }, { w: 200, h: 42, size: 18, fill: 0xfff3d6 }),
    );
    this.card = c;
  }

  private refuseSpot() {
    const s = G.state;
    s.theSpotAttempts += 1;
    if (!s.logbook.includes('LB_SPOT_TRY')) s.logbook.push('LB_SPOT_TRY');
    const gusLines = ['거긴 안 돼.', '…니 애비가 X 쳐 놓은 데다. 안 간다.', '키 돌려. 딴 데 가.', '말 안 들을 거면 내려.'];
    const eliLines = ['키를 돌리려는데 손이 안 움직인다.', '…아버지 글씨가 떠오른다. 절대 그물을 내리지 마라.', '아직은 아니다. 아직은.'];
    const alone = s.day >= 45 || !!s.flags.gusGone;
    const lines = alone ? eliLines : gusLines;
    const line = lines[(s.theSpotAttempts - 1) % lines.length];
    sfx('reject');
    this.bubble.say(1040, 180, alone ? `일라이: ${line}` : `거스: ${line}`, 2800);
  }

  /** minutes of sailing from the harbor (or the current ground) */
  private sailMinutes(id: GroundId): number {
    const to = groundDef(id).pos;
    const fromPos = this.from ? groundDef(this.from).pos : HARBOR;
    return Math.round((Phaser.Math.Distance.Between(fromPos.x, fromPos.y, to.x, to.y) / 100) * TUNING.clock.sailPer100px);
  }

  private depart(id: GroundId) {
    const s = G.state;
    if (this.selected !== id) return;
    if (!this.from) {
      const fuel = TUNING.costs.fuel;
      if (!spend(s, fuel)) s.flags.fuelCredit = (Number(s.flags.fuelCredit) || 0) + fuel;
    }
    const minutes = this.sailMinutes(id);
    const sailed = !this.from;
    s.time = Math.min(seaEndTime(s.day), s.time + minutes);
    if (sailed || !G.trip) G.trip = { ground: id, sailedAt: s.time, hauls: G.trip?.hauls ?? 0, legendSpawned: false, hot: false, tutorial: false };
    G.trip.ground = id;
    const hotId = s.flags[`hotGround_${s.day}`];
    G.trip.hot = this.dive === id && hotId === id;
    sfx('whoosh');
    this.cameras.main.fadeOut(400, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Trawl', { ground: id }));
  }
}
