import Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { drawBackdrop, addTint } from '../art/backdrops';
import { addSprite } from '../art/manifest';
import { ambientWaves, music, sfx } from '../audio/sfx';
import { weekOf } from '../core/calendar';
import { G } from '../core/game';
import { pick, makeRng, hash32 } from '../core/rng';
import { holdIsEmpty } from '../core/state';
import { initView } from '../core/view';
import { CHAR_NAMES } from '../data/names';
import { executeSale, quoteSale, type Seller } from '../systems/economy';
import { feel } from '../systems/feelings';
import { Bubble } from '../ui/Bubble';
import { Button, panel } from '../ui/Button';
import { Toasts } from '../ui/Dialogue';
import { Hud } from '../ui/Hud';
import { txt } from '../ui/text';
import { endSegment } from './director';

const DEWEY_LINES = [
  '오늘도 왔네! 저울에 올려.',
  '새우는 새우지. 자, 무게 보자.',
  '깡통 공장은 배가 고파. 매일매일.',
  '라디오에서 오늘 덥대. 얼음 더 넣어.',
  '자네 손이 빨라졌어. 새우가 덜 뭉개졌네.',
  '어제 누가 자네 얘기 하더라. 신경 쓰지 마. 난 안 들었어.',
  '이 정도면 트럭이 웃겠어.',
];

