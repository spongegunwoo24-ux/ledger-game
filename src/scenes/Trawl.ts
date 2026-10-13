import Phaser from 'phaser';
import { PALETTE, SHADE, FONT_TITLE } from '../art/palette';
import { addSprite } from '../art/manifest';
import { fishTexKey } from '../art/fish';
import { TEX_SCALE } from '../art/pen';
import { ambientWaves, music, sfx, Winch } from '../audio/sfx';
import { TUNING } from '../config/tuning';
import { fmtTime, seaEndTime, tickClock } from '../core/clock';
import { G, type Trip } from '../core/game';
import { hash32, makeRng, pick, range, type Rng } from '../core/rng';
import { owns } from '../core/state';
import type { GroundId, Weather } from '../core/types';
import { initView } from '../core/view';
import { digitOf, isHeld, KEY, onKey } from '../core/keys';
import { holdClock, releaseClock } from '../core/clock';
import { BAITS, baitDef, type BaitId } from '../data/bait';
import { GUS_TOW } from '../data/dialogue/gusDeck';
import { type FishDef } from '../data/fish';
import { groundDef } from '../data/grounds';
import { CHAR_NAMES } from '../data/names';
import { addFishToHold, logFish } from '../systems/economy';
import { FightModel, type Dir } from '../systems/fight';
import { conditionsFor, haulGrade, rollHaul, snagChancePerMinute, storyCatchFor, towCurve, type NetFish } from '../systems/fishing';
import type { SpawnContext } from '../systems/fishSpawn';
import { Bubble } from '../ui/Bubble';
import { Button, panel } from '../ui/Button';
import { DialogueBox, Toasts } from '../ui/Dialogue';
import { showFishCard } from '../ui/fishCard';
import { Hud } from '../ui/Hud';
import { runMinigame } from '../ui/minigames';
import { txt } from '../ui/text';
import { checkAfternoonClock, endSegment } from './director';
import { setTownPos } from './Town';
import { shoreDef, type ShoreDef, type ShoreId } from '../data/shore';
import { BED_Y, LAYER_BAND, SeaLife, WATER_Y, type Bait, type Swimmer } from './sea/SeaLife';

export interface TrawlData {
  ground: GroundId;
  tutorial?: boolean;
  /** [변경 2] fishing from the shore in the afternoon (no boat, no net, land clock) */
  shore?: ShoreId;
}

type NetPhase = 'up' | 'dropping' | 'down' | 'hauling' | 'stuck';

const BOAT_X = 840;
const NET_MOUTH = { x: 470, y: 612 };

/**
 * [변경 1] The sea: the net collects by itself from living water; optional rod fishing (F);
 * the sea clock runs (1 s = 1 game minute) until 08:00.
 */
export class TrawlScene extends Phaser.Scene {
  private d!: TrawlData;
  private trip!: Trip;
  private rng!: Rng;
  private winch = new Winch();
  private boat!: Phaser.GameObjects.Container;
  private waves!: Phaser.GameObjects.Graphics;
  private lineG!: Phaser.GameObjects.Graphics;
  private netG!: Phaser.GameObjects.Graphics;
  private rodG!: Phaser.GameObjects.Graphics;
  private dotsG!: Phaser.GameObjects.Graphics;
  private bubble!: Bubble;
  private toasts!: Toasts;
  private dlg!: DialogueBox;
  private netBtn!: Button;
  private rodBtn!: Button;
  private moveBtn!: Button;
  private homeBtn!: Button;
  private baitPanel!: Phaser.GameObjects.Container;
  private layerLabels!: Phaser.GameObjects.Container;
  private life!: SeaLife;
  private gusSprite: Phaser.GameObjects.Image | null = null;
  private ledgerSprite: Phaser.GameObjects.Image | null = null;
  private weather: Weather = '맑음';
  private alone = false;
  // net
  private net: NetPhase = 'up';
  private netDepth = 0;
  private towMinutes = 0;
  private snagged = false;
  private snagLoss = 0;
  private netFish: NetFish[] = [];
  private said = new Set<string>();
  // rod
  private fishing = false;
  private bait: Bait | null = null;
  private baitType: BaitId = 'shrimp';
  private bang!: Phaser.GameObjects.Text;
  private fight: FightModel | null = null;
  private fightFish: Swimmer | null = null;
  private fightUI: Phaser.GameObjects.Container | null = null;
  private reeling = false;
  /** mouse held in the water while fishing (bait follows it) */
  private ptr: { x: number; y: number } | null = null;
  private fishHint!: Phaser.GameObjects.Container;
  // effects
  private dark: Phaser.GameObjects.Image | null = null;
  private legendFish: Swimmer | null = null;
  private heartbeat: Phaser.Time.TimerEvent | null = null;
  private shadow: Phaser.GameObjects.Image | null = null;
  private ending = false;
  private busy = false;
  private shore: ShoreDef | null = null;

  constructor() {
    super('Trawl');
  }

  init(d: TrawlData) {
    this.d = d;
    this.net = 'up';
    this.netDepth = 0;
    this.towMinutes = 0;
    this.snagged = false;
    this.snagLoss = 0;
    this.netFish = [];
    this.said = new Set();
    this.fishing = false;
    this.bait = null;
    this.fight = null;
    this.fightFish = null;
    this.reeling = false;
    this.dark = null;
    this.legendFish = null;
    this.heartbeat = null;
    this.shadow = null;
    this.ending = false;
    this.busy = false;
  }

