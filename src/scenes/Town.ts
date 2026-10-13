import Phaser from 'phaser';
import { PALETTE, SHADE, FONT_TITLE } from '../art/palette';
import { charTexKey, portraitKey } from '../art/characters';
import { TEX_SCALE } from '../art/pen';
import { ambientWaves, music, sfx } from '../audio/sfx';
import { isPaymentDay } from '../core/calendar';
import { holdClock, releaseClock, tickClock } from '../core/clock';
import { check } from '../core/conditions';
import { G } from '../core/game';
import { owns } from '../core/state';
import { TUNING } from '../config/tuning';
import { isHeld, KEY, onKey } from '../core/keys';
import type { CharId, LocId } from '../core/types';
import { initView } from '../core/view';
import { LOCATIONS, locationDef } from '../data/locations';
import { afternoonLocation, peopleAt, TOWN_PEOPLE } from '../data/schedules';
import { FIND_WEIGHT, FINDS, findDef } from '../data/finds';
import { hash32, makeRng } from '../core/rng';
import { Toasts } from '../ui/Dialogue';
import { notebookEntries } from '../systems/notebook';
import { Button, panel } from '../ui/Button';
import { addHeadMark, headMarkFor } from '../ui/headIcon';
import { Hud } from '../ui/Hud';
import { getSettings } from '../ui/settings';
import { txt } from '../ui/text';
import { checkAfternoonClock, endSegment } from './director';
import { BAY, coastline, coastY, CREEK, doorOf, findPath, ROADS, SPOTS, spotOf, walkable, WORLD, type TownSpot } from './town/townMap';
import { SHORES, type ShoreId } from '../data/shore';

/** where Eli is in town (the door he comes out of) */
let currentLoc: LocId = 'dock';
/** or an exact spot (back from shore fishing) */
let currentPos: { x: number; y: number } | null = null;
export function setTownLoc(l: LocId) {
  currentLoc = l;
  currentPos = null;
}
export function setTownPos(p: { x: number; y: number }) {
  currentPos = { ...p };
}

const VIEW = { w: 1280, h: 720 };
const JOY = { x: 120, y: 600, r: 62 };
const MINI = { x: 14, y: 84, w: 240, h: 135 };
const ENTER_DIST = 70;

interface Walker {
  who: CharId;
  img: Phaser.GameObjects.Image;
  loc: LocId;
}

/**
 * [변경 2] Afternoon: a walkable top-down town (DESIGN §5.2). Eli walks with the arrow keys/WASD,
 * the on-screen joystick, or by tapping the ground; buildings are entered at their doors.
 * M or the minimap opens the whole-town map. The land clock runs; 19:00 ends the afternoon.
 */
export class TownScene extends Phaser.Scene {
  private leaving = false;
  private world!: Phaser.GameObjects.Container;
  private objs!: Phaser.GameObjects.Container;
  private eli!: Phaser.GameObjects.Image;
  private eliShadow!: Phaser.GameObjects.Ellipse;
  private pos = { x: 0, y: 0 };
  private scroll = { x: 0, y: 0 };
  private target: { x: number; y: number; enter?: LocId; fish?: ShoreId } | null = null;
  private path: { x: number; y: number }[] = [];
  private joy = { active: false, id: -1, dx: 0, dy: 0 };
  private joyKnob!: Phaser.GameObjects.Arc;
  private walkers: Walker[] = [];
  private prompt!: Button;
  private promptLoc: LocId | null = null;
  private promptShore: ShoreId | null = null;
  private promptKey = '';
  private arrows!: Phaser.GameObjects.Graphics;
  private arrowLabels: Phaser.GameObjects.Text[] = [];
  private mini!: Phaser.GameObjects.Graphics;
  private miniEli!: Phaser.GameObjects.Arc;
  private mapOpen = false;
  private stepT = 0;
  private targets: LocId[] = [];
  private finds: { key: string; id: string; x: number; y: number; obj: Phaser.GameObjects.Container }[] = [];
  private gulls: Phaser.GameObjects.Image[] = [];
  private toasts!: Toasts;

  constructor() {
    super('Town');
  }

  init(d?: { at?: { x: number; y: number } }) {
    if (d?.at) currentPos = { ...d.at };
  }

  create() {
    initView(this);
    this.leaving = false;
    this.mapOpen = false;
    this.target = null;
    this.walkers = [];
    this.arrowLabels = [];
    this.finds = [];
    this.gulls = [];
    this.joy = { active: false, id: -1, dx: 0, dy: 0 };
    this.promptKey = '';
    this.promptLoc = null;
    this.promptShore = null;
    const s = G.state;
    this.cameras.main.fadeIn(300, 21, 18, 31);
    ambientWaves(true, 0.02);
    music('town');
    if (s.slotsUsed === 0) this.time.delayedCall(300, () => sfx('bell'));
    s.slotsUsed = 1;
    this.targets = [...new Set(notebookEntries(s).filter((e) => e.availableNow && e.seg === 'afternoon' && e.loc).map((e) => e.loc as LocId))];

    this.world = this.add.container(0, 0).setDepth(0);
    this.drawGround();
    this.objs = this.add.container(0, 0);
    this.world.add(this.objs);
    for (const sp of SPOTS) {
      const def = LOCATIONS.find((l) => l.id === sp.loc);
      if (def) this.building(sp, def.name, check(s, def.requires));
    }
    this.trees();
    this.placePeople();
    this.beachFinds();
    this.patrol();
    this.critters();

    this.shoreSpots();
    // Eli at the door he came out of (or where he was fishing)
    const from = spotOf(currentLoc) ?? spotOf('dock')!;
    const d = doorOf(from);
    this.pos = currentPos ? { ...currentPos } : { x: d.x, y: d.y + (from.style === 'pier' ? 0 : 16) };
    currentPos = null;
    this.eliShadow = this.add.ellipse(0, 0, 44, 14, PALETTE.ink, 0.2);
    this.eli = this.add.image(0, 0, charTexKey('eli')).setOrigin(0.5, 0.95).setScale(0.8 / TEX_SCALE);
    this.objs.add([this.eliShadow, this.eli]);

    this.buildUi();
    this.setupInput();
    this.updateView();
  }