/** Morning: sell the catch. Cannery truck (base), fish market (×2, gated), Rosa (×2, max 30 lb, Rosa ≥ 60). */
export class MarketScene extends Phaser.Scene {
  private hud!: Hud;
  private toasts!: Toasts;
  private bubble!: Bubble;
  private panelC: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('Market');
  }

  create() {
    initView(this);
    const s = G.state;
    this.panelC = null;
    if (holdIsEmpty(s.hold)) {
      // nothing to sell: move straight on
      this.time.delayedCall(0, () => endSegment(this));
      return;
    }
    this.cameras.main.fadeIn(350, 21, 18, 31);
    ambientWaves(true, 0.04);
    music('town');
    drawBackdrop(this, 'dock', { seg: 'morning' });
    // Dewey's cannery truck
    const tg = this.add.graphics().setDepth(5);
    tg.fillStyle(0xffffff, 1).fillRoundedRect(820, 330, 300, 170, 14).lineStyle(4, PALETTE.ink, 1).strokeRoundedRect(820, 330, 300, 170, 14);
    tg.fillStyle(PALETTE.coral, 1).fillRoundedRect(1110, 380, 120, 120, 14).lineStyle(4, PALETTE.ink, 1).strokeRoundedRect(1110, 380, 120, 120, 14);
    tg.fillStyle(0xbfe8f2, 1).fillRoundedRect(1150, 395, 60, 40, 6);
    tg.fillStyle(0x46506e, 1).fillCircle(880, 505, 26).fillCircle(1170, 505, 26);
    tg.fillStyle(0xd9d4e3, 1).fillCircle(880, 505, 10).fillCircle(1170, 505, 10);
    txt(this, 970, 380, '걸프 통조림', { size: 26, fontFamily: FONT_TITLE, color: '#3B3355' }).setOrigin(0.5).setDepth(6);
    txt(this, 970, 420, '새우 · 게 매일 매입', { size: 16, color: '#6b6385' }).setOrigin(0.5).setDepth(6);
    addSprite(this, 760, 560, 'ch_dewey', 1.4).setOrigin(0.5, 0.95).setDepth(7);
    addSprite(this, 470, 580, 'ch_eli', 1.4).setOrigin(0.5, 0.95).setDepth(7);
    // Calvin's boat back from "his place", riding high and light (D01)
    if (s.day > 1 && s.day < 67) {
      const cb = addSprite(this, 640, 372, 'boat_calvin', 0.6).setOrigin(0.5, 0.75).setDepth(3).setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: cb, angle: { from: -1.5, to: 1.5 }, y: 368, duration: 1400, yoyo: true, repeat: -1 });
      cb.on('pointerdown', () => this.bubble.say(640, 300, '일라이: 캘빈 씨 배. 아침엔 가볍게 떠 있다. 새벽엔 그렇게 무거워 보이더니.', 3200));
    }
    addTint(this, 'morning', 40);
    this.hud = new Hud(this);
    this.toasts = new Toasts(this);
    this.bubble = new Bubble(this, 760);
    const rng = makeRng(hash32(s.seed, 'dewey', s.day));
    this.time.delayedCall(400, () => this.bubble.say(760, 360, `${CHAR_NAMES.dewey}: ${pick(rng, DEWEY_LINES)}`, 3000));
    this.buildPanel();
  }

  private marketOpen(): { ok: boolean; why: string } {
    const s = G.state;
    if (s.flags.marketOpen) return { ok: true, why: '' };
    if (s.day > 60) return { ok: true, why: '' };
    if (weekOf(s.day) >= 6 && feel(s, 'fishermen') >= 40) return { ok: true, why: '' };
    return { ok: false, why: '"살인마 새우는 안 받아."' };
  }

  private buildPanel() {
    this.panelC?.destroy();
    const s = G.state;
    const c = this.add.container(0, 0).setDepth(100);
    const g = this.add.graphics();
    panel(g, 40, 100, 470, 470, 0xfffaf0, 20);
    c.add(g);
    c.add(txt(this, 275, 132, '오늘 팔 것', { size: 28, fontFamily: FONT_TITLE }).setOrigin(0.5));
    const h = s.hold;
    const rows: [string, string][] = [
      ['새우 소', `${h.small.toFixed(1)} lb`],
      ['새우 중', `${h.medium.toFixed(1)} lb`],
      ['새우 대', `${h.large.toFixed(1)} lb`],
      ['게', `${h.crabs}마리`],
    ];
    rows.forEach(([a, b], i) => {
      c.add(txt(this, 80, 170 + i * 36, a, { size: 21 }));
      c.add(txt(this, 470, 170 + i * 36, b, { size: 21, color: '#2d5fa8' }).setOrigin(1, 0));
    });
    const empty = holdIsEmpty(h);
    const cannery = quoteSale(s, 'cannery');
    const market = quoteSale(s, 'market');
    const rosa = quoteSale(s, 'rosa');
    const mk = this.marketOpen();
    const rosaOk = feel(s, 'rosa') >= 60 && rosa.total > 0;
    let y = 340;
    const b1 = new Button(this, 275, y, `듀이 트럭에 팔기  $${cannery.total.toFixed(2)}`, () => this.sell('cannery'), {
      w: 400,
      h: 54,
      size: 20,
      fill: PALETTE.butter,
      disabled: empty,
      sub: cannery.oversupplyLbs > 0 ? '이번 주 너무 많이 팔아서 값이 조금 내렸다' : undefined,
    });
    c.add(b1);
    y += 66;
    const b2 = new Button(this, 275, y, mk.ok ? `어시장에 팔기  $${market.total.toFixed(2)}` : `어시장  ${mk.why}`, () => this.sell('market'), {
      w: 400,
      h: 54,
      size: 20,
      fill: PALETTE.mint,
      disabled: empty || !mk.ok,
    });
    c.add(b2);
    y += 66;
    if (feel(s, 'rosa') >= 60) {
      const b3 = new Button(this, 275, y, `로사 식당 납품  $${rosa.total.toFixed(2)}`, () => this.sell('rosa'), {
        w: 400,
        h: 54,
        size: 20,
        fill: PALETTE.peach,
        disabled: empty || !rosaOk,
        sub: '하루 30 lb까지, 게는 안 받음',
      });
      c.add(b3);
    }
    const next = new Button(this, 1100, 640, empty ? '오후로 →' : '안 팔고 오후로 →', () => this.leave(), { w: 240, h: 54, fill: empty ? PALETTE.coral : 0xfff3d6 });
    c.add(next);
    if (!empty) c.add(txt(this, 1100, 600, '안 판 새우는 내일까지 얼음에 둔다', { size: 14, color: '#FFFAF0' }).setOrigin(0.5));
    this.panelC = c;
  }

  private sell(seller: Seller) {
    const s = G.state;
    const q = quoteSale(s, seller);
    if (q.total <= 0) return;
    const got = executeSale(s, q);
    // fuel bought on credit is paid back from the first sale
    const credit = Number(s.flags.fuelCredit) || 0;
    if (credit > 0) {
      const pay = Math.min(credit, s.money);
      s.money = Math.round((s.money - pay) * 100) / 100;
      s.flags.fuelCredit = credit - pay;
      if (pay > 0) this.toasts.show(`외상 기름값 -$${pay}`, PALETTE.peach);
    }
    sfx('cash');
    // coins fly to the money counter
    const to = this.hud.moneyPos();
    for (let i = 0; i < Math.min(14, 4 + Math.floor(got / 10)); i++) {
      const coin = this.add.image(760 + Math.random() * 60, 420 + Math.random() * 60, 'fx_coin').setDepth(900);
      this.tweens.add({
        targets: coin,
        x: to.x,
        y: to.y,
        duration: 500 + i * 45,
        ease: 'Cubic.In',
        onComplete: () => {
          coin.destroy();
          if (i % 3 === 0) sfx('clink');
        },
      });
    }
    this.time.delayedCall(550, () => this.hud.refresh());
    this.toasts.show(`+$${got.toFixed(2)}`, PALETTE.butter);
    if (seller === 'rosa') this.bubble.say(760, 360, '로사: …오늘 것도 괜찮네. 내일도 가져와.', 2600);
    if (seller === 'market') this.bubble.say(760, 360, '어시장: 무게 재고. 됐어. 다음.', 2200);
    this.buildPanel();
  }

  private leave() {
    this.cameras.main.fadeOut(350, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => endSegment(this));
  }
}
