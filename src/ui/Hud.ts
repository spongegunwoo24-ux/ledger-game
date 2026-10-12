import Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { dayLabel, moonOf, tideOf, weatherOf } from '../core/calendar';
import { fmtTime, timeOfDayLabel } from '../core/clock';
import { G } from '../core/game';
import { paymentPressure } from '../systems/economy';
import { paymentStatusLine, trackerEntries } from '../systems/notebook';
import { Button, panel } from './Button';
import { openLog } from './Dialogue';
import { openNotebook } from './Notebook';
import { txt } from './text';

const WEATHER_ICON: Record<string, string> = { 맑음: '☀', 흐림: '☁', 비: '☂', 바람: '༄', 폭풍: '⚡' };
const PRESSURE_COLOR = ['#2f8f5f', '#e07b2a', '#d7263d'];

export interface HudOpts {
  notebook?: boolean;
  pause?: boolean;
  tracker?: boolean;
}

/**
 * [변경 1] Top bar: day + clock on the left, money + this week's payment status on the right
 * (green → orange → red), and the quest tracker under it.
 */
export class Hud {
  c: Phaser.GameObjects.Container;
  private money: Phaser.GameObjects.Text;
  private status: Phaser.GameObjects.Text;
  private statusBg: Phaser.GameObjects.Graphics;
  private clock: Phaser.GameObjects.Text;
  private seg: Phaser.GameObjects.Text;
  private shownMoney: number;
  private lastMinute = -1;
  private tracker: Phaser.GameObjects.Container | null = null;
  private trackerKey = '';
  private lastStatus = '';

  constructor(
    private scene: Phaser.Scene,
    private opts: HudOpts = {},
  ) {
    const s = G.state;
    this.c = scene.add.container(0, 0).setDepth(800);
    const g = scene.add.graphics();
    panel(g, 12, 10, 330, 64, 0xfffaf0, 18, 0.95);
    panel(g, 350, 10, 120, 64, 0x3b4a5c, 18, 0.95);
    panel(g, 760, 10, 508, 64, 0xfffaf0, 18, 0.95);
    this.c.add(g);
    this.c.add(txt(scene, 30, 18, dayLabel(s.day), { size: 19 }));
    const w = weatherOf(s.day, s.seed);
    this.c.add(txt(scene, 30, 46, `${WEATHER_ICON[w] ?? ''} ${w} · ${tideOf(s.day, s.seed)} · ${moonOf(s.day)}달`, { size: 16, color: '#6b6385' }));
    this.clock = txt(scene, 410, 34, fmtTime(s.time), { size: 30, fontFamily: FONT_TITLE, color: '#FFE29A' }).setOrigin(0.5);
    this.seg = txt(scene, 410, 60, timeOfDayLabel(s.time), { size: 13, color: '#C9B6E4' }).setOrigin(0.5);
    this.c.add([this.clock, this.seg]);
    this.shownMoney = s.money;
    this.money = txt(scene, 778, 15, `$${s.money.toFixed(2)}`, { size: 24, fontFamily: FONT_TITLE, color: '#3B3355' });
    this.c.add(this.money);
    this.c.add(txt(scene, 1250, 20, s.debt > 0 ? `남은 빚 $${s.debt.toFixed(0)}` : '', { size: 14, color: '#9a96a8' }).setOrigin(1, 0));
    this.statusBg = scene.add.graphics();
    this.c.add(this.statusBg);
    this.status = txt(scene, 778, 49, '', { size: 15, color: '#2f8f5f' });
    this.c.add(this.status);
    this.refresh();

    let bx = 500;
    if (opts.pause !== false) {
      this.c.add(
        new Button(scene, bx, 42, '≡', () => scene.scene.launch('Pause', { from: scene.scene.key }), { w: 46, h: 44, size: 24, fill: 0xfff3d6 }),
      );
      scene.input.keyboard?.on('keydown-ESC', () => {
        if (!scene.scene.isActive('Pause')) scene.scene.launch('Pause', { from: scene.scene.key });
      });
      bx += 64;
    }
    if (opts.notebook !== false) {
      this.c.add(new Button(scene, bx + 10, 42, '수첩', () => openNotebook(scene), { w: 72, h: 44, size: 18, fill: PALETTE.mint }));
      scene.input.keyboard?.on('keydown-N', () => openNotebook(scene));
      bx += 86;
    }
    this.c.add(new Button(scene, bx + 10, 42, '기록', () => openLog(scene), { w: 72, h: 44, size: 18, fill: 0xfff3d6 }));
    scene.input.keyboard?.on('keydown-L', () => {
      if (!scene.children.getByName('dialogueLog')) openLog(scene);
    });
    if (opts.tracker !== false) this.drawTracker();
    scene.events.on('update', this.tick, this);
    scene.events.once('shutdown', () => scene.events.off('update', this.tick, this));
  }

