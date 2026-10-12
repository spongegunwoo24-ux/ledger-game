import Phaser from 'phaser';
import { PALETTE, FONT_TITLE, FONT_HAND } from '../art/palette';
import { drawBackdrop, addTint } from '../art/backdrops';
import { addSprite } from '../art/manifest';
import { ambientWaves, music, sfx } from '../audio/sfx';
import { TUNING } from '../config/tuning';
import { isSunday, moonOf, tideOf, weatherOf } from '../core/calendar';
import { G } from '../core/game';
import { initView } from '../core/view';
import { spend } from '../systems/economy';
import { Button, panel } from '../ui/Button';
import { DialogueBox, Toasts } from '../ui/Dialogue';
import { Hud } from '../ui/Hud';
import { runMinigame } from '../ui/minigames';
import { txt } from '../ui/text';
import { endSegment } from './director';

/** Dawn at the harbor: the board (tide/moon/weather), Calvin's boat, then go out. */
export class HarborScene extends Phaser.Scene {
  private dlg!: DialogueBox;
  private toasts!: Toasts;
  private busy = false;

  constructor() {
    super('Harbor');
  }

  create() {
    initView(this);
    const s = G.state;
    this.busy = false;
    this.cameras.main.fadeIn(400, 21, 18, 31);
    ambientWaves(true, 0.06);
    music('dawn');
    drawBackdrop(this, 'dock', { seg: 'dawn' });
    // hull graffiti on Mary Lou (berth sprite is at x=320,y=420 scale .8)
    if (s.flags.graffiti) {
      txt(this, 290, 400, 'KILLER', { size: 34, fontFamily: FONT_TITLE, color: '#D7263D' }).setAngle(-3).setDepth(2);
    } else if (s.flags.paintedOver === 'cheap' && weatherOf(s.day, s.seed) === '맑음') {
      txt(this, 290, 400, 'KILLER', { size: 34, fontFamily: FONT_TITLE, color: '#D7263D' }).setAngle(-3).setAlpha(0.13).setDepth(2);
    }
    if (s.flags.sorry) {
      txt(this, 410, 420, 'sorry', { size: 16, fontFamily: FONT_HAND, color: '#3B3355' }).setAngle(-2).setDepth(2);
    }
    addTint(this, 'dawn', 40);

    // Calvin's boat going out (D01): deeper going out; on Day 45 visibly deeper.
    if (s.day > 1) this.calvinBoat();

    new Hud(this);
    this.dlg = new DialogueBox(this);
    this.toasts = new Toasts(this);

    // the harbor board
    const bg = this.add.graphics().setDepth(60);
    panel(bg, 880, 110, 360, 250, 0x3b4a5c, 14);
    const w = weatherOf(s.day, s.seed);
    txt(this, 1060, 140, '오늘의 바다', { size: 24, fontFamily: FONT_TITLE, color: '#FFE29A' }).setOrigin(0.5).setDepth(61);
    const rows: [string, string][] = [
      ['물때', tideOf(s.day, s.seed)],
      ['달', moonOf(s.day)],
      ['날씨', w],
    ];
    rows.forEach(([a, b], i) => {
      txt(this, 910, 180 + i * 48, a, { size: 22, fontFamily: FONT_HAND, color: '#F5E3B3' }).setDepth(61);
      txt(this, 1210, 178 + i * 48, b, { size: 28, fontFamily: FONT_HAND, color: '#FFFAF0' }).setOrigin(1, 0).setDepth(61);
    });
    txt(this, 1060, 330, '분필 글씨는 듀이가 매일 새벽 고쳐 쓴다', { size: 13, color: '#B9B4C7' }).setOrigin(0.5).setDepth(61);

    // buttons
    const sunday = isSunday(s.day);
    const go = new Button(this, 640, 640, '출항하기', () => this.goOut(), { w: 280, h: 62, size: 26, fill: PALETTE.coral, sub: '바다 지도' });
    go.setDepth(70);
    let bx = 340;
    if (sunday) {
      new Button(this, 300, 640, '쉬는 날 · 성당 가기', () => this.restDay(), { w: 280, h: 62, size: 21, fill: PALETTE.lilac, sub: '일요일' }).setDepth(70);
      bx = 980;
    }
    if (s.netTorn) {
      new Button(this, bx, 640, `그물 즉시 수선 $${TUNING.costs.netRepair}`, () => this.repairNow(), { w: 280, h: 62, size: 20, fill: PALETTE.butter, sub: '아니면 오후에 부두에서 직접' }).setDepth(70);
    }
    if (s.flags.graffiti) {
      new Button(this, sunday || s.netTorn ? 980 : 980, 560, '낙서 덮어 칠하기', () => this.repaint(), { w: 260, h: 54, size: 20, fill: PALETTE.mint }).setDepth(70);
    }
  }