  // ---------------- drawing the world ----------------
  private drawGround() {
    const g = this.add.graphics();
    this.world.add(g);
    g.fillStyle(0xcfe9c4, 1).fillRect(0, 0, WORLD.w, WORLD.h);
    // grass texture
    for (let i = 0; i < 260; i++) {
      const x = (i * 397) % WORLD.w;
      const y = (i * 241) % WORLD.h;
      g.fillStyle(0xb8dfae, 0.7).fillEllipse(x, y, 26, 8);
    }
    // sand along the coast and the sea
    const coast = coastline();
    g.fillStyle(PALETTE.sand, 1);
    g.beginPath();
    g.moveTo(0, coast[0][1] - 70);
    for (const [x, y] of coast) g.lineTo(x, y - 70);
    g.lineTo(WORLD.w, WORLD.h);
    g.lineTo(0, WORLD.h);
    g.closePath();
    g.fillPath();
    g.fillStyle(PALETTE.sea, 1);
    g.beginPath();
    g.moveTo(0, coast[0][1]);
    for (const [x, y] of coast) g.lineTo(x, y);
    g.lineTo(WORLD.w, WORLD.h);
    g.lineTo(0, WORLD.h);
    g.closePath();
    g.fillPath();
    g.lineStyle(5, SHADE.foam, 0.9);
    g.beginPath();
    g.moveTo(0, coast[0][1]);
    for (const [x, y] of coast) g.lineTo(x, y);
    g.strokePath();
    // the lighthouse bay
    g.fillStyle(PALETTE.sand, 1);
    g.beginPath();
    BAY.forEach(([x, y], i) => (i === 0 ? g.moveTo(x - 40, y) : g.lineTo(x - 30, y + 30)));
    g.closePath();
    g.fillPath();
    g.fillStyle(PALETTE.sea, 1);
    g.beginPath();
    BAY.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.closePath();
    g.fillPath();
    // the creek
    for (const [w, col] of [
      [104, 0x8fbf7a],
      [80, 0x7fb8a8],
    ] as const) {
      g.lineStyle(w, col, 1);
      g.beginPath();
      CREEK.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
      g.strokePath();
      for (const [x, y] of CREEK) g.fillStyle(col, 1).fillCircle(x, y, w / 2);
    }
    // waves
    for (let i = 0; i < 40; i++) {
      const x = (i * 173) % WORLD.w;
      const y = WORLD.h - 10 - ((i * 37) % 40);
      g.lineStyle(3, 0xffffff, 0.5).beginPath().arc(x, y, 12, Math.PI * 1.1, Math.PI * 1.9).strokePath();
    }
    // roads
    for (const r of ROADS) {
      for (const [w, col] of [
        [64, 0xe3cc96],
        [52, PALETTE.sand],
      ] as const) {
        g.lineStyle(w, col, 1);
        g.beginPath();
        g.moveTo(r[0][0], r[0][1]);
        for (const p of r.slice(1)) g.lineTo(p[0], p[1]);
        g.strokePath();
        for (const p of r) g.fillStyle(col, 1).fillCircle(p[0], p[1], w / 2);
      }
    }
  }

  private trees() {
    const spots: [number, number][] = [];
    for (let i = 0; i < 70; i++) spots.push([((i * 331) % (WORLD.w - 200)) + 100, ((i * 197) % (WORLD.h - 420)) + 160]);
    for (const [x, y] of spots) {
      if (!walkable(x, y) || this.nearRoad(x, y, 70)) continue;
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      g.fillStyle(PALETTE.ink, 0.15).fillEllipse(0, 2, 50, 14);
      g.fillStyle(SHADE.woodDark, 1).fillRect(-5, -36, 10, 36);
      g.fillStyle(SHADE.palm, 1).fillCircle(0, -52, 26).fillCircle(-18, -40, 18).fillCircle(18, -40, 18);
      g.lineStyle(3, PALETTE.ink, 0.8).strokeCircle(0, -52, 26);
      c.add(g);
      this.objs.add(c);
    }
  }