  private tick() {
    const s = G.state;
    const m = Math.floor(s.time);
    if (m !== this.lastMinute) {
      this.lastMinute = m;
      this.clock.setText(fmtTime(s.time));
      this.seg.setText(timeOfDayLabel(s.time));
    }
    if (Math.abs(s.money - this.shownMoney) > 0.001) this.refresh();
    if (this.opts.tracker !== false && this.scene.time.now % 30 < 17) this.drawTracker();
  }

  refresh() {
    const s = G.state;
    const target = s.money;
    const from = this.shownMoney;
    if (Math.abs(target - from) > 0.001) {
      this.scene.tweens.addCounter({
        from,
        to: target,
        duration: 600,
        onUpdate: (tw) => this.money.setText(`$${(tw.getValue() ?? target).toFixed(2)}`),
      });
      this.scene.tweens.add({ targets: this.money, scale: 1.1, yoyo: true, duration: 140 });
      this.shownMoney = target;
    } else {
      this.money.setText(`$${target.toFixed(2)}`);
    }
    const line = paymentStatusLine(s);
    const p = paymentPressure(s);
    if (line + p !== this.lastStatus) {
      this.lastStatus = line + p;
      this.status.setText(line).setColor(PRESSURE_COLOR[p]);
      this.statusBg.clear();
      if (p > 0) {
        this.statusBg.fillStyle(p === 2 ? 0xffd6d6 : 0xffe6c8, 1).fillRoundedRect(770, 45, this.status.width + 18, 24, 8);
        if (p === 2) this.scene.tweens.add({ targets: this.status, alpha: 0.55, yoyo: true, repeat: 2, duration: 300 });
      }
    }
    if (this.opts.tracker !== false) this.drawTracker();
  }

  /** [변경 1] Quest tracker on the right: tracked quest large, up to two more small. */
  private drawTracker() {
    const s = G.state;
    const entries = trackerEntries(s);
    const key = JSON.stringify(entries.map((e) => [e.questId, e.text, e.when, e.progress])) + s.trackedQuest;
    if (key === this.trackerKey) return;
    this.trackerKey = key;
    this.tracker?.destroy();
    if (!entries.length) {
      this.tracker = null;
      return;
    }
    const c = this.scene.add.container(0, 0).setDepth(790);
    const x = 960;
    let y = 86;
    const g = this.scene.add.graphics();
    c.add(g);
    const parts: Phaser.GameObjects.Text[] = [];
    entries.forEach((e, i) => {
      const big = i === 0;
      const t1 = txt(this.scene, x + 16, y + 8, `${big ? '▶ ' : ''}${e.questTitle ?? ''}`, { size: big ? 17 : 14, color: big ? '#b04a52' : '#6b6385', wordWrap: { width: 270 } });
      const t2 = txt(this.scene, x + 16, y + 8 + t1.height + 2, `${e.text}`, { size: big ? 18 : 14, color: '#3B3355', wordWrap: { width: 270, useAdvancedWrap: true } });
      const t3 = txt(this.scene, x + 16, y + 10 + t1.height + t2.height + 2, `${e.where} · ${e.when.split(' ')[0]} ${e.timeHint ?? ''} · ${e.progress ?? ''}`, { size: 12, color: '#7d7896' });
      parts.push(t1, t2, t3);
      const h = t1.height + t2.height + t3.height + 20;
      g.fillStyle(PALETTE.ink, 0.15).fillRoundedRect(x + 2, y + 4, 300, h, 12);
      g.fillStyle(big ? 0xfffaf0 : 0xfff3d6, 0.95).fillRoundedRect(x, y, 300, h, 12);
      g.lineStyle(big ? 3 : 2, PALETTE.ink, 0.9).strokeRoundedRect(x, y, 300, h, 12);
      if (e.availableNow) {
        g.fillStyle(PALETTE.coral, 1).fillCircle(x + 286, y + 14, 7);
      }
      y += h + 8;
    });
    c.add(parts);
    this.tracker = c;
  }

  /** world position of the money label (for coin fly-in effects) */
  moneyPos() {
    return { x: this.money.x + 60, y: this.money.y + 14 };
  }
}