  private calvinBoat() {
    const s = G.state;
    const deeper = s.day === 45;
    const boat = addSprite(this, 720, 392, 'boat_calvin', 0.62).setOrigin(0.5, 0.75).setDepth(3);
    // sits low in the water going out (the wave strip covers more of the hull)
    boat.y += deeper ? 16 : 8;
    const water = this.add.graphics().setDepth(4);
    water.fillStyle(PALETTE.sea, 1);
    water.beginPath();
    water.moveTo(-90, 0);
    for (let x = -90; x <= 90; x += 15) water.lineTo(x, Math.sin(x / 9) * 2.5);
    water.lineTo(90, 30);
    water.lineTo(-90, 30);
    water.closePath();
    water.fillPath();
    water.lineStyle(2, 0xffffff, 0.8);
    water.beginPath();
    for (let x = -90; x <= 90; x += 15) {
      if (x === -90) water.moveTo(x, Math.sin(x / 9) * 2.5);
      else water.lineTo(x, Math.sin(x / 9) * 2.5);
    }
    water.strokePath();
    water.setPosition(720, 398);
    boat.setInteractive({ useHandCursor: true });
    const tw = this.tweens.add({ targets: [boat, water], x: '+=700', duration: 26000, delay: 2500, ease: 'Sine.In' });
    this.tweens.add({ targets: boat, angle: { from: -1, to: 1 }, duration: 1300, yoyo: true, repeat: -1 });
    boat.on('pointerdown', () => {
      if (this.busy) return;
      tw.pause();
      this.busy = true;
      const lines = deeper
        ? ['캘빈 씨 배가 오늘따라 물에 깊이 잠겨 있다. 뱃전이 거의 물에 닿을 것 같다.', '나갈 때 저렇게 무거우면, 대체 뭘 싣고 나가는 걸까.']
        : ['캘빈 씨 배다. 매일 이 시간에 나간다.', '나갈 땐 배가 물에 깊이 잠겨 있다. 낚시 도구가 많은가. 들어올 땐 가볍게 떠 있던데.'];
      void (async () => {
        for (const l of lines) await this.dlg.show('think', l);
        this.dlg.hide();
        s.flags.sawCalvinBoat = true;
        if (deeper && !s.evidence.includes('E_CALVIN_BOAT_DEPTH')) {
          s.evidence.push('E_CALVIN_BOAT_DEPTH');
          this.toasts.show('일지에 적었다: 나갈 때 더 무거운 배', PALETTE.lilac);
        }
        this.busy = false;
        tw.resume();
      })();
    });
  }

  private goOut() {
    if (this.busy) return;
    this.scene.start('SeaMap');
  }

  private restDay() {
    if (this.busy) return;
    const s = G.state;
    s.flags.churchToday = true;
    s.flags.restDay = true;
    sfx('bell');
    this.cameras.main.fadeOut(400, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => endSegment(this));
  }

  private repairNow() {
    if (this.busy) return;
    const s = G.state;
    if (!spend(s, TUNING.costs.netRepair)) {
      this.toasts.show('돈이 모자라다. 오후에 부두에서 직접 꿰매자.', PALETTE.coral);
      return;
    }
    s.netTorn = false;
    sfx('cash');
    this.toasts.show('듀이가 아는 그물집에 맡겼다. 새것 같다.');
    this.scene.restart();
  }

  private repaint() {
    if (this.busy) return;
    this.busy = true;
    void runMinigame(this, 'paint', { word: 'KILLER' }).then(() => {
      const s = G.state;
      delete s.flags.graffiti;
      if (s.flags.paintedOver !== 'good') s.flags.paintedOver = 'cheap';
      this.busy = false;
      this.scene.restart();
    });
  }
}
