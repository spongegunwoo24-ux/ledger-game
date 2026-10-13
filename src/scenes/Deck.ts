import Phaser from 'phaser';
import { PALETTE, SHADE, FONT_TITLE } from '../art/palette';
import { addSprite } from '../art/manifest';
import { TEX_SCALE } from '../art/pen';
import { ambientWaves, sfx } from '../audio/sfx';
import { TUNING } from '../config/tuning';
import { G } from '../core/game';
import { hash32, makeRng, pick, range, type Rng } from '../core/rng';
import { owns } from '../core/state';
import type { GroundId } from '../core/types';
import { initView } from '../core/view';
import { fmtTime, seaEndTime } from '../core/clock';
import { curiosityDef, SHRIMP_TINT, SIZE_LABEL, STORY_CATCH, type CatchItem, type ShrimpSpecies } from '../data/catch';
import { fishTexKey } from '../art/fish';
import { fishDef, fishPrice } from '../data/fish';
import { GUS_DECK_LINES, GUS_REJECT_HINTS, GUS_TUTORIAL_DECK, GUS_WRONG_BASKET } from '../data/dialogue/gusDeck';
import { CHAR_NAMES } from '../data/names';
import { addTallyToHold } from '../systems/economy';
import { correctBin, emptyTally, isComboHit, placeItem, recordOutcome, soldAs, type BinId, type SortTally } from '../systems/sorting';
import { Bubble } from '../ui/Bubble';
import { Button, panel } from '../ui/Button';
import { Toasts } from '../ui/Dialogue';
import { Hud } from '../ui/Hud';
import { txt } from '../ui/text';
import { endSegment } from './director';

export interface DeckData {
  items: CatchItem[];
  ground: GroundId;
  towIndex: number;
  tutorial?: boolean;
  /** last haul of the morning (08:00) */
  final?: boolean;
  towSeconds?: number;
}

interface BinDef {
  id: BinId;
  x: number;
  y: number;
  r: number;
  key?: string;
  label: string;
}

const BINS: BinDef[] = [
  { id: 'small', x: 130, y: 632, r: 62, key: 'bin_basket_small', label: '소' },
  { id: 'medium', x: 268, y: 632, r: 62, key: 'bin_basket_medium', label: '중' },
  { id: 'large', x: 406, y: 632, r: 62, key: 'bin_basket_large', label: '대' },
  { id: 'crab', x: 540, y: 632, r: 56, key: 'bin_bucket', label: '게' },
  { id: 'fish', x: 668, y: 632, r: 56, key: 'bin_icebox', label: '생선' },
  { id: 'keep', x: 800, y: 636, r: 56, key: 'bin_crate', label: '챙김' },
  { id: 'trash', x: 940, y: 628, r: 56, key: 'bin_barrel', label: '쓰레기' },
];

const LEDGER_PERCH = { x: 780, y: 152 };
const RAIL_Y = 150;
const PILE = { x: 600, y: 380, rx: 330, ry: 140 };
const GUS_POS = { x: 1170, y: 470 };

interface DeckItem {
  item: CatchItem;
  img: Phaser.GameObjects.Image;
  home: { x: number; y: number };
  held: boolean;
  claimed: boolean;
  done: boolean;
}

/** Deck sorting — the signature minigame. */
function fishPriceOf(f: { id: string; inches: number }): number {
  const d = fishDef(f.id);
  return d ? fishPrice(d, f.inches) : 0;
}

export class DeckScene extends Phaser.Scene {
  private d!: DeckData;
  private rng!: Rng;
  private items: DeckItem[] = [];
  private tally: SortTally = emptyTally();
  private bubble!: Bubble;
  private eliBubble!: Bubble;
  private toasts!: Toasts;
  private ledger!: Phaser.GameObjects.Image;
  private ledgerBusy = false;
  private lastFed = 0;
  private lastSteal = 0;
  private gusDone = 0;
  private gusCap = 0;
  private gusAboard = true;
  private lastGusLine = 0;
  private lastHint = 0;
  private binFill: Record<string, number> = {};
  private binImgs: Record<string, Phaser.GameObjects.Image> = {};
  private finished = false;
  private hud!: Hud;
  private startTime = 0;
  private tutorialLines: string[] = [];
  private ledgerPresent = true;
  private combo = 0;
  private comboText!: Phaser.GameObjects.Text;

  constructor() {
    super('Deck');
  }

