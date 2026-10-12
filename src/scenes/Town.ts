import Phaser from 'phaser';
import { PALETTE, SHADE, FONT_TITLE } from '../art/palette';
import { portraitKey } from '../art/characters';
import { ambientWaves, music, sfx } from '../audio/sfx';
import { TUNING } from '../config/tuning';
import { check } from '../core/conditions';
import { isPaymentDay } from '../core/calendar';
import { G } from '../core/game';
import { owns } from '../core/state';
import type { LocId } from '../core/types';
import { initView } from '../core/view';
import { LOCATIONS, type LocationDef } from '../data/locations';
import { peopleAt } from '../data/schedules';
import { FEEL_ICON, feelStateOf } from '../systems/feelings';
import { notebookEntries } from '../systems/notebook';
import { Button, panel } from '../ui/Button';
import { Hud } from '../ui/Hud';
import { txt } from '../ui/text';
import { endSegment } from './director';
import type { FeelId } from '../core/types';

export function afternoonSlots(): number {
  return owns(G.state, 'truck') ? TUNING.afternoon.slotsWithTruck : TUNING.afternoon.slots;
}

/** Afternoon town map: clickable nodes; each visit spends one slot. */
export class TownScene extends Phaser.Scene {
  constructor() {
    super('Town');
  }

  create() {
    initView(this);
    const s = G.state;
    this.cameras.main.fadeIn(300, 21, 18, 31);
    ambientWaves(true, 0.02);
    music('town');
    this.drawMap();
    const slots = afternoonSlots();
    const left = slots - s.slotsUsed;
    if (s.slotsUsed === 0) this.time.delayedCall(300, () => sfx('bell'));

    // quest markers: where the notebook says to go this afternoon
    const targets = new Set(notebookEntries(s).filter((e) => e.availableNow && e.seg === 'afternoon' && e.loc).map((e) => e.loc as LocId));
    for (const loc of LOCATIONS) {
      if (!check(s, loc.requires)) continue;
      this.node(loc, targets.has(loc.id), left > 0);
    }
    new Hud(this);
    // slot indicator
    const g = this.add.graphics().setDepth(700);
    panel(g, 500, 640, 280, 60, 0xfffaf0, 18);
    txt(this, 520, 670, '남은 오후', { size: 20 }).setOrigin(0, 0.5).setDepth(701);
    for (let i = 0; i < slots; i++) {
      const filled = i < left;
      const c = this.add.circle(650 + i * 34, 670, 12, filled ? PALETTE.butter : 0xd9d4e3).setStrokeStyle(3, PALETTE.ink).setDepth(701);
      if (filled) this.tweens.add({ targets: c, scale: 1.12, duration: 700, yoyo: true, repeat: -1 });
    }
    const label = isPaymentDay(s.day) && !s.flags[`paid_${s.day}`] ? '저녁으로 (은행 납부)' : '저녁으로 →';
    new Button(this, 1120, 670, label, () => this.finish(), { w: 250, h: 54, size: 20, fill: left > 0 ? 0xfff3d6 : PALETTE.coral }).setDepth(700);
    if (left <= 0) {
      txt(this, 640, 600, '해가 기운다. 오늘 오후는 여기까지.', { size: 22, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 5 })
        .setOrigin(0.5)
        .setDepth(700);
    }
  }

  private drawMap() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xcfe9c4, 1).fillRect(0, 0, 1280, 720);
    // sea along the bottom-left
    g.fillStyle(PALETTE.sea, 1);
    g.beginPath();
    g.moveTo(0, 520);
    g.lineTo(180, 560);
    g.lineTo(300, 640);
    g.lineTo(560, 700);
    g.lineTo(1280, 690);
    g.lineTo(1280, 720);
    g.lineTo(0, 720);
    g.closePath();
    g.fillPath();
    g.fillStyle(PALETTE.sea, 1).fillTriangle(1080, 0, 1280, 0, 1280, 160);
    // roads
    g.lineStyle(26, PALETTE.sand, 1);
    const road = (pts: number[][]) => {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
      g.strokePath();
    };
    road([
      [170, 250],
      [420, 180],
      [560, 330],
      [760, 200],
      [1060, 240],
      [1180, 120],
    ]);
    road([
      [240, 430],
      [560, 330],
      [660, 440],
      [900, 360],
      [1150, 400],
    ]);
    road([
      [120, 620],
      [330, 560],
      [470, 600],
      [660, 440],
      [760, 560],
      [900, 620],
      [1000, 520],
    ]);
    // trees
    for (let i = 0; i < 26; i++) {
      const x = (i * 197) % 1240 + 20;
      const y = (i * 131) % 460 + 120;
      g.fillStyle(SHADE.palm, 0.8).fillCircle(x, y, 12);
    }
    txt(this, 640, 104, '펠리컨 코브 · 오후', { size: 30, fontFamily: FONT_TITLE, color: '#3B3355' }).setOrigin(0.5).setDepth(1);
  }

  private node(loc: LocationDef, marked: boolean, canGo: boolean) {
    const s = G.state;
    const c = this.add.container(loc.x, loc.y).setDepth(10);
    const g = this.add.graphics();
    const col = loc.id === 'home' ? PALETTE.peach : loc.id === 'pharmacy' ? 0xd9d4e3 : PALETTE.butter;
    g.fillStyle(PALETTE.ink, 0.2).fillRoundedRect(-36, -26, 76, 60, 14);
    g.fillStyle(col, 1).fillRoundedRect(-38, -30, 76, 60, 14);
    g.lineStyle(3, PALETTE.ink, 1).strokeRoundedRect(-38, -30, 76, 60, 14);
    g.fillStyle(PALETTE.coral, 1).fillTriangle(-30, -30, 30, -30, 0, -52);
    g.lineStyle(3, PALETTE.ink, 1).strokeTriangle(-30, -30, 30, -30, 0, -52);
    c.add(g);
    c.add(txt(this, 0, 40, loc.name, { size: 16, color: '#3B3355', stroke: '#FFFAF0', strokeThickness: 4 }).setOrigin(0.5, 0));
    // people present
    const ppl = peopleAt(s, loc.id);
    ppl.slice(0, 3).forEach((p, i) => {
      const px = -30 + i * 30;
      const img = this.add.image(px, -2, portraitKey(p)).setScale(0.13);
      c.add(img);
      const fv = s.feelings[p as FeelId];
      if (fv !== undefined) c.add(txt(this, px + 10, 10, FEEL_ICON[feelStateOf(fv)], { size: 11, color: '#3B3355' }).setOrigin(0.5));
    });
    if (marked) {
      const m = txt(this, 30, -62, '!', { size: 30, fontFamily: FONT_TITLE, color: '#D7263D', stroke: '#FFFAF0', strokeThickness: 5 }).setOrigin(0.5);
      c.add(m);
      this.tweens.add({ targets: m, y: -70, duration: 450, yoyo: true, repeat: -1 });
    }
    c.setSize(90, 90).setInteractive({ useHandCursor: canGo || loc.id === 'home' });
    c.on('pointerover', () => c.setScale(1.08));
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerdown', () => this.visit(loc, canGo));
  }

  private visit(loc: LocationDef, canGo: boolean) {
    const s = G.state;
    if (loc.id === 'home') {
      this.finish();
      return;
    }
    if (!canGo) return;
    s.slotsUsed += 1;
    sfx('step');
    this.cameras.main.fadeOut(250, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Location', { loc: loc.id }));
  }

  private finish() {
    this.cameras.main.fadeOut(350, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => endSegment(this));
  }
}