  create() {
    initView(this);
    const s = G.state;
    this.shore = this.d.shore ? shoreDef(this.d.shore) : null;
    if (this.shore) {
      this.trip = { ground: this.shore.water, sailedAt: s.time, hauls: 0, legendSpawned: !!s.flags[`legendShore_${s.day}`], hot: false, tutorial: false };
    } else {
      if (!G.trip || G.trip.ground !== this.d.ground) {
        G.trip = { ground: this.d.ground, sailedAt: s.time, hauls: G.trip?.hauls ?? 0, legendSpawned: false, hot: false, tutorial: !!this.d.tutorial };
      }
      this.trip = G.trip;
    }
    this.rng = makeRng(hash32(s.seed, 'sea', s.day, this.trip.hauls, Math.floor(s.time)));
    this.weather = conditionsFor(s.day, s.seed).weather;
    this.alone = s.day >= 45 || !!s.flags.gusGone || !!this.shore;
    this.cameras.main.fadeIn(400, 21, 18, 31);
    music(null);
    ambientWaves(true, 0.07);
    this.drawWorld(this.trip.ground);
    new Hud(this, { notebook: false, tracker: false });
    txt(this, 640, 104, this.shore ? this.shore.name : groundDef(this.trip.ground).name, { size: 24, fontFamily: FONT_TITLE, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(600);
    this.bubble = new Bubble(this, 760);
    this.toasts = new Toasts(this);
    this.dlg = new DialogueBox(this);
    this.bang = txt(this, 0, 0, '!', { size: 34, fontFamily: FONT_TITLE, color: '#D7263D', stroke: '#FFFAF0', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(40)
      .setVisible(false);

    this.life = new SeaLife(this, () => this.spawnCtx(), this.rng, {
      appear: (f) => this.onAppear(f),
      bite: () => this.onBite(),
      stripped: (f) => this.onStripped(f),
      netted: (f) => this.onNetted(f),
      netBump: () => this.gusSay('…그물이 크게 출렁였다. 뭔가 큰 게 지나갔다.', 3000),
      left: (f) => {
        if (f === this.legendFish) this.endLegendAmbience(false);
      },
    });
    this.life.setLegendSpawned(this.trip.legendSpawned);
    this.life.populate(7);

    // buttons
    this.netBtn = new Button(this, 300, 672, '그물 내리기', () => this.toggleNet(), { w: 220, h: 56, size: 22, fill: PALETTE.coral, sub: 'Space' }).setDepth(650);
    this.rodBtn = new Button(this, 540, 672, '낚싯대', () => this.toggleFishing(), { w: 170, h: 56, size: 22, fill: PALETTE.mint, sub: 'F' }).setDepth(650);
    this.moveBtn = new Button(this, 740, 672, '어장 옮기기', () => this.moveGround(), { w: 170, h: 56, size: 19, fill: 0xfff3d6, sub: '그물 올린 뒤' }).setDepth(650);
    this.homeBtn = new Button(this, 940, 672, '귀항', () => this.goHomeEarly(), { w: 150, h: 56, size: 20, fill: 0xfff3d6, sub: '시장으로' }).setDepth(650);
    this.buildBaitPanel();

    // keys by physical position, so they also work with the Korean IME on (한/영)
    onKey(this, 'Space', () => this.onSpace());
    onKey(this, 'KeyF', () => this.toggleFishing());
    onKey(this, ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'], (e) => this.selectBait(BAITS[digitOf(e) - 1].id));
    // mouse: hold in the water to lead the bait, click when "!" shows, click to reel in a fight
    this.ptr = null;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || !this.fishing || !this.bait || p.worldY < WATER_Y || p.worldY > 625) return;
      this.ptr = { x: p.worldX, y: p.worldY };
      this.onSpace(true);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.ptr && p.isDown) this.ptr = { x: p.worldX, y: p.worldY };
    });
    this.input.on('pointerup', () => (this.ptr = null));
    this.buildFishHint();
    if (this.shore) {
      this.netBtn.setVisible(false);
      this.moveBtn.setVisible(false);
      this.homeBtn.setText('그만하기').setSub('마을로');
      this.time.delayedCall(450, () => {
        if (!this.fishing) this.toggleFishing();
        this.eliSay(this.shore!.desc, 3400);
      });
    }
    this.events.once('shutdown', () => {
      this.winch.stop();
      this.heartbeat?.remove();
    });

    if (this.shore) {
      // nothing: the bank is quiet
    } else if (s.netTorn) this.time.delayedCall(600, () => this.gusSay('그물 찢어진 채로 나왔다. 반은 빠져나갈 거다.', 3600));
    else if (this.trip.tutorial && this.trip.hauls === 0) this.time.delayedCall(500, () => this.gusSay(GUS_TOW.tutorial[0], 4200));
    else if (groundDef(this.trip.ground).snag === 'high') this.time.delayedCall(600, () => this.gusSay(pick(this.rng, GUS_TOW.riskyGround)));
    this.refreshButtons();
    (window as unknown as { __sea?: TrawlScene }).__sea = this;
  }

  /** [변경 2] what Eli stands on when fishing from land; drawn into the boat container (local coords) */
  private drawShore(id: ShoreId) {
    const g = this.add.graphics();
    this.boat.add(g);
    const ink = PALETTE.ink;
    if (id === 'pier') {
      g.fillStyle(SHADE.wood, 1).fillRect(-900, -26, 780, 26);
      for (let x = -900; x < -120; x += 40) g.lineStyle(2, SHADE.woodDark, 1).lineBetween(x, -26, x, 0);
      g.lineStyle(4, ink, 1).strokeRect(-900, -26, 780, 26);
      for (const x of [-860, -640, -420, -180]) g.fillStyle(SHADE.woodDark, 1).fillRect(x, 0, 18, 420);
    } else if (id === 'breakwater') {
      for (let i = 0; i < 9; i++) g.fillStyle(i % 2 ? 0x8a8798 : 0x9e9bab, 1).fillEllipse(-880 + i * 90, -8 + (i % 3) * 6, 140, 70);
      g.lineStyle(3, ink, 0.6).strokeEllipse(-160, -6, 140, 70);
    } else if (id === 'riverbank') {
      g.fillStyle(0x7a9a5a, 1).fillRect(-900, -30, 800, 40);
      g.fillStyle(0x8a6a4a, 1).fillTriangle(-100, -30, -60, 40, -100, 40);
      for (let i = 0; i < 14; i++) g.lineStyle(4, 0x6fae6a, 1).lineBetween(-880 + i * 55, -30, -890 + i * 55, -80 - (i % 3) * 12);
    } else {
      g.fillStyle(PALETTE.sand, 1).fillTriangle(-900, -40, -60, 30, -900, 60);
      g.fillStyle(PALETTE.sand, 1).fillRect(-900, -40, 840, 40);
      for (let i = 0; i < 8; i++) g.fillStyle(0xffffff, 0.8).fillCircle(-820 + i * 90, -18, 4);
    }
    this.boat.add(addSprite(this, -110, id === 'pier' ? -26 : id === 'breakwater' ? -36 : -32, 'ch_eli', 0.55).setOrigin(0.5, 0.95));
  }

  private leaveShore() {
    if (this.ending || this.fight || this.reeling) return;
    this.ending = true;
    setTownPos(this.shore!.town);
    this.cameras.main.fadeOut(300, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Town', { at: this.shore!.town }));
  }

  private spawnCtx(): SpawnContext {
    const s = G.state;
    return {
      place: this.shore ? this.shore.place : this.trip.ground,
      also: this.shore?.also,
      conditions: conditionsFor(s.day, s.seed),
      time: s.time,
      minutesSinceSail: s.time - this.trip.sailedAt,
      day: s.day,
      hot: this.trip.hot,
    };
  }

  // ---------------- drawing ----------------
  private drawWorld(ground: GroundId) {
    const s = G.state;
    const dawn = s.segment === 'dawn';
    const sky = this.add.graphics().setDepth(0);
    const [top, bot] = dawn ? [0xb9a6dc, 0xffc7c2] : [0x8fd6ec, 0xd8f3f8];
    sky.fillGradientStyle(top, top, bot, bot, 1).fillRect(0, 0, 1280, WATER_Y + 10);
    if (this.weather === '흐림' || this.weather === '비') sky.fillStyle(0x9a96a8, 0.35).fillRect(0, 0, 1280, WATER_Y + 10);
    const sun = this.add.circle(1000, dawn ? 230 : 110, 46, dawn ? 0xffc7a8 : PALETTE.butter, 0.95).setDepth(1);
    if (dawn) this.tweens.add({ targets: sun, y: 140, duration: 240000 });
    for (let i = 0; i < 4; i++) {
      const cl = this.add.ellipse(150 + i * 330, 70 + (i % 2) * 40, 160, 36, 0xffffff, 0.75).setDepth(1);
      this.tweens.add({ targets: cl, x: cl.x - 200, duration: 60000 + i * 9000, repeat: -1, yoyo: true });
    }
    addSprite(this, 1215, WATER_Y - 36, 'sc_lighthouse', 0.3).setDepth(2);
    for (let i = 0; i < 3; i++) {
      const gull = addSprite(this, 180 + i * 300, 130 + i * 25, 'sc_gull', 0.8).setDepth(2);
      this.tweens.add({ targets: gull, x: gull.x + 120, y: gull.y - 20, duration: 4000 + i * 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    // trailing float/buoy (tripletail like to lie next to it)
    const buoy = addSprite(this, 200, WATER_Y + 4, 'sc_buoy', 0.9).setDepth(13);
    this.tweens.add({ targets: buoy, y: WATER_Y + 9, angle: { from: -8, to: 8 }, duration: 1500, yoyo: true, repeat: -1 });
    const water = this.add.graphics().setDepth(3);
    const deepTop = ground === 'river' ? 0x7fb8a8 : ground === 'channel' ? 0x4f9fb8 : PALETTE.sea;
    const deepBot = ground === 'river' ? 0x3f6f5f : ground === 'channel' ? 0x1f4a64 : PALETTE.seaDeep;
    water.fillGradientStyle(deepTop, deepTop, deepBot, deepBot, 1).fillRect(0, WATER_Y, 1280, 720 - WATER_Y);
    for (let i = 0; i < 6; i++) water.fillStyle(0xffffff, 0.05).fillTriangle(100 + i * 220, WATER_Y, 160 + i * 220, WATER_Y, 60 + i * 220, 720);
    const bed = this.add.graphics().setDepth(4);
    const bedColor = ground === 'sandbar' ? 0xf0d8a0 : ground === 'river' ? 0x8a7a5a : ground === 'oyster' ? 0xc9b48a : 0xb8a888;
    bed.fillStyle(bedColor, 1);
    bed.beginPath();
    bed.moveTo(0, 720);
    for (let x = 0; x <= 1280; x += 40) bed.lineTo(x, BED_Y - 6 + Math.sin(x / 90) * 8);
    bed.lineTo(1280, 720);
    bed.closePath();
    bed.fillPath();
    if (ground === 'wreck') {
      bed.fillStyle(0x6d5a4a, 1).fillRect(820, 590, 280, 90);
      bed.fillStyle(0x5a4a3a, 1).fillRect(900, 500, 14, 110);
      bed.lineStyle(3, PALETTE.ink, 0.6).strokeRect(820, 590, 280, 90);
    }
    if (ground === 'oyster') for (let i = 0; i < 9; i++) bed.fillStyle(0x9c7a5a, 1).fillRect(80 + i * 140, 600, 10, 90);
    if (ground === 'river') for (let i = 0; i < 6; i++) bed.fillStyle(0x6f9f5a, 0.8).fillEllipse(100 + i * 220, 676, 60, 24);
    if (ground === 'channel') for (let i = 0; i < 8; i++) bed.fillStyle(0x6fae6a, 0.6).fillTriangle(1120 + (i % 4) * 30, 690, 1130 + (i % 4) * 30, 470 + i * 12, 1140 + (i % 4) * 30, 690);
    for (let i = 0; i < 10; i++) bed.fillStyle(0x7fcf9f, 0.7).fillTriangle(40 + i * 130, 700, 52 + i * 130, 640 - (i % 3) * 18, 64 + i * 130, 700);
    // layer guide (shown while fishing)
    this.layerLabels = this.add.container(0, 0).setDepth(6).setVisible(false);
    const lg = this.add.graphics();
    for (const y of [LAYER_BAND.middle[0], LAYER_BAND.bottom[0]]) {
      for (let x = 0; x < 1280; x += 24) lg.lineStyle(1.5, 0xffffff, 0.25).lineBetween(x, y, x + 12, y);
    }
    this.layerLabels.add(lg);
    (['surface', 'middle', 'bottom'] as const).forEach((l) => {
      const [a, b] = LAYER_BAND[l];
      this.layerLabels.add(txt(this, 14, (a + b) / 2, l === 'surface' ? '수면' : l === 'middle' ? '중간' : '바닥', { size: 15, color: '#FFFAF0' }).setOrigin(0, 0.5).setAlpha(0.7));
    });
    this.dotsG = this.add.graphics().setDepth(5);
    this.netG = this.add.graphics().setDepth(7);
    this.lineG = this.add.graphics().setDepth(8);

    this.boat = this.add.container(BOAT_X, WATER_Y + 8).setDepth(10);
    if (this.shore) {
      this.drawShore(this.shore.id);
      this.rodG = this.add.graphics().setDepth(11);
      this.waves = this.add.graphics().setDepth(12);
      return;
    }
    const ml = addSprite(this, 0, 0, 'boat_marylou', 0.85).setOrigin(0.5, 200 / 240);
    this.boat.add(ml);
    if (s.flags.graffiti) {
      this.boat.add(this.add.text(-40, -44, 'KILLER', { fontFamily: '"Jua", sans-serif', fontSize: '26px', color: '#D7263D', resolution: 2 }).setAngle(-3));
    } else if (s.flags.paintedOver === 'cheap' && this.weather === '맑음') {
      this.boat.add(this.add.text(-40, -44, 'KILLER', { fontFamily: '"Jua", sans-serif', fontSize: '26px', color: '#D7263D', resolution: 2 }).setAngle(-3).setAlpha(0.16));
    }
    this.boat.add(this.add.text(76, -56, 'MARY LOU', { fontFamily: '"Jua", sans-serif', fontSize: '16px', color: '#3B3355', resolution: 2 }).setAngle(-2.6));
    this.boat.add(addSprite(this, -110, -82, 'ch_eli', 0.55));
    if (!this.alone) {
      this.gusSprite = addSprite(this, -40, -80, 'ch_gus', 0.55);
      this.boat.add(this.gusSprite);
    }
    if (s.flags.ledgerAboard) {
      this.ledgerSprite = addSprite(this, 175, -104, 'ch_ledger', 0.5).setFlipX(true);
      this.boat.add(this.ledgerSprite);
      this.tweens.add({ targets: this.ledgerSprite, angle: { from: -3, to: 3 }, duration: 900, yoyo: true, repeat: -1 });
    }
    this.rodG = this.add.graphics().setDepth(11);
    this.waves = this.add.graphics().setDepth(12);
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

  private buildBaitPanel() {
    this.baitPanel?.destroy();
    const s = G.state;
    const c = this.add.container(0, 0).setDepth(650).setVisible(this.fishing);
    const g = this.add.graphics();
    g.fillStyle(0xfffaf0, 0.92).fillRoundedRect(1070, 92, 198, 196, 14).lineStyle(3, PALETTE.ink, 1).strokeRoundedRect(1070, 92, 198, 196, 14);
    c.add(g);
    c.add(txt(this, 1169, 108, '미끼 (1~4)', { size: 15, color: '#6b6385' }).setOrigin(0.5));
    BAITS.forEach((b, i) => {
      const y = 136 + i * 36;
      const sel = b.id === this.baitType;
      const n = s.bait[b.id] ?? 0;
      const row = txt(this, 1082, y, `${i + 1}. ${b.name} ×${n}`, { size: 15, color: sel ? '#b04a52' : n > 0 ? '#3B3355' : '#b9b4c7' });
      if (sel) g.fillStyle(PALETTE.butter, 1).fillRoundedRect(1076, y - 4, 186, 28, 8);
      const z = this.add.zone(1076, y - 4, 186, 28).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => this.selectBait(b.id));
      c.add([row, z]);
    });
    if ((s.bait.shrimp ?? 0) <= 0 && s.hold.small >= 0.5) {
      c.add(new Button(this, 1169, 300, '잔새우로 미끼 +6', () => this.makeShrimpBait(), { w: 190, h: 34, size: 14, fill: PALETTE.mint }));
    }
    this.baitPanel = c;
  }

  private makeShrimpBait() {
    const s = G.state;
    if (s.hold.small < 0.5) return;
    s.hold.small = Math.round((s.hold.small - 0.5) * 100) / 100;
    s.bait.shrimp = (s.bait.shrimp ?? 0) + 6;
    sfx('plop');
    this.buildBaitPanel();
  }

  private selectBait(id: BaitId) {
    if ((G.state.bait[id] ?? 0) <= 0) {
      this.toasts.show(`${baitDef(id).name}가 없다. 새벽에 행크의 가판대에서 판다.`, PALETTE.coral);
      return;
    }
    this.baitType = id;
    if (this.bait) this.bait.type = id;
    sfx('click');
    this.buildBaitPanel();
  }

  private gusSay(text: string, ms = 2800) {
    if (this.alone) return;
    const x = (this.gusSprite?.x ?? -40) + this.boat.x;
    this.bubble.say(x, this.boat.y - 140, `${CHAR_NAMES.gus}: ${text}`, ms);
  }

  private eliSay(text: string, ms = 2800) {
    this.bubble.say(this.boat.x - 110, this.boat.y - 140, `일라이: ${text}`, ms);
  }

  private refreshButtons() {
    const busy = this.ending || this.busy;
    this.netBtn.setText(this.net === 'down' ? '그물 올리기' : this.net === 'stuck' ? '그물 풀러 가기' : '그물 내리기');
    this.netBtn.setDisabled(busy || this.net === 'dropping' || this.net === 'hauling');
    this.netBtn.setSub(this.fishing ? '클릭 (낚시 중)' : 'Space');
    this.rodBtn.setText(this.fishing ? '낚싯대 거두기' : '낚싯대');
    this.rodBtn.setDisabled(busy || this.net === 'stuck');
    this.moveBtn.setDisabled(busy || this.net !== 'up' || this.trip.tutorial);
    this.homeBtn.setDisabled(busy || this.net === 'dropping' || this.net === 'hauling' || this.trip.tutorial);
  }

  // ---------------- net ----------------
  private toggleNet() {
    if (this.ending || this.busy) return;
    if (this.net === 'up') this.dropNet();
    else if (this.net === 'down') this.haul(false);
    else if (this.net === 'stuck') void this.freeNet();
  }

  private dropNet() {
    this.net = 'dropping';
    this.towMinutes = 0;
    this.snagged = false;
    this.netFish = [];
    sfx('splash');
    sfx('creak');
    this.winch.start();
    for (let i = 0; i < 14; i++) {
      const p = this.add.image(this.boat.x - 220 + range(this.rng, -20, 20), WATER_Y, 'fx_splash').setDepth(13).setScale(range(this.rng, 0.3, 0.7));
      this.tweens.add({ targets: p, y: WATER_Y - range(this.rng, 30, 90), x: p.x + range(this.rng, -60, 30), alpha: 0, duration: 700, onComplete: () => p.destroy() });
    }
    this.tweens.add({
      targets: this,
      netDepth: 1,
      duration: 1800,
      ease: 'Sine.Out',
      onComplete: () => {
        this.net = 'down';
        this.refreshButtons();
        if (this.trip.tutorial && this.trip.hauls === 0) this.gusSay(GUS_TOW.tutorial[1], 4200);
        else this.gusSay(pick(this.rng, GUS_TOW.start));
      },
    });
    this.refreshButtons();
  }

  private async freeNet() {
    this.busy = true;
    this.refreshButtons();
    await this.dlgThink('그물이 바닥에 걸렸다. 영감이 있었으면 혼자 풀었을 텐데. 내가 내려가서 풀어야 한다.');
    await runMinigame(this, 'knot', { points: G.state.flags.knotSkill ? 3 : 5 });
    this.busy = false;
    this.haul(false, true);
  }

  private dlgThink(t: string): Promise<void> {
    return this.dlg.show('think', t).then(() => this.dlg.hide());
  }

  private snag() {
    this.snagged = true;
    this.snagLoss = range(this.rng, TUNING.trawl.snagHaulLossMin, TUNING.trawl.snagHaulLossMax);
    sfx('snag');
    this.tweens.add({ targets: this.boat, x: this.boat.x - 16, duration: 120, yoyo: true, ease: 'Sine.Out' });
    if (!this.alone) {
      this.gusSay(pick(this.rng, GUS_TOW.snag), 2200);
      this.time.delayedCall(900, () => this.haul(false));
    } else {
      // [변경 1] from Day 45 Eli must free it himself; fishing stops
      this.net = 'stuck';
      if (this.fishing) this.toggleFishing();
      this.eliSay('걸렸다. 젠장. 직접 풀어야 한다.', 2600);
      this.refreshButtons();
    }
  }

  private haul(final: boolean, afterFree = false) {
    if (this.net !== 'down' && !(afterFree && this.net === 'stuck')) return;
    this.net = 'hauling';
    if (this.fishing) this.toggleFishing();
    this.refreshButtons();
    this.gusSay(pick(this.rng, GUS_TOW.haul), 1600);
    sfx('creak');
    this.tweens.add({ targets: this, netDepth: 0, duration: 1900, ease: 'Sine.In', onComplete: () => void this.reveal(final) });
  }

  /** [변경 1] haul reveal: the bulging net, the winch, the spill, the grade. */
  private async reveal(final: boolean) {
    const s = G.state;
    const fill = this.visFill();
    this.winch.setLoad(Math.min(1, fill + 0.4), true);
    const bag = this.add.graphics().setDepth(14);
    const bx = this.boat.x - 250;
    const by = this.boat.y - 140;
    const r = 26 + fill * 54;
    bag.fillStyle(0x9fb7a0, 0.85).fillEllipse(bx, by, r * 1.5, r * 1.9).lineStyle(3, 0x5f7f60).strokeEllipse(bx, by, r * 1.5, r * 1.9);
    for (let i = 0; i < Math.floor(fill * 30); i++) bag.fillStyle(SHADE.shrimp, 1).fillEllipse(bx + range(this.rng, -r * 0.6, r * 0.6), by + range(this.rng, -r * 0.7, r * 0.7), 8, 5);
    this.tweens.add({ targets: bag, y: -6, duration: 120, yoyo: true, repeat: 4 });
    await this.wait(900);
    this.winch.stop();
    const items = rollHaul({
      ground: this.trip.ground,
      minutes: this.towMinutes,
      conditions: conditionsFor(s.day, s.seed),
      netTornAtStart: s.netTorn && !this.snagged,
      betterNet: !!s.flags.betterNet,
      snagged: this.snagged,
      snagLoss: this.snagLoss,
      day: s.day,
      towIndex: this.trip.hauls,
      rng: this.rng,
      storyTaken: Object.keys(s.flags).filter((k) => k.startsWith('story_')).map((k) => k.slice(6)),
      storyItems: storyCatchFor(s, this.trip.ground),
      netFish: this.netFish,
      hot: this.trip.hot,
    });
    if (this.snagged) s.netTorn = true;
    if (this.trip.hauls === 0) {
      s.today.trips += 1;
      s.week.trips += 1;
    }
    this.trip.hauls += 1;
    s.flags.lastGround = this.trip.ground;
    const grade = haulGrade(items, this.trip.ground);
    sfx('splash');
    bag.destroy();
    const big = grade === '대박' || grade === '전설의 그물';
    if (big) {
      const dk = this.add.rectangle(0, 0, 1280, 720, 0x0d0b18, 0).setOrigin(0).setDepth(900);
      this.tweens.add({ targets: dk, fillAlpha: 0.75, duration: 380 });
      sfx('heartbeat');
      await this.wait(650);
      this.cameras.main.flash(260, 255, 250, 230);
      dk.destroy();
      for (let i = 0; i < 30; i++) {
        const p = this.add.image(640, 300, i % 2 ? 'fx_sparkle' : 'fx_coin').setDepth(910).setScale(range(this.rng, 0.6, 1.3));
        this.tweens.add({ targets: p, x: 640 + range(this.rng, -520, 520), y: 300 + range(this.rng, -260, 300), alpha: 0, angle: 360, duration: 1100, onComplete: () => p.destroy() });
      }
    }
    const colors: Record<string, string> = { 보통: '#FFFAF0', 풍어: '#A8E6CF', 대박: '#FFE29A', '전설의 그물': '#FFB3C1' };
    const gt = txt(this, 640, 300, grade === '보통' ? '보통' : `${grade}!`, { size: big ? 76 : 56, fontFamily: FONT_TITLE, color: colors[grade], stroke: '#3B3355', strokeThickness: 10 })
      .setOrigin(0.5)
      .setDepth(920)
      .setScale(0.2);
    sfx(big ? 'fanfare' : grade === '풍어' ? 'chime' : 'plop');
    this.tweens.add({ targets: gt, scale: 1, duration: 360, ease: 'Back.Out' });
    if (grade !== '보통') this.gusSay(grade === '풍어' ? '…괜찮네.' : grade === '대박' ? '…허. 이런 날도 있지.' : '…니 애비 평생에 이런 그물 몇 번 못 봤다.', 2400);
    await this.wait(big ? 1500 : 1000);
    const final2 = final || s.time >= seaEndTime(s.day) - 1;
    this.cameras.main.fadeOut(400, 255, 250, 240);
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.start('Deck', { items, ground: this.trip.ground, towIndex: this.trip.hauls - 1, tutorial: this.trip.tutorial, final: final2 }),
    );
  }

  private visFill(): number {
    const fill = towCurve(this.towMinutes);
    return Math.min(1, fill * (G.state.netTorn && !this.snagged ? 0.6 : 1) * (this.snagged ? 1 - this.snagLoss : 1));
  }

  private onNetted(f: Swimmer) {
    this.netFish.push({ id: f.def.id, inches: f.inches });
    this.tweens.add({ targets: f.img, x: NET_MOUTH.x - 60, y: NET_MOUTH.y, scale: 0.05, alpha: 0, duration: 400, onComplete: () => this.life.remove(f) });
  }

  // ---------------- rod ----------------
  private toggleFishing() {
    if (this.ending || this.busy || this.fight || this.reeling) return;
    if (this.net === 'stuck') return;
    this.fishing = !this.fishing;
    this.layerLabels.setVisible(this.fishing);
    if (this.fishing) {
      if ((G.state.bait[this.baitType] ?? 0) <= 0) {
        const any = BAITS.find((b) => (G.state.bait[b.id] ?? 0) > 0);
        if (any) this.baitType = any.id;
      }
      this.bait = { type: this.baitType, x: this.boat.x - 140, y: WATER_Y + 30, speed: 0, stillFor: 0 };
      sfx('whoosh');
      sfx('plop');
      if (!G.state.flags.rodTip) {
        G.state.flags.rodTip = true;
        this.gusSay('미끼를 움직여 봐. 고기가 물면 "!" 뜬다. 그때 당겨.', 4600);
        void this.howToFish();
      }
    } else {
      this.bait = null;
      this.rodG.clear();
      this.bang.setVisible(false);
    }
    this.ptr = null;
    this.fishHint.setVisible(this.fishing);
    this.buildBaitPanel();
    this.refreshButtons();
  }

  /** Always-on help line while the rod is out. */
  private buildFishHint() {
    const c = this.add.container(640, 618).setDepth(655).setVisible(false);
    const g = this.add.graphics();
    g.fillStyle(0x241e3a, 0.82).fillRoundedRect(-470, -17, 940, 34, 17);
    c.add(g);
    c.add(
      txt(this, 0, 0, '미끼 이동: 방향키·WASD 또는 물속을 마우스로 꾹  ·  "!" 뜨면 스페이스 또는 클릭  ·  F: 낚싯대 거두기', {
        size: 16,
        color: '#FFFAF0',
      }).setOrigin(0.5),
    );
    this.fishHint = c;
  }

  /** First time the rod comes out: a short card on how fishing works. */
  private howToFish(): Promise<void> {
    return new Promise((res) => {
      const token = {};
      holdClock(token);
      const c = this.add.container(0, 0).setDepth(1300);
      const shade = this.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.5).setOrigin(0).setInteractive();
      const g = this.add.graphics();
      panel(g, 300, 110, 680, 470, 0xfbf6e8, 18);
      c.add([shade, g]);
      c.add(txt(this, 640, 150, '낚시하는 법', { size: 32, fontFamily: FONT_TITLE }).setOrigin(0.5));
      const lines = [
        ['1', '미끼를 움직인다', '방향키나 WASD. 마우스라면 물속을 꾹 누르고 있으면 그쪽으로 간다. 가만히 두면 천천히 가라앉는다.'],
        ['2', '물고기를 기다린다', '가까이 오면 실루엣이 선명해진다. 겁 많은 고기는 미끼가 가만히 있어야, 사냥꾼은 빨리 움직여야 문다.'],
        ['3', '"!"가 뜨면 바로 당긴다', '스페이스 또는 물속 클릭. 0.3초 안이면 완벽. 늦으면 미끼만 뜯긴다.'],
        ['4', '큰 고기는 싸운다', '화면에 나오는 화살표 방향 키를 누른 채 스페이스 연타. 점프하면 잠깐 멈춘다.'],
      ];
      lines.forEach(([n, head, body], i) => {
        const y = 200 + i * 86;
        const cg = this.add.graphics();
        cg.fillStyle(PALETTE.coral, 1).fillCircle(350, y + 14, 16);
        c.add(cg);
        c.add(txt(this, 350, y + 14, n, { size: 18, fontFamily: FONT_TITLE, color: '#FFFAF0' }).setOrigin(0.5));
        c.add(txt(this, 380, y, head, { size: 21, fontFamily: FONT_TITLE }));
        c.add(txt(this, 380, y + 30, body, { size: 16, color: '#4a4560', wordWrap: { width: 570, useAdvancedWrap: true } }));
      });
      c.add(txt(this, 640, 555, '그물은 바닥에서 따로 혼자 찬다. 낚시 중에 그물은 아래 버튼으로 올린다.  ·  누르면 닫힘', { size: 14, color: '#9a96a8' }).setOrigin(0.5));
      this.busy = true;
      this.refreshButtons();
      let open = true;
      const close = () => {
        if (!open) return;
        open = false;
        window.removeEventListener('keydown', key);
        releaseClock(token);
        c.destroy();
        this.busy = false;
        if (this.scene.isActive()) this.refreshButtons();
        res();
      };
      const key = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
          e.preventDefault();
          close();
        }
      };
      window.setTimeout(() => {
        if (!open) return;
        shade.on('pointerdown', close);
        window.addEventListener('keydown', key);
      }, 350);
      this.events.once('shutdown', close);
    });
  }

  private haveBait(): boolean {
    return (G.state.bait[this.baitType] ?? 0) > 0;
  }

  private heldDir(): Dir {
    if (isHeld(...KEY.left)) return 'left';
    if (isHeld(...KEY.right)) return 'right';
    if (isHeld(...KEY.up)) return 'up';
    if (isHeld(...KEY.down)) return 'down';
    // mouse held: the side of the bait it is on
    if (this.ptr && this.bait) {
      const dx = this.ptr.x - this.bait.x;
      const dy = this.ptr.y - this.bait.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return 'none';
      if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
      return dy < 0 ? 'up' : 'down';
    }
    return 'none';
  }

  /** Space (or a click in the water while fishing): net, hook, or reel. */
  private onSpace(fromMouse = false) {
    if (this.ending || this.busy || this.dlg.visible) return;
    if (this.fight) {
      this.fight.tap(this.heldDir());
      sfx('reel');
      return;
    }
    if (!this.fishing) {
      if (this.shore) {
        if (!fromMouse) this.toggleFishing();
      } else if (!fromMouse) this.toggleNet();
      return;
    }
    const b = this.life.biter();
    if (b && this.bait) {
      const dt = (this.time.now - b.biteAt) / 1000;
      this.hook(b, dt <= TUNING.fishing.perfectWindow ? 'perfect' : 'good');
    } else if (this.bait && !fromMouse) {
      // a jerk of the rod: the bait jumps up (and scares the shy)
      this.bait.y = Math.max(WATER_Y + 20, this.bait.y - 26);
      this.bait.speed = 160;
    }
  }

  private onBite() {
    if (!this.bait) return;
    sfx('pop');
    this.bang.setVisible(true);
  }

  private onStripped(f: Swimmer) {
    this.bang.setVisible(false);
    const s = G.state;
    if (this.baitType !== 'lure' && this.fishing) {
      s.bait[this.baitType] = Math.max(0, (s.bait[this.baitType] ?? 0) - 1);
      this.toasts.show(`미끼를 뜯겼다 (${f.def.behavior === 'thief' ? '미끼 도둑' : '늦었다'})`, PALETTE.peach);
      if (f.def.id === 'hardhead' && this.rng() < 0.5) this.gusSay('…또 바다메기냐.', 2000);
      this.buildBaitPanel();
      if (!this.haveBait()) {
        const any = BAITS.find((b) => (s.bait[b.id] ?? 0) > 0);
        if (any) this.selectBait(any.id);
        else {
          this.toasts.show('미끼가 다 떨어졌다.', PALETTE.coral);
          this.toggleFishing();
        }
      }
    }
  }

  private hook(f: Swimmer, quality: 'perfect' | 'good') {
    this.bang.setVisible(false);
    f.state = 'hooked';
    f.img.clearTint().setAlpha(1);
    const s = G.state;
    this.toasts.show(quality === 'perfect' ? '완벽!' : '좋아!', quality === 'perfect' ? PALETTE.butter : PALETTE.mint);
    const r = f.def.rarity;
    if (r === 'common' || r === 'uncommon') {
      this.reeling = true;
      sfx('reel');
      this.tweens.add({
        targets: f.img,
        x: this.boat.x - 150,
        y: WATER_Y - 60,
        angle: -60,
        duration: 520,
        ease: 'Back.In',
        onComplete: () => {
          sfx('splash');
          void this.landed(f);
        },
      });
      return;
    }
    // rare+: a short fight (legendary: long, in the dark)
    const base = TUNING.fishing.fight[r === 'rare' ? 'rare' : r === 'veryRare' ? 'veryRare' : 'legendary'];
    const dur = base * (quality === 'perfect' ? 0.75 : 1);
    this.fight = new FightModel(f.def.pattern ?? 'A', dur, this.rng, owns(s, 'strongLine') ? 0.7 : 1);
    this.fightFish = f;
    if (r === 'veryRare' || r === 'legendary') this.slowMo(r === 'legendary' ? 900 : 600);
    if (r === 'legendary') {
      this.cameras.main.flash(300, 255, 255, 255);
      this.cameras.main.shake(450, 0.01);
    }
    this.buildFightUI();
  }

  private slowMo(ms: number) {
    this.tweens.timeScale = 0.3;
    this.time.timeScale = 0.3;
    window.setTimeout(() => {
      this.tweens.timeScale = 1;
      this.time.timeScale = 1;
    }, ms);
  }

  private buildFightUI() {
    this.fightUI?.destroy();
    const c = this.add.container(0, 0).setDepth(700);
    const hint = txt(this, 640, 150, '', { size: 30, fontFamily: FONT_TITLE, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 6 }).setOrigin(0.5);
    hint.setName('hint');
    const sub = txt(this, 640, 188, '화살표 방향 키를 누른 채 스페이스 연타! (마우스: 화살표 쪽을 누른 채 클릭 연타)', { size: 17, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 4 }).setOrigin(0.5);
    c.add([hint, sub]);
    this.fightUI = c;
  }

  private updateFight(dt: number) {
    const f = this.fight!;
    const fish = this.fightFish!;
    const held = this.heldDir();
    f.update(dt, held);
    // the fish pulls; progress brings it up
    if (this.bait) {
      const pullX = f.pull === 'left' ? -1 : f.pull === 'right' ? 1 : 0;
      const pullY = f.pull === 'down' ? 1 : 0;
      this.bait.x = Phaser.Math.Clamp(this.bait.x + pullX * 40 * dt * (held === f.want ? 0.2 : 1), 80, 1200);
      const targetY = Phaser.Math.Linear(Math.min(BED_Y - 30, this.bait.y + pullY * 4), WATER_Y + 20, f.progress);
      this.bait.y = Phaser.Math.Linear(this.bait.y, targetY, 0.08);
      if (f.jumping) {
        fish.img.setPosition(this.bait.x, WATER_Y - 40 + Math.sin(this.time.now / 80) * 10).setAngle(-30);
      } else {
        fish.img.setPosition(this.bait.x - (pullX || 1) * fish.width * 0.4, this.bait.y).setAngle(Math.sin(this.time.now / 60) * 8);
        if (pullX !== 0) this.life.turn(fish, pullX > 0 ? 1 : -1);
      }
    }
    const hint = this.fightUI?.getByName('hint') as Phaser.GameObjects.Text | null;
    if (hint) {
      const arrow = { left: '◀', right: '▶', up: '▲', down: '▼', none: '' }[f.want];
      hint.setText(f.jumping ? '점프! 멈춰!' : `${arrow} 누르고 연타`);
      hint.setColor(f.jumping ? '#FFE29A' : held === f.want ? '#A8E6CF' : '#FFFAF0');
    }
    if (f.result === 'win') void this.fightWon();
    else if (f.result === 'lose') this.fightLost();
  }

  private async fightWon() {
    const fish = this.fightFish!;
    this.fight = null;
    this.fightUI?.destroy();
    this.fightUI = null;
    sfx('splash');
    if (fish.def.rarity === 'legendary') {
      this.endLegendAmbience(true);
      // the fish leaps from the surface
      fish.img.setPosition(this.boat.x - 260, WATER_Y + 20).setDepth(30);
      await new Promise<void>((res) =>
        this.tweens.add({
          targets: fish.img,
          y: WATER_Y - 170,
          angle: -40,
          duration: 520,
          yoyo: true,
          ease: 'Quad.Out',
          onComplete: () => res(),
        }),
      );
      sfx('splash');
    }
    await this.landed(fish);
  }

  private fightLost() {
    const f = this.fight!;
    const fish = this.fightFish!;
    this.fight = null;
    this.fightUI?.destroy();
    this.fightUI = null;
    sfx('snap');
    const s = G.state;
    s.bait[this.baitType] = Math.max(0, (s.bait[this.baitType] ?? 0) - 1);
    this.buildBaitPanel();
    this.toasts.show(f.loseReason === 'snap' ? '줄이 끊어졌다.' : '바늘이 빠졌다.', PALETTE.coral);
    fish.state = 'flee';
    fish.calmUntil = this.time.now + 60000;
    this.tweens.add({ targets: fish.img, alpha: 0.5, duration: 600 });
    if (fish.def.rarity === 'legendary') {
      if (this.shadow) this.tweens.add({ targets: this.shadow, y: BED_Y + 80, alpha: 0, duration: 2500 });
      this.endLegendAmbience(false, 2200);
      this.time.delayedCall(800, () => this.gusSay('…다음에 또 오겠지.', 3000));
    } else this.gusSay(pick(this.rng, ['…놓쳤네.', '줄 탓은 하지 마라.', '큰 놈이었다.']), 2200);
    if (!this.haveBait()) {
      const any = BAITS.find((b) => (s.bait[b.id] ?? 0) > 0);
      if (any) this.selectBait(any.id);
      else this.toggleFishing();
    }
  }

  private async landed(f: Swimmer) {
    const s = G.state;
    this.reeling = false;
    this.life.remove(f);
    if (this.baitType !== 'lure') s.bait[this.baitType] = Math.max(0, (s.bait[this.baitType] ?? 0) - 1);
    const flags = logFish(s, f.def.id, f.inches);
    const choice = await showFishCard(this, f.def, f.inches, flags);
    if (choice === 'keep') {
      if (f.def.rarity === 'legendary') {
        s.items[`legend_${f.def.id}`] = (s.items[`legend_${f.def.id}`] ?? 0) + 1;
      } else {
        addFishToHold(s, f.def.id, f.inches);
      }
    } else if (choice === 'bait') {
      s.bait.pinfish = (s.bait.pinfish ?? 0) + 1;
    } else if (choice === 'photo') {
      s.flags[`photo_${f.def.id}`] = s.day;
    }
    this.buildBaitPanel();
    await this.reactToCatch(f.def);
    if (!this.haveBait()) {
      const any = BAITS.find((b) => (s.bait[b.id] ?? 0) > 0);
      if (any) this.selectBait(any.id);
      else if (this.fishing) this.toggleFishing();
    }
  }

  private async reactToCatch(def: FishDef) {
    const s = G.state;
    if (def.id === 'oldred') {
      if (!this.alone) {
        // [변경 1] Gus hugs Eli for the first time
        await this.dlg.show('narrate', '거스가 한참 동안 고기를 내려다봤다. 말없이.');
        await this.dlg.show('say', '…', 'gus');
        await this.dlg.show('say', '…올드 레드다. 삼십 년이다. 삼십 년.', 'gus');
        if (this.gusSprite) {
          this.tweens.add({ targets: this.gusSprite, x: -90, duration: 600 });
          const h = this.add.image(this.boat.x - 100, this.boat.y - 150, 'fx_heart').setDepth(30);
          this.tweens.add({ targets: h, y: h.y - 50, alpha: 0, duration: 1800, onComplete: () => h.destroy() });
        }
        await this.dlg.show('narrate', '거스가 일라이를 안았다. 생선 비린내와 담배 냄새. 짧게, 아주 세게.');
        await this.dlg.show('say', '…니 애비가 봤어야 했는데.', 'gus');
        this.dlg.hide();
        s.flags.oldRedHug = true;
        if (s.feelings.gus < 100) s.feelings.gus = Math.min(100, s.feelings.gus + 15);
      } else {
        await this.dlg.show('think', '영감, 잡았어.');
        this.dlg.hide();
      }
      return;
    }
    if (def.rarity === 'legendary') this.gusSay('…평생 한 번 볼까 말까 한 놈이다.', 3200);
    else if (def.rarity === 'rare' || def.rarity === 'veryRare') this.gusSay(pick(this.rng, ['…제법이네.', '그놈 잡는 사람 많지 않다.', '…허.']), 2400);
    else if (def.id === 'hardhead') this.gusSay('바다메기는 미끼만 축낸다.', 2000);
  }

  // ---------------- rarity effects ----------------
  private onAppear(f: Swimmer) {
    const r = f.def.rarity;
    if (r === 'rare') {
      sfx('glint');
      const sp = this.add.particles(0, 0, 'fx_sparkle', { follow: f.img, lifespan: 600, speed: 20, scale: { start: 0.5, end: 0 }, frequency: 120, alpha: { start: 0.9, end: 0 } }).setDepth(9);
      this.time.delayedCall(2500, () => sp.destroy());
    } else if (r === 'veryRare') {
      sfx('glint');
      sfx('chime');
      const edge = this.add.graphics().setDepth(880);
      edge.lineStyle(26, 0xffd45e, 0.55).strokeRect(0, 0, 1280, 720);
      this.tweens.add({ targets: edge, alpha: { from: 0, to: 1 }, duration: 500, yoyo: true, repeat: 3, onComplete: () => edge.destroy() });
    } else if (r === 'legendary') {
      this.startLegendAmbience(f);
    }
  }

  private startLegendAmbience(f: Swimmer) {
    this.trip.legendSpawned = true;
    if (this.shore) G.state.flags[`legendShore_${G.state.day}`] = true;
    this.legendFish = f;
    music(null);
    ambientWaves(true, 0.02);
    const cx = this.bait?.x ?? this.boat.x - 200;
    const cy = this.bait?.y ?? 450;
    this.dark = this.add.image(cx, cy, 'fx_dark_hole').setScale(3.4).setDepth(600).setAlpha(0);
    this.tweens.add({ targets: this.dark, alpha: 0.96, duration: 3500 });
    this.heartbeat = this.time.addEvent({ delay: 1100, loop: true, callback: () => sfx('heartbeat') });
    sfx('heartbeat');
    // a huge shadow glides along the bottom
    this.shadow = this.add
      .image(-300, BED_Y - 60, fishTexKey(f.def.id))
      .setTint(0x05050a)
      .setAlpha(0.6)
      .setScale(7 / TEX_SCALE)
      .setDepth(5);
    this.tweens.add({ targets: this.shadow, x: 1600, duration: 14000, ease: 'Sine.InOut', onComplete: () => this.shadow?.destroy() });
    const t = txt(this, 640, 210, '무언가 거대한 것이…', { size: 20, color: '#C9B6E4' }).setOrigin(0.5).setDepth(620).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 1200, yoyo: true, hold: 2400, onComplete: () => t.destroy() });
    this.time.delayedCall(1600, () => this.gusSay('…쉿.', 2600));
    if (this.ledgerSprite) {
      this.ledgerSprite.setTexture('ch_ledger_fly');
      this.tweens.add({ targets: this.ledgerSprite, y: this.ledgerSprite.y - 10, duration: 120, yoyo: true, repeat: 6, onComplete: () => this.ledgerSprite?.setTexture('ch_ledger') });
      sfx('squawk');
    }
  }

  private endLegendAmbience(caught: boolean, ms = 300) {
    this.heartbeat?.remove();
    this.heartbeat = null;
    this.legendFish = null;
    if (this.dark) {
      const d = this.dark;
      this.dark = null;
      this.tweens.add({ targets: d, alpha: 0, duration: caught ? 250 : ms, onComplete: () => d.destroy() });
    }
    ambientWaves(true, 0.07);
  }

  /** Debug/test: force a species to appear (e.g. a legendary). */
  forceFish(id: string) {
    this.trip.legendSpawned = false;
    this.life.setLegendSpawned(false);
    return this.life.forceSpawn(id);
  }

  // ---------------- leaving ----------------
  private moveGround() {
    if (this.net !== 'up' || this.ending) return;
    this.scene.start('SeaMap', { from: this.trip.ground });
  }

  private goHomeEarly() {
    if (this.shore) {
      this.leaveShore();
      return;
    }
    if (this.ending || this.net === 'dropping' || this.net === 'hauling') return;
    G.state.time = Math.max(G.state.time, seaEndTime(G.state.day));
    this.endOfMorning(true);
  }

  /** 08:00: ship's horn, Gus: "돌아가자, 시장 닫힌다." The net comes up automatically. */
  private endOfMorning(early = false) {
    if (this.ending) return;
    this.ending = true;
    if (this.fight) this.fightLost();
    if (this.fishing) {
      this.fishing = false;
      this.bait = null;
      this.rodG.clear();
      this.bang.setVisible(false);
      this.baitPanel.setVisible(false);
    }
    if (!early) {
      sfx('horn');
      this.gusSay(this.trip.tutorial ? '오늘은 여기까지. 돌아간다.' : '돌아가자, 시장 닫힌다.', 3000);
      if (this.alone) this.eliSay('여덟 시. 돌아가자. 시장 닫힌다.', 3000);
    }
    this.refreshButtons();
    this.time.delayedCall(early ? 200 : 1400, () => {
      if (this.net === 'down' || this.net === 'stuck') {
        this.net = 'down';
        this.haul(true);
      } else if (this.net === 'up') {
        G.trip = null;
        this.cameras.main.fadeOut(500, 21, 18, 31);
        this.cameras.main.once('camerafadeoutcomplete', () => endSegment(this));
      }
    });
  }

  private wait(ms: number) {
    return new Promise<void>((r) => this.time.delayedCall(ms, () => r()));
  }

  // ---------------- frame ----------------
  update(time: number, delta: number) {
    const s = G.state;
    const dt = Math.min(0.05, delta / 1000);
    // the sea clock
    if (this.shore && !this.ending) {
      // the land clock; 17:00 at the bank and 19:00 still apply
      if (!this.dlg.visible && !this.busy && !this.fight && !this.reeling) tickClock(s, delta, 'land');
      if (!this.fight && !this.reeling && !this.busy && checkAfternoonClock(this, 'Town', { at: this.shore.town })) this.ending = true;
    } else if (!this.ending) {
      const before = s.time;
      const adv = this.dlg.visible || this.busy ? 0 : tickClock(s, delta, 'sea', seaEndTime(s.day));
      if (this.net === 'down') {
        this.towMinutes += adv;
        if (!this.snagged && adv > 0 && this.rng() < snagChancePerMinute(this.trip.ground, this.towMinutes) * adv) this.snag();
        this.winch.setLoad(this.visFill());
        this.commentary();
      }
      if (s.time >= seaEndTime(s.day) && before < seaEndTime(s.day) + 1) this.endOfMorning();
    }
    const fill = this.net === 'down' || this.net === 'hauling' ? this.visFill() : 0;

    // boat bob + tilt
    const wind = this.weather === '바람' ? 1.8 : 1;
    if (!this.shore) {
      this.boat.y = WATER_Y + 8 + Math.sin(time / 700) * 3 * wind + fill * 5;
      this.boat.angle = Math.sin(time / 900) * 1.2 * wind - fill * 3;
      this.drawNet(time, fill);
    }
    this.drawWaves(time, wind);

    // bait
    if (this.fishing && this.bait && !this.fight && !this.reeling) this.moveBait(dt);
    if (this.fishing && this.bait) this.drawRod(time);
    // living water
    const flow = this.shore ? (this.shore.id === 'riverbank' || this.shore.id === 'breakwater' ? 12 : 3) : this.net === 'down' ? 28 : 5;
    const netZone = { active: this.net === 'down' && this.netDepth > 0.9, x: NET_MOUTH.x, y: NET_MOUTH.y, r: 70 };
    this.life.update(delta, time, flow, this.fishing && !this.fight && !this.reeling ? this.bait : null, netZone, !!this.fight || this.reeling);
    if (this.fight) this.updateFight(dt);
    if (this.bang.visible && this.bait) {
      this.bang.setPosition(this.bait.x + Math.sin(time / 25) * 3, this.bait.y - 34);
      if (!this.life.biter()) this.bang.setVisible(false);
    }
    if (this.dark) {
      const tx = this.bait?.x ?? this.boat.x - 200;
      const ty = this.bait?.y ?? 450;
      this.dark.x += (tx - this.dark.x) * 0.1;
      this.dark.y += (ty - this.dark.y) * 0.1;
    }
    this.drawShrimpDots(time, flow);
  }

  private moveBait(dt: number) {
    const b = this.bait!;
    const sp = TUNING.fishing.baitSpeed;
    let vx = 0;
    let vy = 0;
    if (isHeld(...KEY.left)) vx -= sp;
    if (isHeld(...KEY.right)) vx += sp;
    if (isHeld(...KEY.up)) vy -= sp;
    if (isHeld(...KEY.down)) vy += sp;
    if (vx === 0 && vy === 0 && this.ptr) {
      // follow the mouse
      const dx = this.ptr.x - b.x;
      const dy = this.ptr.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d > 6) {
        const v = Math.min(sp, d * 4);
        vx = (dx / d) * v;
        vy = (dy / d) * v;
      }
    }
    if (vx === 0 && vy === 0 && !this.ptr) vy = TUNING.fishing.sinkSpeed;
    const maxY = Math.min(BED_Y - 20, WATER_Y + TUNING.fishing.lineLength + (owns(G.state, 'longLine') ? TUNING.fishing.longLineExtra : 0));
    const nx = Phaser.Math.Clamp(b.x + vx * dt, 60, 1220);
    const ny = Phaser.Math.Clamp(b.y + vy * dt, WATER_Y + 15, maxY);
    const moved = Math.hypot(nx - b.x, ny - b.y) / Math.max(0.001, dt);
    b.speed = b.speed * 0.85 + moved * 0.15;
    b.stillFor = moved < 50 ? b.stillFor + dt * 1000 : 0;
    b.x = nx;
    b.y = ny;
  }

  private drawRod(time: number) {
    const b = this.bait!;
    const g = this.rodG;
    g.clear();
    const tipX = this.boat.x - 150;
    const tipY = this.boat.y - 150;
    g.lineStyle(4, SHADE.woodDark, 1).lineBetween(this.boat.x - 100, this.boat.y - 80, tipX, tipY);
    const tension = this.fight ? this.fight.tension : 0;
    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xffffff),
      Phaser.Display.Color.ValueToColor(0xd7263d),
      100,
      Math.floor(tension * 100),
    );
    const lc = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
    const vib = this.fight ? tension * 4 : 0;
    g.lineStyle(2, lc, 0.95);
    g.beginPath();
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const x = Phaser.Math.Linear(tipX, b.x, u);
      const y = Phaser.Math.Linear(tipY, b.y, u) + Math.sin(u * Math.PI) * (this.fight ? 0 : 18) + Math.sin(time / 20 + u * 15) * vib;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
    // the bait itself
    const bd = this.baitType;
    if (bd === 'lure') g.fillStyle(0xffd45e, 1).fillEllipse(b.x, b.y, 16, 8).lineStyle(2, PALETTE.ink).strokeEllipse(b.x, b.y, 16, 8);
    else if (bd === 'pinfish') g.fillStyle(0xb9c8d8, 1).fillEllipse(b.x, b.y, 18, 9).lineStyle(2, PALETTE.ink).strokeEllipse(b.x, b.y, 18, 9);
    else if (bd === 'crab') g.fillStyle(0xff7a5c, 1).fillCircle(b.x, b.y, 7).lineStyle(2, PALETTE.ink).strokeCircle(b.x, b.y, 7);
    else g.fillStyle(SHADE.shrimp, 1).fillEllipse(b.x, b.y, 14, 8).lineStyle(2, PALETTE.ink).strokeEllipse(b.x, b.y, 14, 8);
    g.lineStyle(2, PALETTE.ink, 0.8).lineBetween(b.x, b.y - 4, b.x, b.y - 12);
    // attraction ring (subtle)
    if (!this.fight) g.lineStyle(1, 0xffffff, 0.12).strokeCircle(b.x, b.y, baitDef(bd).range);
  }

  private drawWaves(time: number, wind: number) {
    const wv = this.waves;
    wv.clear();
    wv.fillStyle(PALETTE.sea, 0.85);
    wv.beginPath();
    wv.moveTo(0, WATER_Y + 26);
    for (let x = 0; x <= 1280; x += 20) wv.lineTo(x, WATER_Y + 4 + Math.sin(x / 60 + time / 500) * 4 * wind + Math.sin(x / 23 + time / 300) * 1.5);
    wv.lineTo(1280, WATER_Y + 26);
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
    if (this.net === 'down') {
      for (let i = 0; i < 5; i++) {
        const wx = this.boat.x - 260 - i * 60 - ((time / 6) % 60);
        wv.lineStyle(2, 0xffffff, 0.5 - i * 0.08).lineBetween(wx, WATER_Y + 8, wx + 30, WATER_Y + 8);
      }
    }
  }

  private drawNet(time: number, fill: number) {
    const sternX = this.boat.x - 215;
    const sternY = this.boat.y - 120;
    const restX = sternX + 10;
    const restY = this.boat.y - 30;
    const nx = Phaser.Math.Linear(restX, NET_MOUTH.x + Math.sin(time / 1100) * 8, this.netDepth);
    const ny = Phaser.Math.Linear(restY, NET_MOUTH.y + Math.sin(time / 800) * 6, this.netDepth);
    const lg = this.lineG;
    lg.clear();
    const ng = this.netG;
    ng.clear();
    if (this.netDepth <= 0.02) return;
    const vib = this.net === 'down' ? fill * 3 + Math.max(0, this.towMinutes - TUNING.trawl.snagGraceMinutes) * 0.03 : 1;
    lg.lineStyle(3, PALETTE.ink, 0.9);
    lg.beginPath();
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const x = Phaser.Math.Linear(sternX, nx + 40, u);
      const y = Phaser.Math.Linear(sternY, ny - 30, u) + Math.sin(u * Math.PI) * 30 * (1 - fill * 0.6);
      const off = Math.sin(time / 25 + u * 20) * vib * Math.sin(u * Math.PI);
      if (i === 0) lg.moveTo(x, y + off);
      else lg.lineTo(x, y + off);
    }
    lg.strokePath();
    const len = 70 + fill * 120;
    const bulge = 26 + fill * 46;
    const mx = nx + 40;
    const my = ny - 30;
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
    const n = Math.floor(fill * 40);
    for (let i = 0; i < n; i++) {
      const u = ((i * 37) % 100) / 100;
      const v = ((i * 61) % 100) / 100 - 0.5;
      ng.fillStyle(i % 3 === 0 ? SHADE.shrimpDeep : SHADE.shrimp, 0.95);
      ng.fillEllipse(mx - len * (0.35 + u * 0.6), my + v * bulge * 0.9 + 6, 9, 6);
    }
    for (let i = 0; i < this.netFish.length; i++) {
      ng.fillStyle(0xb9c8d8, 0.9).fillEllipse(mx - len * (0.4 + ((i * 29) % 50) / 100), my + ((i * 17) % 30) - 10, 16, 8);
    }
    if (this.snagged) ng.fillStyle(PALETTE.seaDeep, 1).fillEllipse(mx - len * 0.6, my + 10, 26, 18);
    ng.lineStyle(5, SHADE.woodDark, 1).lineBetween(mx, my - 32, mx + 4, my + 36);
  }

  /** little pink shrimp swarms near the bottom (sucked toward the net mouth while towing) */
  private drawShrimpDots(time: number, flow: number) {
    const g = this.dotsG;
    g.clear();
    const towing = this.net === 'down';
    for (let k = 0; k < 4; k++) {
      const cx = ((k * 330 + 1400 - ((time / 1000) * flow * 1.2 + k * 90)) % 1500) - 100;
      const cy = 560 + (k % 2) * 50;
      for (let i = 0; i < 14; i++) {
        let x = cx + Math.sin(time / 600 + i) * 30 + (i % 5) * 9;
        let y = cy + Math.cos(time / 700 + i * 1.3) * 18 + (i % 3) * 6;
        if (towing && Math.abs(x - NET_MOUTH.x) < 140) {
          const t = 1 - Math.abs(x - NET_MOUTH.x) / 140;
          x = Phaser.Math.Linear(x, NET_MOUTH.x, t * 0.5);
          y = Phaser.Math.Linear(y, NET_MOUTH.y, t * 0.5);
        }
        g.fillStyle(SHADE.shrimp, 0.75).fillEllipse(x, y, 5, 3);
      }
    }
  }

  private commentary() {
    const s = G.state;
    const fill = this.visFill();
    const say = (key: string, lines: readonly string[], ms?: number) => {
      if (this.said.has(key)) return;
      this.said.add(key);
      this.gusSay(pick(this.rng, lines), ms);
    };
    const m = this.towMinutes;
    if (this.trip.tutorial) {
      if (m > 8 && !this.said.has('tut2')) {
        this.said.add('tut2');
        this.gusSay(GUS_TOW.tutorial[2], 4200);
      }
      if (m > 20 && !this.said.has('tut3')) {
        this.said.add('tut3');
        this.gusSay(GUS_TOW.tutorial[3], 4200);
      }
      if (m > 32 && !this.said.has('tut4')) {
        this.said.add('tut4');
        this.gusSay('그물 끄는 동안 심심하면 낚싯대 들어. F.', 4200);
      }
    }
    if (m > 12 && fill < 0.3) say('light', GUS_TOW.light);
    if (fill > 0.55) say('heavier', GUS_TOW.heavier);
    if (m > TUNING.trawl.goodTowMin) say('good', GUS_TOW.good);
    if (m > TUNING.trawl.goodTowMax + 5) say('greedy', GUS_TOW.greedy, 3200);
    const left = seaEndTime(s.day) - s.time;
    if (left < 20 && left > 0 && !this.said.has('late')) {
      this.said.add('late');
      this.gusSay(`${fmtTime(seaEndTime(s.day))}엔 돌아가야 한다. 슬슬 올려.`, 3000);
    }
    if (this.alone && m > 30 && !this.said.has('eliAlone')) {
      this.said.add('eliAlone');
      this.eliSay('…무거워지네. 영감 말투가 옮았다.', 3000);
    }
  }
}

