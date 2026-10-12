import Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { dayLabel, SEGMENT_CLOCK, SEGMENT_LABEL, moonOf, tideOf, weatherOf } from '../core/calendar';
import { G } from '../core/game';
import { Button, panel } from './Button';
import { openNotebook } from './Notebook';
import { txt } from './text';

const WEATHER_ICON: Record<string, string> = { 맑음: '☀', 흐림: '☁', 비: '☂', 바람: '༄', 폭풍: '⚡' };

/** Top bar: day / segment / weather on the left, money and debt on the right. */
export class Hud {
  c: Phaser.GameObjects.Container;
  private money: Phaser.GameObjects.Text;
  private debt: Phaser.GameObjects.Text;
  private shownMoney: number;

  constructor(
    private scene: Phaser.Scene,
    opts: { notebook?: boolean; pause?: boolean } = {},
  ) {
    const s = G.state;
    this.c = scene.add.container(0, 0).setDepth(800);
    const g = scene.add.graphics();
    panel(g, 12, 10, 470, 64, 0xfffaf0, 18, 0.95);
    panel(g, 920, 10, 348, 64, 0xfffaf0, 18, 0.95);
    this.c.add(g);
    this.c.add(
      txt(scene, 32, 20, `${dayLabel(s.day)} · ${SEGMENT_LABEL[s.segment]} ${SEGMENT_CLOCK[s.segment]}`, { size: 19 }),
    );
    const w = weatherOf(s.day, s.seed);
    this.c.add(
      txt(scene, 32, 46, `${WEATHER_ICON[w] ?? ''} ${w} · ${tideOf(s.day, s.seed)} · ${moonOf(s.day)}달`, { size: 16, color: '#6b6385' }),
    );
    this.shownMoney = s.money;
    this.money = txt(scene, 940, 18, `$${s.money.toFixed(2)}`, { size: 26, fontFamily: FONT_TITLE, color: '#3B3355' });
    this.debt = txt(scene, 940, 50, '', { size: 15, color: '#6b6385' });
    this.c.add([this.money, this.debt]);
    this.refresh();
    if (opts.notebook !== false) {
      const nb = new Button(scene, 1160, 42, '수첩', () => openNotebook(scene), { w: 92, h: 44, size: 20, fill: PALETTE.mint });
      this.c.add(nb);
    }
    if (opts.pause !== false) {
      const pb = new Button(scene, 540, 42, '≡', () => scene.scene.launch('Pause', { from: scene.scene.key }), {
        w: 52,
        h: 44,
        size: 24,
        fill: 0xfff3d6,
      });
      this.c.add(pb);
      scene.input.keyboard?.on('keydown-ESC', () => {
        if (!scene.scene.isActive('Pause')) scene.scene.launch('Pause', { from: scene.scene.key });
      });
    }
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
      this.scene.tweens.add({ targets: this.money, scale: 1.12, yoyo: true, duration: 140 });
      this.shownMoney = target;
    } else {
      this.money.setText(`$${target.toFixed(2)}`);
    }
    this.debt.setText(s.debt > 0 ? `남은 빚 $${s.debt.toFixed(0)}` : '빚 없음 · 메리 루는 내 배');
  }

  /** world position of the money label (for coin fly-in effects) */
  moneyPos() {
    return { x: this.money.x + 60, y: this.money.y + 14 };
  }
}