  private nearRoad(x: number, y: number, r: number): boolean {
    for (const road of ROADS) {
      for (let i = 1; i < road.length; i++) {
        const [x0, y0] = road[i - 1];
        const [x1, y1] = road[i];
        const t = Phaser.Math.Clamp(((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / ((x1 - x0) ** 2 + (y1 - y0) ** 2), 0, 1);
        if (Phaser.Math.Distance.Between(x, y, x0 + t * (x1 - x0), y0 + t * (y1 - y0)) < r) return true;
      }
    }
    for (const s of SPOTS) if (Phaser.Math.Distance.Between(x, y, s.x, s.y - 40) < 150) return true;
    return false;
  }

  private building(sp: TownSpot, name: string, open: boolean) {
    const c = this.add.container(sp.x, sp.y);
    const g = this.add.graphics();
    c.add(g);
    const ink = PALETTE.ink;
    const box = (w: number, h: number, col: number) => {
      g.fillStyle(ink, 0.18).fillRoundedRect(-w / 2 + 6, -h + 6, w, h, 10);
      g.fillStyle(col, 1).fillRoundedRect(-w / 2, -h, w, h, 10);
      g.lineStyle(4, ink, 1).strokeRoundedRect(-w / 2, -h, w, h, 10);
    };
    const roof = (w: number, h: number, base: number, col: number) => {
      g.fillStyle(col, 1).fillTriangle(-w / 2 - 12, -base, w / 2 + 12, -base, 0, -base - h);
      g.lineStyle(4, ink, 1).strokeTriangle(-w / 2 - 12, -base, w / 2 + 12, -base, 0, -base - h);
    };
    const door = (col: number = SHADE.woodDark) => {
      g.fillStyle(col, 1).fillRoundedRect(-18, -54, 36, 54, { tl: 14, tr: 14, bl: 0, br: 0 });
      g.lineStyle(3, ink, 1).strokeRoundedRect(-18, -54, 36, 54, { tl: 14, tr: 14, bl: 0, br: 0 });
    };
    const windows = (w: number, y: number) => {
      for (const wx of [-w / 2 + 34, w / 2 - 34]) {
        g.fillStyle(0xbfe8f2, 1).fillRoundedRect(wx - 16, y, 32, 28, 4);
        g.lineStyle(3, ink, 1).strokeRoundedRect(wx - 16, y, 32, 28, 4);
      }
    };
    const w = sp.hw * 2;
    const h = sp.hh;
    switch (sp.style) {
      case 'pier': {
        g.fillStyle(SHADE.wood, 1).fillRect(-34, -40, 68, 250);
        for (let y = -40; y < 210; y += 22) g.lineStyle(2, SHADE.woodDark, 1).lineBetween(-34, y, 34, y);
        g.lineStyle(4, ink, 1).strokeRect(-34, -40, 68, 250);
        for (const py of [0, 90, 180]) {
          g.fillStyle(SHADE.woodDark, 1).fillRect(-42, py, 10, 30).fillRect(32, py, 10, 30);
        }
        // Mary Lou tied up beside the pier
        const boat = this.add.image(150, 190, 'boat_marylou').setScale(0.42);
        c.addAt(boat, 0);
        break;
      }
      case 'dunes':
        for (const [dx, dy, r] of [
          [-60, -10, 60],
          [40, -20, 70],
          [110, 10, 45],
        ])
          g.fillStyle(0xead39a, 1).fillEllipse(dx, dy, r * 2, r * 0.9);
        for (let i = 0; i < 8; i++) g.lineStyle(3, 0x8fb878, 1).lineBetween(-80 + i * 25, -30, -86 + i * 25, -52);
        break;
      case 'board':
        g.fillStyle(SHADE.woodDark, 1).fillRect(-50, -20, 10, 30).fillRect(40, -20, 10, 30);
        g.fillStyle(SHADE.wood, 1).fillRoundedRect(-62, -92, 124, 76, 6);
        g.lineStyle(4, ink, 1).strokeRoundedRect(-62, -92, 124, 76, 6);
        for (let i = 0; i < 7; i++) g.fillStyle(i % 3 ? 0xfffaf0 : 0xffe29a, 1).fillRect(-54 + (i % 4) * 28, -84 + Math.floor(i / 4) * 34, 22, 28);
        break;
      case 'lighthouse':
        g.fillStyle(ink, 0.18).fillEllipse(6, 4, 110, 26);
        g.fillStyle(0xfffaf0, 1).fillRect(-34, -230, 68, 230);
        for (let y = -200; y < 0; y += 60) g.fillStyle(PALETTE.coral, 1).fillRect(-34, y, 68, 26);
        g.lineStyle(4, ink, 1).strokeRect(-34, -230, 68, 230);
        g.fillStyle(PALETTE.butter, 1).fillRect(-26, -270, 52, 40);
        g.lineStyle(4, ink, 1).strokeRect(-26, -270, 52, 40);
        g.fillStyle(PALETTE.ink, 1).fillTriangle(-34, -270, 34, -270, 0, -300);
        door();
        break;
      case 'church':
        box(w, h, sp.color);
        roof(w, 60, h, 0xc9b6e4);
        g.fillStyle(sp.color, 1).fillRect(-22, -h - 130, 44, 70);
        g.lineStyle(4, ink, 1).strokeRect(-22, -h - 130, 44, 70);
        g.fillStyle(0xc9b6e4, 1).fillTriangle(-30, -h - 130, 30, -h - 130, 0, -h - 180);
        g.lineStyle(4, ink, 1).strokeTriangle(-30, -h - 130, 30, -h - 130, 0, -h - 180);
        g.lineStyle(4, ink, 1).lineBetween(0, -h - 180, 0, -h - 206).lineBetween(-10, -h - 196, 10, -h - 196);
        windows(w, -h + 26);
        door(0x8a5a3c);
        break;
      case 'bank':
        box(w, h, sp.color);
        g.fillStyle(0xd8d0bc, 1).fillTriangle(-w / 2 - 10, -h, w / 2 + 10, -h, 0, -h - 46);
        g.lineStyle(4, ink, 1).strokeTriangle(-w / 2 - 10, -h, w / 2 + 10, -h, 0, -h - 46);
        for (const cx of [-70, -40, 40, 70]) g.fillStyle(0xfffaf0, 1).fillRect(cx - 7, -h + 8, 14, h - 8).lineStyle(2, ink, 1).strokeRect(cx - 7, -h + 8, 14, h - 8);
        door(0x5a6b8a);
        break;
      case 'diner':
        box(w, h, sp.color);
        g.fillStyle(0xfffaf0, 1).fillRect(-w / 2, -h, w, 18);
        for (let i = 0; i < w; i += 22) g.fillStyle(PALETTE.coral, 1).fillRect(-w / 2 + i, -h, 11, 18);
        g.lineStyle(4, ink, 1).strokeRect(-w / 2, -h, w, 18);
        windows(w, -h + 34);
        door(0xbfe8f2);
        break;
      case 'closed':
        box(w, h, sp.color);
        roof(w, 50, h, 0x9a96a8);
        g.fillStyle(0x9a96a8, 1).fillRect(-w / 2 + 18, -h + 30, 40, 28).fillRect(w / 2 - 58, -h + 30, 40, 28);
        door(0x7d7896);
        g.fillStyle(0xfffaf0, 1).fillRect(-12, -44, 24, 16);
        break;
      default:
        box(w, h, sp.color);
        roof(w, sp.style === 'home' ? 64 : 54, h, sp.style === 'home' ? PALETTE.coral : sp.style === 'shop' ? 0xffa45c : 0xe85d5d);
        windows(w, -h + 26);
        door();
    }
    // sign
    const signY = sp.style === 'pier' ? -70 : sp.style === 'dunes' ? -70 : sp.style === 'board' ? -110 : sp.style === 'lighthouse' ? 24 : 24;
    const label = txt(this, 0, signY, open ? name : `${name} (닫힘)`, {
      size: 18,
      color: open ? '#3B3355' : '#9a96a8',
      stroke: '#FFFAF0',
      strokeThickness: 5,
    }).setOrigin(0.5, 0);
    c.add(label);
    // quest marker over the building
    if (this.targets.includes(sp.loc) && getSettings().guidance) {
      const top = sp.style === 'lighthouse' ? -320 : sp.style === 'pier' || sp.style === 'dunes' ? -110 : sp.style === 'board' ? -140 : sp.style === 'church' ? -sp.hh - 230 : -sp.hh - 90;
      const m = addHeadMark(this, 0, top, 'quest', 40);
      if (m) c.add(m);
    }
    const z = this.add.zone(0, -Math.max(60, sp.hh) / 2, Math.max(120, sp.hw * 2), Math.max(80, sp.hh + 40)).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => this.walkTo(sp.loc));
    c.add(z);
    this.objs.add(c);
  }

  /** [변경 2] shells and sea glass on the sand; new ones every day */
  private beachFinds() {
    const s = G.state;
    const rng = makeRng(hash32(s.seed, 'finds', s.day));
    const total = FINDS.reduce((a, f) => a + FIND_WEIGHT[f.rarity], 0);
    for (let i = 0; i < 6; i++) {
      const key = `find_${s.day}_${i}`;
      let roll = rng() * total;
      const def = FINDS.find((f) => (roll -= FIND_WEIGHT[f.rarity]) < 0) ?? FINDS[0];
      let x = 0;
      let y = 0;
      for (let tries = 0; tries < 20; tries++) {
        x = 160 + rng() * 2240;
        y = coastY(x) - 26 - rng() * 36;
        if (walkable(x, y) && Math.abs(x - 660) > 60) break;
      }
      if (s.flags[key]) continue;
      const g = this.add.graphics();
      g.fillStyle(def.color, 1).fillCircle(0, 0, 8);
      g.lineStyle(2, PALETTE.ink, 0.8).strokeCircle(0, 0, 8);
      g.fillStyle(0xffffff, 0.8).fillCircle(-3, -3, 2.5);
      const c = this.add.container(x, y, [g]);
      this.tweens.add({ targets: c, scale: 1.25, duration: 700, yoyo: true, repeat: -1, delay: i * 200 });
      this.objs.add(c);
      this.finds.push({ key, id: def.id, x, y, obj: c });
    }
  }

  private pickFinds() {
    const s = G.state;
    for (const f of this.finds) {
      if (!f.obj.active || Phaser.Math.Distance.Between(this.pos.x, this.pos.y, f.x, f.y) > 34) continue;
      s.flags[f.key] = true;
      const first = !s.finds[f.id];
      s.finds[f.id] = (s.finds[f.id] ?? 0) + 1;
      f.obj.destroy();
      sfx('pop');
      const def = findDef(f.id)!;
      this.toasts.show(first ? `주웠다: ${def.name} (도감 NEW!)` : `주웠다: ${def.name}`, first ? PALETTE.butter : PALETTE.mint);
    }
  }

  /** Toby walks his patrol: the board, the dock and the sheriff's office, whistling */
  private patrol() {
    const s = G.state;
    if (!TOWN_PEOPLE.includes('toby') || afternoonLocation(s, 'toby') === null) return;
    const route: LocId[] = ['sheriff', 'board', 'dock', 'board'];
    const pts = route.map((l) => {
      const d = doorOf(spotOf(l)!);
      return { x: d.x + 40, y: d.y + 50 };
    });
    // hide the standing Toby; this one walks
    for (const w of this.walkers) if (w.who === 'toby') w.img.setVisible(false);
    const img = this.add.image(pts[0].x, pts[0].y, charTexKey('toby')).setOrigin(0.5, 0.95).setScale(0.75 / TEX_SCALE);
    this.objs.add(img);
    const notes = txt(this, 0, 0, '♪', { size: 22, color: '#3B3355', stroke: '#FFFAF0', strokeThickness: 4 }).setOrigin(0.5);
    this.objs.add(notes);
    this.tweens.add({ targets: notes, alpha: { from: 1, to: 0.2 }, duration: 600, yoyo: true, repeat: -1 });
    let leg = 0;
    const walk = () => {
      if (!img.active) return;
      const from = pts[leg % pts.length];
      const to = pts[(leg + 1) % pts.length];
      leg++;
      img.setScale((to.x < from.x ? -1 : 1) * Math.abs(img.scaleX), img.scaleY);
      this.tweens.add({
        targets: img,
        x: to.x,
        y: to.y,
        duration: (Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y) / 90) * 1000,
        onUpdate: () => notes.setPosition(img.x + 26, img.y - 120),
        onComplete: () => this.time.delayedCall(2500, walk),
      });
    };
    notes.setPosition(img.x + 26, img.y - 120);
    walk();
  }

