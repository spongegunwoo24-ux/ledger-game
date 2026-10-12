import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { PALETTE, FONT_TITLE, FONT_HAND } from '../art/palette';
import { music, sfx } from '../audio/sfx';
import { dayLabel, isFriday, weekOf } from '../core/calendar';
import { autosave, G, saveFriday } from '../core/game';
import { initView } from '../core/view';
import { applyOvernight } from '../systems/overnight';
import { Button, panel } from '../ui/Button';
import { txt } from '../ui/text';
import { enterSegment } from './director';

/** Night: day summary (weekly summary on Fridays), then sleep → overnight changes → autosave. */
export class SummaryScene extends Phaser.Scene {
  constructor() {
    super('Summary');
  }

  create() {
    initView(this);
    const s = G.state;
    this.cameras.main.fadeIn(500, 21, 18, 31);
    music(null);
    const g = this.add.graphics();
    g.fillGradientStyle(0x1d2550, 0x1d2550, 0x3d4a7a, 0x3d4a7a, 1).fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 60; i++) g.fillStyle(0xfff3d6, 0.7).fillCircle((i * 211) % 1280, (i * 97) % 400, 1.6);
    this.add.circle(1080, 120, 34, 0xfff3d6);
    this.add.circle(1094, 110, 30, 0x1d2550);
    const weekly = isFriday(s.day);
    const p = this.add.graphics();
    panel(p, 300, 70, 680, weekly ? 590 : 420, 0xfbf6e8, 20);
    txt(this, 640, 112, `${dayLabel(s.day)} · 밤`, { size: 30, fontFamily: FONT_TITLE }).setOrigin(0.5);
    const rows: [string, string][] = [
      ['오늘 번 돈', `$${s.today.earned.toFixed(2)}`],
      ['오늘 잡은 새우', `${s.today.lbsCaught.toFixed(1)} lb`],
      ['장부가 훔친 새우', `${s.today.stolen}마리`],
      ['오늘 밤 생활비 (먹을 것·전기·물)', `-$${Math.min(Math.max(0, s.money), TUNING.costs.living).toFixed(2)}`],
      ['가진 돈', `$${s.money.toFixed(2)}`],
      ['남은 빚', `$${s.debt.toFixed(0)}`],
    ];
    rows.forEach(([a, b], i) => {
      txt(this, 360, 150 + i * 32, a, { size: 21 });
      txt(this, 920, 150 + i * 32, b, { size: 21, color: '#2d5fa8' }).setOrigin(1, 0);
    });
    let y = 150 + rows.length * 32 + 10;
    if (weekly) {
      txt(this, 640, y, `— ${weekOf(s.day)}주차 정산 —`, { size: 22, fontFamily: FONT_TITLE, color: '#b04a52' }).setOrigin(0.5, 0);
      y += 36;
      const w = s.week;
      const wr: [string, string][] = [
        ['이번 주 번 돈', `$${w.earned.toFixed(2)}`],
        ['은행에 낸 돈', `$${w.paid.toFixed(2)}`],
        ['쓴 돈', `$${w.spent.toFixed(2)}`],
        ['장부가 훔친 새우', `${w.stolen}마리`],
        ['구한 바다거북', `${w.turtlesSaved}마리`],
      ];
      wr.forEach(([a, b], i) => {
        txt(this, 360, y + i * 32, a, { size: 20 });
        txt(this, 920, y + i * 32, b, { size: 20, color: '#2d5fa8' }).setOrigin(1, 0);
      });
      y += wr.length * 32 + 4;
      const stolenNote = w.stolen === 0 ? '장부가 이번 주엔 한 마리도 못 훔쳤다. 녀석, 삐졌을 거다.' : w.stolen > 20 ? '장부는 이번 주에 아주 잘 먹었다.' : '장부는 이번 주에도 일한 만큼 먹었다.';
      txt(this, 640, y, stolenNote, { size: 22, fontFamily: FONT_HAND, color: '#6b6385' }).setOrigin(0.5, 0);
      y += 40;
    }
    new Button(this, 640, weekly ? 612 : 445, '잠들기', () => this.sleep(), { w: 260, h: 58, fill: PALETTE.lilac, sub: '자동 저장' });
  }

  private sleep() {
    const s = G.state;
    sfx('chime');
    applyOvernight(s);
    autosave();
    if (isFriday(s.day)) saveFriday();
    this.cameras.main.fadeOut(700, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => enterSegment(this));
  }
}