  init(d: DeckData) {
    this.d = d;
    this.items = [];
    this.tally = emptyTally();
    this.ledgerBusy = false;
    this.lastFed = 0;
    this.lastSteal = 0;
    this.gusDone = 0;
    this.binFill = {};
    this.binImgs = {};
    this.finished = false;
    this.combo = 0;
    this.tutorialLines = d.tutorial ? [...GUS_TUTORIAL_DECK] : [];
  }

  create() {
    initView(this);
    const s = G.state;
    this.rng = makeRng(hash32(s.seed, 'deck', s.day, this.d.towIndex));
    this.gusAboard = s.day <= 44 && !s.flags.gusGone;
    this.cameras.main.fadeIn(400, 255, 250, 240);
    ambientWaves(true, 0.05);
    this.drawDeck();
    this.hud = new Hud(this, { notebook: false });
    this.bubble = new Bubble(this, 760);
    this.eliBubble = new Bubble(this, 761);
    this.toasts = new Toasts(this);
    this.comboText = txt(this, 540, 555, '', { size: 24, fontFamily: FONT_TITLE, color: '#3B3355', stroke: '#FFFAF0', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(700);
    this.startTime = this.time.now;
    this.lastFed = this.time.now;
    this.lastSteal = this.time.now;

    // spill the haul
    this.spill();

    // sorting table (shop): auto-sorts ~30% at the start
    if (owns(s, 'sortingTable')) {
      this.time.delayedCall(1600, () => {
        const n = Math.round(this.items.length * TUNING.sorting.sortingTableShare);
        const cands = this.items.filter((x) => !x.done && ['shrimp', 'crab', 'trash'].includes(x.item.kind)).slice(0, n);
        cands.forEach((it, i) => this.time.delayedCall(i * 60, () => this.autoSort(it, 'table')));
      });
    }

    this.gusCap = Math.round(this.items.length * TUNING.sorting.gusShare);
    if (this.gusAboard) {
      this.time.addEvent({ delay: TUNING.sorting.gusPickIntervalMs, loop: true, callback: () => this.gusPick(), startAt: -1200 });
    }
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.ledgerTick() });

    // first landing of Ledger (Day 1)
    if (!s.flags.ledgerAboard) {
      this.ledgerPresent = false;
      this.ledger.setVisible(false);
      this.time.delayedCall(2600, () => this.ledgerArrives());
    }
    if (this.tutorialLines.length) this.time.delayedCall(900, () => this.nextTutorial());

    this.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => this.onDragStart(obj));
    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, x: number, y: number) => {
      obj.setPosition(x, y);
    });
    this.input.on('dragend', (p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => this.onDrop(obj, p.worldX, p.worldY));
  }

  // ---------------- drawing ----------------
  private drawDeck() {
    const s = G.state;
    const g = this.add.graphics().setDepth(0);
    // sea beyond the rail
    g.fillGradientStyle(PALETTE.sea, PALETTE.sea, PALETTE.seaDeep, PALETTE.seaDeep, 1).fillRect(0, 0, 1280, RAIL_Y);
    for (let i = 0; i < 20; i++) g.lineStyle(2, 0xffffff, 0.5).lineBetween((i * 131) % 1280, 30 + (i % 4) * 26, ((i * 131) % 1280) + 26, 30 + (i % 4) * 26);
    // planks
    g.fillStyle(SHADE.wood, 1).fillRect(0, RAIL_Y, 1280, 720 - RAIL_Y);
    for (let y = RAIL_Y + 40; y < 720; y += 48) g.lineStyle(2, SHADE.woodDark, 0.5).lineBetween(0, y, 1280, y);
    for (let i = 0; i < 40; i++) {
      const y = RAIL_Y + 40 + Math.floor(i / 5) * 48;
      const x = ((i * 277) % 1200) + 40;
      g.lineStyle(2, SHADE.woodDark, 0.5).lineBetween(x, y - 48, x, y);
    }
    // worn shiny spots: Walt's and Gus's 30-year places, and Eli's growing one (D07)
    g.fillStyle(0xf2d2a6, 0.55).fillEllipse(930, 520, 120, 54);
    g.fillStyle(0xf2d2a6, 0.55).fillEllipse(GUS_POS.x - 10, GUS_POS.y + 6, 120, 50);
    g.fillStyle(SHADE.woodDark, Math.min(0.45, 0.025 * s.deckWear)).fillEllipse(640, 560, 110, 46);
    // rail
    g.fillStyle(SHADE.woodLight, 1).fillRect(0, RAIL_Y - 14, 1280, 18);
    g.lineStyle(3, PALETTE.ink, 1).strokeRect(-4, RAIL_Y - 14, 1288, 18);
    for (let x = 30; x < 1280; x += 90) g.fillStyle(SHADE.woodDark, 1).fillRect(x, RAIL_Y - 50, 10, 40);
    g.fillStyle(SHADE.woodLight, 1).fillRect(0, RAIL_Y - 56, 1280, 10);
    g.lineStyle(3, PALETTE.ink, 1).strokeRect(-4, RAIL_Y - 56, 1288, 10);
    txt(this, 1180, RAIL_Y - 86, '↑ 바다 (거북·잡어)', { size: 16, color: '#FFFAF0' }).setOrigin(0.5).setDepth(1);

    // bins
    for (const b of BINS) {
      const img = addSprite(this, b.x, b.y, b.key!, 1.25).setDepth(2);
      this.binImgs[b.id] = img;
      const lg = this.add.graphics().setDepth(3);
      lg.fillStyle(PALETTE.ink, 1).fillRoundedRect(b.x - 30, b.y + 34, 60, 28, 10);
      txt(this, b.x, b.y + 48, b.label, { size: 18, color: '#FFFAF0' }).setOrigin(0.5).setDepth(4);
    }

    // Gus + coffee can
    if (this.gusAboard) {
      addSprite(this, GUS_POS.x, GUS_POS.y, 'ch_gus', 1.25).setOrigin(0.5, 0.9).setDepth(5);
    }
    if (this.gusAboard || s.flags.keptGusCan) {
      const can = this.add.graphics().setDepth(4);
      can.fillStyle(0xb9b4c7, 1).fillRoundedRect(GUS_POS.x - 110, GUS_POS.y - 10, 30, 36, 6).lineStyle(2.4, PALETTE.ink, 1).strokeRoundedRect(GUS_POS.x - 110, GUS_POS.y - 10, 30, 36, 6);
    }

    // Ledger on the rail
    this.ledger = addSprite(this, LEDGER_PERCH.x, LEDGER_PERCH.y, 'ch_ledger', 1.1).setOrigin(0.5, 0.92).setDepth(6);
    this.tweens.add({ targets: this.ledger, angle: { from: -2, to: 2 }, duration: 1200, yoyo: true, repeat: -1 });
    const lz = this.add.graphics().setDepth(1);
    lz.lineStyle(2, 0xffffff, 0.5).strokeCircle(LEDGER_PERCH.x, LEDGER_PERCH.y - 40, 70);
  }

  private spill() {
    const its = this.d.items;
    its.forEach((item, i) => {
      const a = this.rng() * Math.PI * 2;
      const r = Math.sqrt(this.rng());
      const hx = PILE.x + Math.cos(a) * PILE.rx * r;
      const hy = PILE.y + Math.sin(a) * PILE.ry * r;
      const key = this.texFor(item);
      const scale =
        item.kind === 'fish' ? Math.min(1.3, (34 + (item.inches ?? 8) * 1.5) / 100) : item.kind === 'turtle' ? 1.1 : item.kind === 'curio' || item.kind === 'story' ? 1.3 : 1.15;
      const img = this.add
        .image(hx + range(this.rng, -40, 40), -40 - range(this.rng, 0, 200), key)
        .setScale(scale / TEX_SCALE)
        .setAngle(range(this.rng, -180, 180))
        .setDepth(20 + Math.floor(hy / 10));
      img.setData('baseScale', scale / TEX_SCALE);
      if (item.kind === 'shrimp' && !item.golden && item.id) img.setTint(SHRIMP_TINT[item.id as ShrimpSpecies] ?? 0xffffff);
      if (item.kind === 'shrimp' && item.id && !G.state.shrimpSeen.includes(item.id)) G.state.shrimpSeen.push(item.id);
      img.setData('idx', i);
      const di: DeckItem = { item, img, home: { x: hx, y: hy }, held: false, claimed: false, done: false };
      this.items.push(di);
      this.tweens.add({
        targets: img,
        x: hx,
        y: hy,
        angle: range(this.rng, -40, 40),
        duration: 500 + range(this.rng, 0, 400),
        delay: i * 12,
        ease: 'Bounce.Out',
        onComplete: () => {
          if (i % 6 === 0) sfx('plop');
          img.setInteractive({ draggable: true, useHandCursor: true });
          // jiggle (shrimp flop)
          if (item.kind === 'shrimp' || item.kind === 'fish' || item.kind === 'crab') {
            this.tweens.add({
              targets: img,
              angle: img.angle + range(this.rng, -14, 14),
              duration: 300 + range(this.rng, 0, 500),
              yoyo: true,
              repeat: -1,
              repeatDelay: range(this.rng, 600, 3000),
              ease: 'Sine.InOut',
            });
          }
        },
      });
    });
    sfx('splash');
  }

  private texFor(item: CatchItem): string {
    switch (item.kind) {
      case 'shrimp':
        return item.golden ? 'it_goldshrimp' : `it_shrimp_${item.size}`;
      case 'crab':
        return 'it_crab';
      case 'fish':
        return fishTexKey(item.id ?? 'pinfish');
      case 'trash':
        return `it_trash_${item.id}`;
      case 'turtle':
        return 'it_turtle';
      case 'curio':
      case 'story':
        return `it_${item.id}`;
    }
  }

  // ---------------- input ----------------
  private find(obj: Phaser.GameObjects.Image): DeckItem | undefined {
    return this.items.find((x) => x.img === obj);
  }

  private onDragStart(obj: Phaser.GameObjects.Image) {
    const it = this.find(obj);
    if (!it || it.done) return;
    it.held = true;
    this.tweens.killTweensOf(obj);
    obj.setDepth(500);
    obj.setScale((obj.getData('baseScale') as number) * 1.18);
    obj.setAngle(0);
    sfx('pop');
  }

  private binAt(x: number, y: number): BinId | null {
    if (Phaser.Math.Distance.Between(x, y, LEDGER_PERCH.x, LEDGER_PERCH.y - 40) < 90 && this.ledgerPresent && !this.ledgerBusy) return 'ledger';
    if (y < RAIL_Y + 6) return 'sea';
    let best: BinDef | null = null;
    let bd = Infinity;
    for (const b of BINS) {
      const dd = Phaser.Math.Distance.Between(x, y, b.x, b.y);
      if (dd < b.r + 22 && dd < bd) {
        bd = dd;
        best = b;
      }
    }
    return best ? best.id : null;
  }

  private onDrop(obj: Phaser.GameObjects.Image, x: number, y: number) {
    const it = this.find(obj);
    if (!it || it.done) return;
    it.held = false;
    obj.setScale(obj.getData('baseScale') as number);
    const bin = this.binAt(x, y);
    if (!bin) {
      // just moved on the deck
      it.home = { x: Phaser.Math.Clamp(x, 40, 1240), y: Phaser.Math.Clamp(y, RAIL_Y + 30, 560) };
      obj.setPosition(it.home.x, it.home.y);
      obj.setDepth(20 + Math.floor(it.home.y / 10));
      return;
    }
    this.resolve(it, bin, 'eli');
  }

  // ---------------- outcomes ----------------
  private resolve(it: DeckItem, bin: BinId, by: 'eli' | 'gus' | 'table') {
    const outcome = placeItem(it.item, bin);
    const img = it.img;
    if (outcome === 'reject') {
      sfx('reject');
      this.tweens.add({ targets: img, x: it.home.x, y: it.home.y, duration: 260, ease: 'Back.Out' });
      img.setDepth(20 + Math.floor(it.home.y / 10));
      if (by === 'eli') this.hint(GUS_REJECT_HINTS[it.item.kind] ?? '…');
      return;
    }
    it.done = true;
    img.disableInteractive();
    this.tweens.killTweensOf(img);
    const s = G.state;
    if (outcome === 'fishKept' && it.item.id === 'pinfish') {
      // pinfish on ice become live bait
      s.bait.pinfish = (s.bait.pinfish ?? 0) + 1;
      if (by === 'eli') this.toasts.show('살아있는 미끼 +1', PALETTE.mint);
    } else recordOutcome(this.tally, it.item, bin, outcome);
    if (outcome === 'fed') s.ledgerFed += 1;
    if (by === 'eli') this.comboStep(it.item, bin, outcome);

    switch (outcome) {
      case 'basket':
      case 'basketLow':
      case 'crab':
      case 'fishKept':
      case 'kept':
      case 'trashed':
      case 'lost':
      case 'storyTrashed':
      case 'turtleBinned': {
        if (bin === 'sea') {
          this.overRail(img, outcome === 'lost' ? 'lost' : 'release');
          break;
        }
        const b = BINS.find((x) => x.id === bin)!;
        this.tweens.add({
          targets: img,
          x: b.x + range(this.rng, -18, 18),
          y: b.y - 8,
          scale: (img.getData('baseScale') as number) * 0.6,
          duration: 180,
          ease: 'Quad.In',
          onComplete: () => {
            this.binFill[bin] = (this.binFill[bin] ?? 0) + 1;
            const bi = this.binImgs[bin];
            this.tweens.add({ targets: bi, scaleY: bi.scaleY * 0.92, yoyo: true, duration: 80 });
            if (bin === 'trash') {
              sfx('thud');
              img.destroy();
            } else {
              sfx(bin === 'crab' ? 'clink' : bin === 'keep' ? 'thud' : 'plop');
              // pile up visibly inside the basket
              const n = this.binFill[bin];
              if (n <= 14) {
                img.setPosition(b.x + ((n * 13) % 50) - 25, b.y - 14 - Math.min(18, n * 1.4));
                img.setDepth(3 + n * 0.01);
                img.setAngle(range(this.rng, -50, 50));
              } else img.destroy();
            }
            const p = this.add.image(b.x, b.y - 20, 'fx_splash').setScale(0.4).setDepth(30);
            this.tweens.add({ targets: p, scale: 0.9, alpha: 0, duration: 300, onComplete: () => p.destroy() });
          },
        });
        if (outcome === 'basketLow' && by === 'eli' && this.rng() < 0.45) this.hint(pick(this.rng, GUS_WRONG_BASKET));
        if (outcome === 'turtleBinned') {
          s.flags.turtleBinned = true;
          this.hint('…거북을 버렸어? 단속관한테 걸리면 벌금이다.');
        }
        if (outcome === 'storyTrashed' && it.item.id) {
          s.flags[`story_${it.item.id}`] = 'trashed';
          if (this.gusAboard) {
            const sc = STORY_CATCH.find((x) => x.id === it.item.id);
            this.time.delayedCall(600, () => this.hint(sc?.rescueLine ?? '…'));
          }
        }
        if (outcome === 'kept' && it.item.id) {
          if (it.item.kind === 'story') {
            s.flags[`story_${it.item.id}`] = 'kept';
            this.toasts.show(`챙겼다: ${STORY_CATCH.find((x) => x.id === it.item.id)?.name ?? ''}`, PALETTE.lilac);
          } else {
            const def = curiosityDef(it.item.id);
            this.toasts.show(`챙겼다: ${def?.name ?? ''}`, PALETTE.lilac);
          }
        }
        break;
      }
      case 'released':
      case 'turtleSaved':
        this.overRail(img, outcome === 'turtleSaved' ? 'turtle' : 'release');
        break;
      case 'fed':
        this.feedLedger(img);
        break;
    }
    if (by === 'gus') this.gusDone++;
    this.checkDone();
  }

  private overRail(img: Phaser.GameObjects.Image, kind: 'turtle' | 'release' | 'lost') {
    sfx('whoosh');
    const tx = img.x + range(this.rng, -60, 60);
    this.tweens.add({
      targets: img,
      x: tx,
      y: 40,
      duration: 380,
      ease: 'Quad.Out',
      onComplete: () => {
        sfx('splash');
        for (let i = 0; i < 6; i++) {
          const p = this.add.image(tx, 60, 'fx_splash').setScale(0.3).setDepth(30);
          this.tweens.add({ targets: p, x: tx + range(this.rng, -40, 40), y: 20, alpha: 0, duration: 400, onComplete: () => p.destroy() });
        }
        if (kind === 'turtle') {
          const h = this.add.image(tx, 50, 'fx_heart').setScale(0.8).setDepth(30);
          this.tweens.add({ targets: h, y: 0, alpha: 0, duration: 1000, onComplete: () => h.destroy() });
        }
        img.destroy();
      },
    });
  }

  private feedLedger(img: Phaser.GameObjects.Image) {
    this.lastFed = this.time.now;
    this.ledgerBusy = true;
    // the fish arcs through the air and Ledger catches it mid-air
    const start = { x: img.x, y: img.y };
    const end = { x: LEDGER_PERCH.x - 30, y: LEDGER_PERCH.y - 70 };
    const ctrl = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 160 };
    const tw = { t: 0 };
    this.tweens.add({
      targets: tw,
      t: 1,
      duration: 420,
      onUpdate: () => {
        const t = tw.t;
        img.x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * ctrl.x + t * t * end.x;
        img.y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * ctrl.y + t * t * end.y;
        img.angle += 18;
      },
      onComplete: () => {
        img.destroy();
        sfx('gulp');
        this.ledger.setTexture('ch_ledger_gulp');
        this.tweens.add({ targets: this.ledger, y: LEDGER_PERCH.y - 16, duration: 120, yoyo: true });
        this.time.delayedCall(500, () => {
          this.ledger.setTexture('ch_ledger');
          this.ledgerBusy = false;
          if (this.rng() < 0.4) sfx('squawk');
        });
      },
    });
  }

  private hint(text: string) {
    if (this.time.now - this.lastHint < 2500) return;
    this.lastHint = this.time.now;
    if (this.gusAboard) this.bubble.say(GUS_POS.x - 20, GUS_POS.y - 160, `${CHAR_NAMES.gus}: ${text}`, 2600, true);
  }

  // ---------------- Gus ----------------
  private gusPick() {
    if (this.finished || this.gusDone >= this.gusCap) return;
    const elapsed = this.time.now - this.startTime;
    if (elapsed < 1800) return;
    const cands = this.items.filter(
      (x) => !x.done && !x.held && !x.claimed && ['shrimp', 'crab', 'fish', 'trash'].includes(x.item.kind),
    );
    if (!cands.length) return;
    // Gus works from his side of the pile
    cands.sort((a, b) => b.img.x - a.img.x);
    const it = cands[Math.floor(this.rng() * Math.min(4, cands.length))];
    this.autoSort(it, 'gus');
    // chatter
    if (this.time.now - this.lastGusLine > 7500 && !this.bubble.showing) {
      this.lastGusLine = this.time.now;
      if (this.tutorialLines.length) return;
      const day = G.state.day;
      const lines = GUS_DECK_LINES.filter((l) => day >= l.from && day <= l.to && (!l.flag || G.state.flags[l.flag]));
      if (lines.length) this.bubble.say(GUS_POS.x - 20, GUS_POS.y - 160, `${CHAR_NAMES.gus}: ${pick(this.rng, lines).text}`, 3200, true);
    }
  }

  private autoSort(it: DeckItem, by: 'gus' | 'table') {
    if (it.done || it.held) return;
    it.claimed = true;
    const hungry = this.time.now - this.lastFed > 5000 && this.ledgerPresent && !this.ledgerBusy;
    const bin = correctBin(it.item, hungry);
    const img = it.img;
    this.tweens.killTweensOf(img);
    img.disableInteractive();
    img.setDepth(400);
    const target =
      bin === 'ledger'
        ? { x: LEDGER_PERCH.x + 80, y: LEDGER_PERCH.y + 40 }
        : bin === 'sea'
          ? { x: img.x, y: RAIL_Y + 10 }
          : BINS.find((b) => b.id === bin)!;
    this.tweens.add({
      targets: img,
      x: (img.x + target.x) / 2,
      y: Math.min(img.y, target.y) - 60,
      duration: by === 'table' ? 220 : 320,
      ease: 'Sine.Out',
      onComplete: () => {
        if (it.held) return;
        img.setPosition(target.x, target.y);
        it.done = false;
        this.resolve(it, bin, by === 'gus' ? 'gus' : 'table');
      },
    });
  }

  private nextTutorial() {
    const line = this.tutorialLines.shift();
    if (!line) return;
    this.bubble.say(GUS_POS.x - 20, GUS_POS.y - 160, `${CHAR_NAMES.gus}: ${line}`, 3600, true);
    this.time.delayedCall(3900, () => this.nextTutorial());
  }

  // ---------------- Ledger ----------------
  private ledgerArrives() {
    const s = G.state;
    this.ledger.setVisible(true).setTexture('ch_ledger_fly');
    this.ledger.setPosition(-80, 40);
    sfx('squawk');
    this.tweens.add({
      targets: this.ledger,
      x: LEDGER_PERCH.x,
      y: LEDGER_PERCH.y,
      duration: 1400,
      ease: 'Sine.Out',
      onComplete: () => {
        this.ledger.setTexture('ch_ledger');
        this.ledgerPresent = true;
        this.lastFed = this.time.now;
        s.flags.ledgerAboard = true;
        if (this.d.tutorial || s.day === 1) {
          this.time.delayedCall(400, () => {
            this.bubble.say(GUS_POS.x - 20, GUS_POS.y - 160, `${CHAR_NAMES.gus}: …장부다. 신경 쓰지 마. 새우 훔친다.`, 3000, true);
            this.time.delayedCall(3200, () => this.eliBubble.say(640, 578, '일라이: 펠리컨 이름이 장부라고요?', 2600));
            this.time.delayedCall(6000, () => this.bubble.say(GUS_POS.x - 20, GUS_POS.y - 160, `${CHAR_NAMES.gus}: …내가 지은 거 아냐.`, 2600, true));
          });
        }
      },
    });
  }

  private ledgerTick() {
    if (this.finished || !this.ledgerPresent || this.ledgerBusy) return;
    const now = this.time.now;
    if (now - this.lastFed < TUNING.sorting.ledgerFedGraceMs) return;
    if (now - this.lastSteal < TUNING.sorting.ledgerStealIntervalMs) return;
    const cands = this.items.filter((x) => !x.done && !x.held && !x.claimed && x.item.kind === 'shrimp');
    if (!cands.length) return;
    // closest unattended shrimp to the perch
    cands.sort(
      (a, b) =>
        Phaser.Math.Distance.Between(a.img.x, a.img.y, LEDGER_PERCH.x, LEDGER_PERCH.y) -
        Phaser.Math.Distance.Between(b.img.x, b.img.y, LEDGER_PERCH.x, LEDGER_PERCH.y),
    );
    const it = cands[0];
    it.claimed = true;
    this.lastSteal = now;
    this.ledgerBusy = true;
    sfx('squawk');
    this.ledger.setTexture('ch_ledger_fly');
    this.tweens.add({
      targets: this.ledger,
      x: it.img.x,
      y: it.img.y - 20,
      duration: 520,
      ease: 'Sine.InOut',
      onComplete: () => {
        if (it.held || it.done) {
          it.claimed = false;
          this.returnLedger();
          return;
        }
        it.done = true;
        it.img.disableInteractive();
        this.tweens.killTweensOf(it.img);
        this.tally.stolen++;
        this.tweens.add({ targets: it.img, x: LEDGER_PERCH.x, y: LEDGER_PERCH.y - 30, alpha: 0, duration: 520, onComplete: () => it.img.destroy() });
        this.returnLedger(true);
        if (this.rng() < 0.5) this.hint(pick(this.rng, ['…또 훔쳤다.', '잡어 던져 주라니까.', '저놈이 너보다 빠르다.']));
        this.checkDone();
      },
    });
  }

  private returnLedger(gulp = false) {
    this.tweens.add({
      targets: this.ledger,
      x: LEDGER_PERCH.x,
      y: LEDGER_PERCH.y,
      duration: 520,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.ledger.setTexture(gulp ? 'ch_ledger_gulp' : 'ch_ledger');
        if (gulp) sfx('gulp');
        this.time.delayedCall(400, () => {
          this.ledger.setTexture('ch_ledger');
          this.ledgerBusy = false;
        });
      },
    });
  }

  /** [변경 1] sorting combo + freshness bonus (addictive device 3) */
  private comboStep(item: CatchItem, bin: BinId, outcome: ReturnType<typeof placeItem>) {
    const C = TUNING.combo;
    if (!isComboHit(outcome, item)) {
      if (this.combo >= 5) this.comboText.setText('콤보 끊김').setColor('#9a96a8');
      this.combo = 0;
      return;
    }
    this.combo += 1;
    const s = G.state;
    s.bestCombo = Math.max(s.bestCombo, this.combo);
    if (item.kind === 'shrimp' && (outcome === 'basket') && !item.golden) {
      const size = soldAs(item, bin);
      const value = TUNING.prices[size] * TUNING.trawl.lbsPerShrimpItem;
      const secs = (this.time.now - this.startTime) / 1000;
      const fresh = secs < C.fresh1Sec ? C.fresh1 : secs < C.fresh2Sec ? C.fresh2 : 0;
      const pct = Math.min(C.max, this.combo * C.perStep) + fresh;
      this.tally.bonus = Math.round((this.tally.bonus + value * pct) * 100) / 100;
    }
    if (this.combo >= 3) {
      const pct = Math.round(Math.min(C.max, this.combo * C.perStep) * 100);
      this.comboText.setText(`콤보 ${this.combo}  +${pct}%`).setColor(this.combo >= 20 ? '#D7263D' : this.combo >= 10 ? '#e07b2a' : '#3B3355');
      this.tweens.add({ targets: this.comboText, scale: { from: 1.3, to: 1 }, duration: 160 });
    }
    const lines: Record<number, string> = { 10: '…빠르네.', 20: '제법인데?', 35: '네 아버지보다 낫다.' };
    if (lines[this.combo] && this.gusAboard) {
      this.lastHint = 0;
      this.bubble.say(GUS_POS.x - 20, GUS_POS.y - 160, `${CHAR_NAMES.gus}: ${lines[this.combo]}`, 2600, true);
    }
  }

  /** Debug/test helper: sort everything left correctly. */
  autoAll() {
    for (const it of this.items) {
      if (it.done || it.held || it.claimed) continue;
      it.claimed = true;
      const bin = correctBin(it.item, false);
      this.resolve(it, bin, 'table');
    }
  }

  // ---------------- finish ----------------
  private checkDone() {
    if (this.finished) return;
    if (this.items.some((x) => !x.done)) return;
    this.finished = true;
    this.time.delayedCall(700, () => this.showResults());
  }

  private showResults() {
    const s = G.state;
    const t = this.tally;
    addTallyToHold(s, t);
    for (const id of t.kept) s.curiosities.push(id);
    if (t.storyKept.length || t.storyTrashed.length) s.flags.lastStoryCatchDay = s.day;
    const c = this.add.container(0, 0).setDepth(1000);
    const shade = this.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.35).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    panel(g, 340, 90, 600, 580, 0xfff3d6, 24);
    c.add([shade, g]);
    c.add(txt(this, 640, 128, '정리 끝', { size: 36, fontFamily: FONT_TITLE }).setOrigin(0.5));
    const lbs = (k: 'small' | 'medium' | 'large') => `${t.lbs[k].toFixed(1)} lb`;
    const rows: [string, string][] = [
      [`새우 ${SIZE_LABEL.small}`, lbs('small')],
      [`새우 ${SIZE_LABEL.medium}`, lbs('medium')],
      [`새우 ${SIZE_LABEL.large}`, lbs('large')],
      ['게', `${t.crabs}마리`],
      ['생선', `${t.fish.length}마리${t.fish.length ? ` ($${t.fish.reduce((a, f) => a + fishPriceOf(f), 0).toFixed(0)})` : ''}`],
      ['콤보·신선도 보너스', `$${t.bonus.toFixed(2)}`],
      ['장부가 훔친 새우', `${t.stolen}마리`],
      ['장부에게 던져 준 잡어', `${t.fed}마리`],
      ['바다로 돌려보낸 거북', `${t.turtlesSaved}마리`],
    ];
    if (t.golden) rows.push(['황금 새우', `${t.golden}마리!`]);
    if (t.kept.length) rows.push(['챙긴 물건', t.kept.map((k) => curiosityDef(k)?.name ?? k).join(', ')]);
    rows.forEach(([a, b], i) => {
      c.add(txt(this, 390, 168 + i * 34, a, { size: 20 }));
      c.add(txt(this, 890, 168 + i * 34, b, { size: 20, color: '#2d5fa8' }).setOrigin(1, 0));
    });
    const secs = Math.round((this.time.now - this.startTime) / 1000);
    c.add(txt(this, 640, 168 + rows.length * 34 + 4, `${secs}초 · 최고 콤보 ${s.bestCombo}`, { size: 16, color: '#9a96a8' }).setOrigin(0.5, 0));
    const final = this.d.final || s.time >= seaEndTime(s.day) - 1;
    if (final) {
      c.add(new Button(this, 640, 620, '항구로 돌아가기', () => this.leave(), { w: 260, h: 56, fill: PALETTE.mint }));
    } else {
      c.add(new Button(this, 530, 620, '다시 바다로', () => this.scene.start('Trawl', { ground: this.d.ground, tutorial: this.d.tutorial }), { w: 220, h: 56, fill: PALETTE.coral, sub: `지금 ${fmtTime(s.time)} · ${fmtTime(seaEndTime(s.day))}까지` }));
      c.add(
        new Button(this, 780, 620, '일찍 귀항', () => {
          s.time = Math.max(s.time, seaEndTime(s.day));
          this.leave();
        }, { w: 200, h: 56, fill: 0xfff3d6, sub: '시장으로' }),
      );
    }
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 250 });
    sfx('chime');
    this.hud.refresh();
  }

  private leave() {
    G.trip = null;
    this.cameras.main.fadeOut(400, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => endSegment(this));
  }
}
