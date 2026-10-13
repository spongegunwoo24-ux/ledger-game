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
import { executeSale, quoteSale, type SaleSelection, type Seller } from '../systems/economy';
import { TUNING } from '../config/tuning';
import { openInventory } from '../ui/Inventory';
import { fillOrder, isAnonymous, orderDone, orderLabel, orderValue, todaysOrders, type Order } from '../systems/board';
import { questButtons } from '../ui/questButtons';
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

/** Morning: sell the catch from the inventory. Cannery truck (base), fish market (×1.5, gated), Rosa (×1.6, shrimp only, max 30 lb, Rosa ≥ 60). */
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

  /** [변경 2] shrimp, crabs and golden shrimp are sold together; fish are picked from the bag */
  private buildPanel() {
    this.panelC?.destroy();
    const s = G.state;
    const c = this.add.container(0, 0).setDepth(100);
    const g = this.add.graphics();
    panel(g, 40, 100, 500, 560, 0xfffaf0, 20);
    c.add(g);
    c.add(txt(this, 290, 132, '오늘 팔 것', { size: 28, fontFamily: FONT_TITLE }).setOrigin(0.5));
    const h = s.hold;
    const rows: [string, string][] = [
      ['새우 소', `${h.small.toFixed(1)} lb`],
      ['새우 중', `${h.medium.toFixed(1)} lb`],
      ['새우 대', `${h.large.toFixed(1)} lb`],
      ['게', `${h.crabs}마리`],
    ];
    if (h.golden) rows.push(['황금 새우', `${h.golden}마리`]);
    if (h.bonus > 0) rows.push(['콤보·신선도 보너스', `+$${h.bonus.toFixed(2)}`]);
    rows.forEach(([a, b], i) => {
      c.add(txt(this, 80, 168 + i * 30, a, { size: 19 }));
      c.add(txt(this, 500, 168 + i * 30, b, { size: 19, color: '#2d5fa8' }).setOrigin(1, 0));
    });
    const shrimpOnly = { fish: [] as number[] };
    const cannery = quoteSale(s, 'cannery', shrimpOnly);
    const market = quoteSale(s, 'market', shrimpOnly);
    const rosa = quoteSale(s, 'rosa', shrimpOnly);
    const mk = this.marketOpen();
    let y = 168 + rows.length * 30 + 30;
    c.add(
      new Button(this, 290, y, `새우·게 듀이 트럭에  $${cannery.total.toFixed(2)}`, () => this.sell('cannery'), {
        w: 430,
        h: 50,
        size: 19,
        fill: PALETTE.butter,
        disabled: cannery.total <= 0,
        sub: cannery.oversupplyLbs > 0 ? '이번 주 너무 많이 팔아서 값이 조금 내렸다' : undefined,
      }),
    );
    y += 60;
    c.add(
      new Button(this, 290, y, mk.ok ? `새우·게 어시장에 (×${TUNING.prices.marketMultiplier})  $${market.total.toFixed(2)}` : `어시장  ${mk.why}`, () => this.sell('market'), {
        w: 430,
        h: 50,
        size: 19,
        fill: PALETTE.mint,
        disabled: !mk.ok || market.total <= 0,
      }),
    );
    y += 60;
    if (feel(s, 'rosa') >= 60) {
      c.add(
        new Button(this, 290, y, `새우 로사 식당에  $${rosa.total.toFixed(2)}`, () => this.sell('rosa'), {
          w: 430,
          h: 50,
          size: 19,
          fill: PALETTE.peach,
          disabled: rosa.total <= 0,
          sub: '하루 30 lb까지, 게는 안 받음',
        }),
      );
      y += 60;
    }
    // fish: the bag
    const fishN = h.fish.length;
    c.add(
      new Button(this, 290, Math.max(y + 10, 600), fishN ? `물고기 팔기 · 가방 열기 (${fishN}마리)` : '물고기 없음', () => this.openBag(), {
        w: 430,
        h: 54,
        size: 20,
        fill: 0xdbe8ff,
        disabled: !fishN,
      }),
    );
    const empty = holdIsEmpty(h);
    for (const b of questButtons(this, 'dock', 'morning', 1100, 540, 'Market')) c.add(b);
    // [변경 2] today's orders from the harbor board
    const orders = todaysOrders(s);
    if (orders.length) {
      const og = this.add.graphics();
      panel(og, 568, 96, 370, 70 + orders.length * 62, 0xfffaf0, 16, 0.96);
      c.add(og);
      c.add(txt(this, 753, 120, '오늘의 주문 (게시판)', { size: 19, fontFamily: FONT_TITLE }).setOrigin(0.5));
      orders.forEach((o, i) => {
        const done = orderDone(s, o);
        const v = orderValue(s, o);
        const anon = isAnonymous(s, o);
        const label = done ? `${o.from}: 납품함` : `${o.from} · ${orderLabel(o)}`;
        c.add(
          new Button(this, 753, 172 + i * 62, label, () => this.fill(o), {
            w: 340,
            h: 52,
            size: 16,
            fill: done ? 0xe9e0f7 : PALETTE.mint,
            disabled: done || v === null,
            sub: done ? undefined : v === null ? '어창에 없다' : `$${v.toFixed(2)}${anon ? ' · 듀이 편에 익명으로' : ' (웃돈 포함)'}`,
          }),
        );
      });
    }
    const next = new Button(this, 1100, 640, empty ? '오후로 →' : '남은 건 두고 오후로 →', () => this.leave(), { w: 260, h: 54, size: 19, fill: empty ? PALETTE.coral : 0xfff3d6 });
    c.add(next);
    if (!empty) c.add(txt(this, 1100, 600, '안 판 건 얼음에 둔다. 생선은 하루마다 값이 떨어진다.', { size: 14, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 3 }).setOrigin(0.5));
    this.panelC = c;
  }

  private fill(o: Order) {
    const s = G.state;
    const anon = isAnonymous(s, o);
    const got = fillOrder(s, o);
    if (got <= 0) return;
    sfx('cash');
    this.toasts.show(`주문 납품 +$${got.toFixed(2)}`, PALETTE.butter);
    this.time.delayedCall(300, () => this.hud.refresh());
    if (anon) this.bubble.say(760, 360, '듀이: 누가 보냈는지는 내가 까먹을게.', 2600);
    else if (o.who === 'rosa') this.bubble.say(760, 360, '듀이: 로사한테 갖다줄게. 표정은 장담 못 해.', 2600);
    this.buildPanel();
  }

  private openBag() {
    const s = G.state;
    const to: Seller = this.marketOpen().ok ? 'market' : 'cannery';
    openInventory(this, s, {
      sellTo: to,
      sellLabel: to === 'market' ? `어시장에 판다 (×${TUNING.prices.marketMultiplier})` : '듀이 트럭에 판다',
      onSell: (uids) => this.sell(to, { small: false, medium: false, large: false, crabs: false, golden: false, fish: uids }),
    });
  }

  private sell(seller: Seller, sel: SaleSelection = { fish: [] }) {
    const s = G.state;
    const q = quoteSale(s, seller, sel);
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