  /** small sights: a cat asleep by the diner, gulls on the sand that lift off when Eli comes near */
  private critters() {
    const diner = doorOf(spotOf('diner')!);
    const cat = this.add.graphics();
    cat.fillStyle(0xffa45c, 1).fillEllipse(0, 0, 40, 20).fillCircle(16, -8, 9);
    cat.fillTriangle(10, -14, 14, -22, 18, -14).fillTriangle(18, -14, 22, -22, 24, -12);
    cat.lineStyle(2, PALETTE.ink, 1).strokeEllipse(0, 0, 40, 20);
    const cc = this.add.container(diner.x + 120, diner.y + 10, [cat]);
    this.tweens.add({ targets: cc, scaleY: 1.06, duration: 1400, yoyo: true, repeat: -1 });
    this.objs.add(cc);
    const s = G.state;
    const rng = makeRng(hash32(s.seed, 'gulls', s.day));
    for (let i = 0; i < 5; i++) {
      const x = 900 + rng() * 1400;
      const y = coastY(x) - 40;
      const gull = this.add.image(x, y, 'sc_gull').setScale(0.7);
      this.objs.add(gull);
      this.gulls.push(gull);
    }
  }

  private scareGulls() {
    for (const g of this.gulls) {
      if (!g.active || g.getData('flying')) continue;
      if (Phaser.Math.Distance.Between(this.pos.x, this.pos.y, g.x, g.y) < 120) {
        g.setData('flying', true);
        sfx('whoosh');
        this.tweens.add({ targets: g, x: g.x + (g.x > this.pos.x ? 400 : -400), y: g.y - 500, duration: 2200, ease: 'Quad.In', onComplete: () => g.destroy() });
      }
    }
  }

  /** [변경 2] land fishing spots: a rod stuck in a bucket */
  private shoreSpots() {
    for (const sh of SHORES) {
      const c = this.add.container(sh.town.x, sh.town.y);
      const g = this.add.graphics();
      if (sh.id === 'breakwater') {
        for (let i = 0; i < 5; i++) g.fillStyle(i % 2 ? 0x8a8798 : 0x9e9bab, 1).fillEllipse(40 + i * 34, -10 - i * 10, 60, 34).lineStyle(2, PALETTE.ink, 0.5).strokeEllipse(40 + i * 34, -10 - i * 10, 60, 34);
      }
      g.fillStyle(0x6d7a8a, 1).fillRect(-14, -26, 28, 26).lineStyle(3, PALETTE.ink, 1).strokeRect(-14, -26, 28, 26);
      g.lineStyle(3, SHADE.woodDark, 1).lineBetween(0, -24, 30, -84);
      g.lineStyle(1.5, 0xffffff, 0.9).lineBetween(30, -84, 44, -20);
      c.add(g);
      c.add(txt(this, 0, 6, `낚시: ${sh.name}`, { size: 15, color: '#2d5fa8', stroke: '#FFFAF0', strokeThickness: 4 }).setOrigin(0.5, 0));
      const z = this.add.zone(0, -40, 90, 90).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        if (this.leaving) return;
        this.setTarget({ x: sh.town.x, y: sh.town.y, fish: sh.id });
      });
      c.add(z);
      this.objs.add(c);
    }
  }

  private placePeople() {
    const s = G.state;
    for (const sp of SPOTS) {
      const d = doorOf(sp);
      const ppl = peopleAt(s, sp.loc);
      ppl.slice(0, 4).forEach((who, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const x = d.x + side * (70 + Math.floor(i / 2) * 50);
        const y = d.y + 30 + (i % 2) * 6;
        const img = this.add.image(x, y, charTexKey(who)).setOrigin(0.5, 0.95).setScale((-side * 0.75) / TEX_SCALE, 0.75 / TEX_SCALE);
        img.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.walkTo(sp.loc));
        this.objs.add(img);
        this.walkers.push({ who, img, loc: sp.loc });
        // a little pacing
        this.tweens.add({
          targets: img,
          x: x + side * 26,
          duration: 1800 + i * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
          delay: i * 400,
          onYoyo: () => img.setScale(-img.scaleX, img.scaleY),
          onRepeat: () => img.setScale(-img.scaleX, img.scaleY),
        });
        const mark = headMarkFor(s, who, sp.loc);
        if (mark && mark !== 'talk') {
          const m = addHeadMark(this, x, y - 118, mark, 28);
          if (m) {
            this.objs.add(m);
            m.setData('follow', img);
          }
        }
      });
    }
  }

  // ---------------- UI ----------------
  private buildUi() {
    const s = G.state;
    new Hud(this);
    this.toasts = new Toasts(this);
    // joystick
    const base = this.add.circle(JOY.x, JOY.y, JOY.r, PALETTE.ink, 0.18).setDepth(700).setStrokeStyle(4, 0xfffaf0, 0.8);
    base.setInteractive();
    this.joyKnob = this.add.circle(JOY.x, JOY.y, 28, 0xfffaf0, 0.85).setDepth(701).setStrokeStyle(3, PALETTE.ink, 0.8);
    txt(this, JOY.x, JOY.y + JOY.r + 14, '이동', { size: 13, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 3 }).setOrigin(0.5).setDepth(701);
    // minimap
    const mg = this.add.graphics().setDepth(700);
    panel(mg, MINI.x - 4, MINI.y - 4, MINI.w + 8, MINI.h + 8, 0xfffaf0, 10, 0.95);
    this.mini = this.add.graphics().setDepth(701);
    this.drawMap(this.mini, MINI.x, MINI.y, MINI.w / WORLD.w, false);
    this.miniEli = this.add.circle(0, 0, 4, PALETTE.killerRed).setDepth(702).setStrokeStyle(2, 0xffffff);
    txt(this, MINI.x + MINI.w - 4, MINI.y + MINI.h - 2, '지도 (M)', { size: 12, color: '#6b6385' }).setOrigin(1, 1).setDepth(702);
    this.add.zone(MINI.x, MINI.y, MINI.w, MINI.h).setOrigin(0).setDepth(703).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.openMap());
    // off-screen arrows
    this.arrows = this.add.graphics().setDepth(690);
    // enter prompt
    this.prompt = new Button(this, 640, 640, '', () => this.enterPrompt(), { w: 380, h: 54, size: 20, fill: PALETTE.butter, sub: 'Space / Enter' }).setDepth(705);
    this.prompt.setVisible(false);
    const label = isPaymentDay(s.day) && !s.flags[`paid_${s.day}`] ? '저녁으로 (은행 17시)' : '저녁으로 →';
    new Button(this, 1140, 672, label, () => this.finish(), { w: 230, h: 50, size: 19, fill: 0xfff3d6 }).setDepth(705);
    txt(this, 640, 700, '방향키·WASD / 왼쪽 아래 조이스틱 / 땅을 누르면 걸어간다 · 문 앞에서 Space', { size: 13, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(704);
  }

  /** the whole town drawn small into g at (ox, oy) with scale k */
  private drawMap(g: Phaser.GameObjects.Graphics, ox: number, oy: number, k: number, big: boolean) {
    g.fillStyle(0xcfe9c4, 1).fillRect(ox, oy, WORLD.w * k, WORLD.h * k);
    const coast = coastline();
    g.fillStyle(PALETTE.sea, 1);
    g.beginPath();
    g.moveTo(ox, oy + coast[0][1] * k);
    for (const [x, y] of coast) g.lineTo(ox + x * k, oy + y * k);
    g.lineTo(ox + WORLD.w * k, oy + WORLD.h * k);
    g.lineTo(ox, oy + WORLD.h * k);
    g.closePath();
    g.fillPath();
    g.beginPath();
    BAY.forEach(([x, y], i) => (i === 0 ? g.moveTo(ox + x * k, oy + y * k) : g.lineTo(ox + x * k, oy + y * k)));
    g.closePath();
    g.fillPath();
    g.lineStyle(Math.max(2, 52 * k), PALETTE.sand, 1);
    for (const r of ROADS) {
      g.beginPath();
      g.moveTo(ox + r[0][0] * k, oy + r[0][1] * k);
      for (const p of r.slice(1)) g.lineTo(ox + p[0] * k, oy + p[1] * k);
      g.strokePath();
    }
    for (const sp of SPOTS) {
      const bw = Math.max(6, sp.hw * 2 * k);
      const bh = Math.max(5, sp.hh * k);
      const col = this.targets.includes(sp.loc) ? PALETTE.butter : sp.style === 'home' ? PALETTE.peach : 0xfffaf0;
      g.fillStyle(col, 1).fillRect(ox + sp.x * k - bw / 2, oy + (sp.y - sp.hh) * k, bw, bh);
      g.lineStyle(big ? 2 : 1, PALETTE.ink, 1).strokeRect(ox + sp.x * k - bw / 2, oy + (sp.y - sp.hh) * k, bw, bh);
    }
  }

  private openMap() {
    if (this.mapOpen || this.leaving) return;
    this.mapOpen = true;
    const token = {};
    holdClock(token);
    const k = 0.42;
    const ox = 640 - (WORLD.w * k) / 2;
    const oy = 392 - (WORLD.h * k) / 2;
    const c = this.add.container(0, 0).setDepth(1300);
    const shade = this.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.55).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    panel(g, ox - 14, oy - 50, WORLD.w * k + 28, WORLD.h * k + 64, 0xfbf6e8, 14);
    c.add([shade, g]);
    const mg = this.add.graphics();
    this.drawMap(mg, ox, oy, k, true);
    c.add(mg);
    c.add(txt(this, 640, oy - 28, owns(G.state, 'truck') ? '펠리컨 코브 지도 · 장소를 누르면 트럭으로 간다' : '펠리컨 코브 지도 · 장소를 누르면 그리로 걸어간다', { size: 20, fontFamily: FONT_TITLE }).setOrigin(0.5));
    c.add(txt(this, ox + WORLD.w * k, oy - 28, '닫기 (M / Esc)', { size: 14, color: '#9a96a8' }).setOrigin(1, 0.5));
    const s = G.state;
    for (const sp of SPOTS) {
      const def = locationDef(sp.loc);
      const open = check(s, def.requires);
      const x = ox + sp.x * k;
      const y = oy + sp.y * k;
      c.add(txt(this, x, y + 4, def.name, { size: 14, color: open ? '#3B3355' : '#9a96a8', stroke: '#FFFAF0', strokeThickness: 4 }).setOrigin(0.5, 0));
      const ppl = peopleAt(s, sp.loc).slice(0, 3);
      ppl.forEach((p, i) => c.add(this.add.image(x - (ppl.length - 1) * 11 + i * 22, y - sp.hh * k - 12, portraitKey(p)).setScale(0.09)));
      if (this.targets.includes(sp.loc)) {
        const m = addHeadMark(this, x + 26, y - sp.hh * k - 14, 'quest', 24);
        if (m) c.add(m);
      }
      const z = this.add.zone(x, y - (sp.hh * k) / 2, Math.max(70, sp.hw * 2 * k), Math.max(50, sp.hh * k + 30)).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        close();
        if (owns(s, 'truck') && sp.loc !== 'home') this.drive(sp.loc);
        else this.walkTo(sp.loc);
      });
      c.add(z);
    }
    const me = this.add.circle(ox + this.pos.x * k, oy + this.pos.y * k, 8, PALETTE.killerRed).setStrokeStyle(3, 0xffffff);
    c.add(me);
    c.add(txt(this, ox + this.pos.x * k, oy + this.pos.y * k - 22, '나', { size: 14, color: '#d7263d', stroke: '#FFFAF0', strokeThickness: 4 }).setOrigin(0.5));
    this.tweens.add({ targets: me, scale: 1.4, yoyo: true, repeat: -1, duration: 500 });
    let open = true;
    const close = () => {
      if (!open) return;
      open = false;
      releaseClock(token);
      window.removeEventListener('keydown', key);
      c.destroy();
      this.time.delayedCall(50, () => (this.mapOpen = false));
    };
    const key = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' || e.code === 'Escape') close();
    };
    window.setTimeout(() => open && window.addEventListener('keydown', key), 0);
    shade.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.worldX < ox - 14 || p.worldX > ox + WORLD.w * k + 14 || p.worldY < oy - 50 || p.worldY > oy + WORLD.h * k + 14) close();
    });
    this.events.once('shutdown', close);
  }

  // ---------------- input ----------------
  private setupInput() {
    onKey(this, 'KeyM', () => {
      if (!this.overlayOpen()) this.openMap();
    });
    onKey(this, ['Space', 'Enter', 'NumpadEnter'], () => {
      if (!this.overlayOpen()) this.enterPrompt();
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.leaving || this.overlayOpen()) return;
      const sx = p.worldX;
      const sy = p.worldY;
      if (Phaser.Math.Distance.Between(sx, sy, JOY.x, JOY.y) < JOY.r + 40) {
        this.joy = { active: true, id: p.id, dx: 0, dy: 0 };
        this.target = null;
        this.path = [];
        this.moveJoy(sx, sy);
        return;
      }
      if (over.length) return;
      if (sy < 84) return;
      this.setTarget({ x: sx + this.scroll.x, y: sy + this.scroll.y });
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.joy.active && p.id === this.joy.id) this.moveJoy(p.worldX, p.worldY);
    });
    const up = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joy.id) return;
      this.joy = { active: false, id: -1, dx: 0, dy: 0 };
      this.joyKnob.setPosition(JOY.x, JOY.y);
    };
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
  }

  private moveJoy(x: number, y: number) {
    let dx = x - JOY.x;
    let dy = y - JOY.y;
    const d = Math.hypot(dx, dy);
    if (d > JOY.r) {
      dx = (dx / d) * JOY.r;
      dy = (dy / d) * JOY.r;
    }
    this.joyKnob.setPosition(JOY.x + dx, JOY.y + dy);
    this.joy.dx = dx / JOY.r;
    this.joy.dy = dy / JOY.r;
  }

  private overlayOpen(): boolean {
    return this.mapOpen || ['notebook', 'inventory', 'dialogueLog'].some((n) => !!this.children.getByName(n));
  }

  /** walk along a path around buildings and water to (x, y) */
  private setTarget(t: { x: number; y: number; enter?: LocId; fish?: ShoreId }) {
    this.target = t;
    this.path = findPath(this.pos, t);
    if (!this.path.length) this.path = [{ x: t.x, y: t.y }];
  }

  /** [변경 2] the pickup truck: straight to a door, the clock jumps a little */
  private drive(loc: LocId) {
    if (this.leaving) return;
    const s = G.state;
    s.time = Math.min(TUNING.clock.dusk - 1, s.time + TUNING.transport.truckMinutes);
    sfx('creak');
    this.cameras.main.fadeOut(200, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const d = doorOf(spotOf(loc)!);
      this.pos = { x: d.x, y: d.y + 10 };
      this.updateView();
      this.cameras.main.fadeIn(200, 21, 18, 31);
      this.enter(loc);
    });
  }

  /** Walk to a place's door and go in. */
  walkTo(loc: LocId) {
    if (this.leaving) return;
    const sp = spotOf(loc);
    if (!sp) return;
    const d = doorOf(sp);
    this.setTarget({ x: d.x, y: d.y + 8, enter: loc });
  }

  // ---------------- frame ----------------
  update(_t: number, delta: number) {
    const s = G.state;
    if (this.leaving) return;
    const dt = Math.min(0.05, delta / 1000);
    const blocked = this.overlayOpen() || this.scene.isActive('Pause');
    if (!blocked) {
      this.pickFinds();
      this.scareGulls();
      tickClock(s, delta, 'land');
      if (checkAfternoonClock(this, 'Town')) {
        this.leaving = true;
        return;
      }
      this.move(dt);
    }
    this.updateView();
  }

  private move(dt: number) {
    let vx = 0;
    let vy = 0;
    if (isHeld(...KEY.left)) vx -= 1;
    if (isHeld(...KEY.right)) vx += 1;
    if (isHeld(...KEY.up)) vy -= 1;
    if (isHeld(...KEY.down)) vy += 1;
    if (vx || vy) {
      this.target = null;
      this.path = [];
    }
    if (!vx && !vy && this.joy.active && Math.hypot(this.joy.dx, this.joy.dy) > 0.15) {
      vx = this.joy.dx;
      vy = this.joy.dy;
    }
    if (!vx && !vy && this.target) {
      let next = this.path[0] ?? this.target;
      let dx = next.x - this.pos.x;
      let dy = next.y - this.pos.y;
      let d = Math.hypot(dx, dy);
      while (d < 10 && this.path.length > 1) {
        this.path.shift();
        next = this.path[0];
        dx = next.x - this.pos.x;
        dy = next.y - this.pos.y;
        d = Math.hypot(dx, dy);
      }
      if (d < 8) {
        const { enter, fish } = this.target;
        this.target = null;
        this.path = [];
        if (enter) this.enter(enter);
        else if (fish) this.goFish(fish);
        return;
      }
      vx = dx / d;
      vy = dy / d;
    }
    const len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }
    if (!vx && !vy) {
      this.eli.setAngle(0);
      return;
    }
    const step = (owns(G.state, 'bike') ? TUNING.transport.bikeSpeed : TUNING.transport.walkSpeed) * dt;
    const nx = this.pos.x + vx * step;
    const ny = this.pos.y + vy * step;
    let moved = false;
    if (walkable(nx, ny)) {
      this.pos = { x: nx, y: ny };
      moved = true;
    } else if (walkable(nx, this.pos.y)) {
      this.pos.x = nx;
      moved = true;
    } else if (walkable(this.pos.x, ny)) {
      this.pos.y = ny;
      moved = true;
    }
    if (!moved && this.target) {
      // stuck on the way to a tapped point: give up unless it was a door we are next to
      const enter = this.target.enter;
      const near = Phaser.Math.Distance.Between(this.pos.x, this.pos.y, this.target.x, this.target.y) < ENTER_DIST;
      this.target = null;
      if (enter && near) this.enter(enter);
    }
    if (vx) this.eli.setScale((vx < 0 ? -1 : 1) * Math.abs(this.eli.scaleX), this.eli.scaleY);
    this.stepT += dt;
    this.eli.setAngle(Math.sin(this.stepT * 14) * 4);
    if (this.stepT > 0.32) {
      this.stepT = 0;
      sfx('step');
    }
  }

  private updateView() {
    this.scroll.x = Phaser.Math.Clamp(this.pos.x - VIEW.w / 2, 0, WORLD.w - VIEW.w);
    this.scroll.y = Phaser.Math.Clamp(this.pos.y - VIEW.h / 2 - 20, 0, WORLD.h - VIEW.h);
    this.world.setPosition(-this.scroll.x, -this.scroll.y);
    this.eli.setPosition(this.pos.x, this.pos.y);
    this.eliShadow.setPosition(this.pos.x, this.pos.y);
    // marks follow their walkers
    for (const o of this.objs.list) {
      const f = o.getData?.('follow') as Phaser.GameObjects.Image | undefined;
      if (f && 'x' in o) (o as Phaser.GameObjects.Container).x = f.x;
    }
    this.objs.sort('y');
    // minimap
    const k = MINI.w / WORLD.w;
    this.miniEli.setPosition(MINI.x + this.pos.x * k, MINI.y + this.pos.y * k);
    // what is in front of Eli: a door or a fishing spot
    let near: LocId | null = null;
    let nearShore: ShoreId | null = null;
    let best = ENTER_DIST;
    for (const sp of SPOTS) {
      const d = doorOf(sp);
      const dist = Phaser.Math.Distance.Between(this.pos.x, this.pos.y, d.x, d.y);
      if (dist < best) {
        best = dist;
        near = sp.loc;
      }
    }
    for (const sh of SHORES) {
      const dist = Phaser.Math.Distance.Between(this.pos.x, this.pos.y, sh.town.x, sh.town.y);
      if (dist < best) {
        best = dist;
        nearShore = sh.id;
        near = null;
      }
    }
    const key = nearShore ? `shore:${nearShore}` : near ? `loc:${near}` : '';
    if (key !== this.promptKey) {
      this.promptKey = key;
      this.promptLoc = near;
      this.promptShore = nearShore;
      if (nearShore) {
        this.prompt.setText(`낚시하기: ${SHORES.find((x) => x.id === nearShore)!.name}`);
      } else if (near) {
        const def = locationDef(near);
        const open = check(G.state, def.requires);
        this.prompt.setText(near === 'home' ? '집에 들어가 하루 마치기' : open ? `들어가기: ${def.name}` : `${def.name}: 잠겨 있다`);
      }
      this.prompt.setVisible(!!key);
    }
    this.drawArrows();
  }

  /** arrows at the screen edge pointing to today's quest places that are off screen */
  private drawArrows() {
    const g = this.arrows;
    g.clear();
    this.arrowLabels.forEach((t) => t.destroy());
    this.arrowLabels = [];
    if (!getSettings().guidance) return;
    for (const loc of this.targets) {
      const sp = spotOf(loc);
      if (!sp) continue;
      const sx = sp.x - this.scroll.x;
      const sy = sp.y - 60 - this.scroll.y;
      if (sx > 20 && sx < VIEW.w - 20 && sy > 90 && sy < VIEW.h - 20) continue;
      const cx = 640;
      const cy = 380;
      const ang = Math.atan2(sy - cy, sx - cx);
      // clamp to an inner rectangle
      const hw = 600;
      const hh = 250;
      const t = Math.min(hw / Math.abs(Math.cos(ang) || 1e-6), hh / Math.abs(Math.sin(ang) || 1e-6));
      const ax = cx + Math.cos(ang) * t;
      const ay = cy + Math.sin(ang) * t;
      const pts = [0, -0.5, 0.5].map((da, i) => {
        const r = i === 0 ? 26 : 16;
        return { x: ax + Math.cos(ang + da * (i === 0 ? 0 : 2.4)) * r, y: ay + Math.sin(ang + da * (i === 0 ? 0 : 2.4)) * r };
      });
      g.fillStyle(PALETTE.butter, 1).fillTriangle(pts[0].x, pts[0].y, pts[1].x, pts[1].y, pts[2].x, pts[2].y);
      g.lineStyle(3, PALETTE.ink, 1).strokeTriangle(pts[0].x, pts[0].y, pts[1].x, pts[1].y, pts[2].x, pts[2].y);
      const lt = txt(this, ax - Math.cos(ang) * 40, ay - Math.sin(ang) * 30, locationDef(loc).name, { size: 14, color: '#3B3355', stroke: '#FFE29A', strokeThickness: 4 })
        .setOrigin(0.5)
        .setDepth(691);
      this.arrowLabels.push(lt);
    }
  }

  // ---------------- leaving ----------------
  private enterPrompt() {
    if (this.promptShore) this.goFish(this.promptShore);
    else if (this.promptLoc) this.enter(this.promptLoc);
  }

  private goFish(id: ShoreId) {
    if (this.leaving) return;
    const s = G.state;
    if (!Object.values(s.bait).some((n) => n > 0)) {
      this.prompt.setText('미끼가 없다 (새벽 행크 가판대)');
      sfx('thud');
      return;
    }
    this.leaving = true;
    sfx('step');
    this.cameras.main.fadeOut(250, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Trawl', { ground: 'oyster', shore: id }));
  }

  private enter(loc: LocId) {
    const s = G.state;
    if (this.leaving) return;
    if (loc === 'home') {
      this.finish();
      return;
    }
    const def = locationDef(loc);
    if (!check(s, def.requires)) {
      sfx('thud');
      return;
    }
    currentLoc = loc;
    this.leaving = true;
    sfx('step');
    this.cameras.main.fadeOut(250, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Location', { loc }));
  }

  private finish() {
    if (this.leaving) return;
    this.leaving = true;
    currentLoc = 'home';
    this.cameras.main.fadeOut(350, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => endSegment(this));
  }
}
