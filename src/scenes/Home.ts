import Phaser from 'phaser';
import { PALETTE, FONT_TITLE, FONT_HAND } from '../art/palette';
import { addSprite } from '../art/manifest';
import { ambientWaves, music, sfx } from '../audio/sfx';
import { G } from '../core/game';
import { initView } from '../core/view';
import { weekdayIndex } from '../core/calendar';
import { dueNow } from '../systems/economy';
import { curiosityDef } from '../data/catch';
import { STATEMENTS } from '../data/caseWall';
import { letterDef } from '../data/letters';
import { GROUND_TIPS, LOGBOOK_ENTRIES, logbookPages, syncLogbook } from '../data/logbook';
import { GROUND_NAMES } from '../data/groundNames';
import { burnLetter, canOpenLetterTonight, letterLook, lettersAllowedTonight, nextLetterNumber, readLetter } from '../systems/letters';
import { questButtons } from '../ui/questButtons';
import { Button, panel } from '../ui/Button';
import { choose, DialogueBox, Toasts } from '../ui/Dialogue';
import { Hud } from '../ui/Hud';
import { showLetter } from '../ui/overlays';
import { Stage } from '../ui/Stage';
import { txt } from '../ui/text';
import { endSegment } from './director';
import type { GroundId } from '../core/types';

/** Evening at home: Dad's letters, the trial file wall, the logbook, the shelf, sleep. */
export class HomeScene extends Phaser.Scene {
  private dlg!: DialogueBox;
  private toasts!: Toasts;
  private busy = false;

  constructor() {
    super('Home');
  }

  create() {
    initView(this);
    const s = G.state;
    this.busy = false;
    this.cameras.main.fadeIn(350, 21, 18, 31);
    ambientWaves(false);
    music('evening');
    const stage = new Stage(this, 'evening');
    stage.setBackdrop('homeNight', 'evening');
    stage.place('eli', { x: 640, y: 600 });
    new Hud(this);
    this.dlg = new DialogueBox(this);
    this.toasts = new Toasts(this);
    txt(this, 300, 330, '저녁 · 집', { size: 28, fontFamily: FONT_TITLE, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 6 }).setOrigin(0.5).setDepth(60);

    // shelf: curiosities from the net
    s.curiosities.slice(0, 12).forEach((id, i) => {
      const x = 920 + (i % 6) * 44;
      const y = i < 6 ? 140 : 250;
      addSprite(this, x, y, `it_${id}`, 0.9).setOrigin(0.5, 1).setDepth(45);
    });

    const hot = (x: number, y: number, w: number, h: number, label: string, fn: () => void) => {
      const z = this.add.zone(x, y, w, h).setOrigin(0).setDepth(50).setInteractive({ useHandCursor: true });
      const glow = this.add.graphics().setDepth(49);
      z.on('pointerover', () => {
        glow.clear().lineStyle(4, PALETTE.butter, 0.9).strokeRoundedRect(x - 4, y - 4, w + 8, h + 8, 12);
        tip.setVisible(true);
      });
      z.on('pointerout', () => {
        glow.clear();
        tip.setVisible(false);
      });
      z.on('pointerdown', () => !this.busy && fn());
      const tip = txt(this, x + w / 2, y - 16, label, { size: 18, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 5 })
        .setOrigin(0.5)
        .setDepth(51)
        .setVisible(false);
    };

    if (s.flags.letterBoxFound) {
      const box = addSprite(this, 360, 450, 'prop_letterbox', 1).setDepth(46);
      if (canOpenLetterTonight(s)) this.tweens.add({ targets: box, y: 444, duration: 600, yoyo: true, repeat: -1 });
      hot(290, 400, 140, 80, '아버지 편지 상자', () => void this.letters());
    }
    if (s.flags.trialFile) hot(470, 60, 330, 250, '재판 기록 (벽)', () => this.caseWall());
    if (s.flags.logbookFound) {
      addSprite(this, 1150, 120, 'prop_logbook', 0.7).setDepth(46);
      hot(1110, 70, 80, 80, '아버지의 항해 일지', () => this.logbook());
    }
    hot(900, 90, 280, 180, '선반', () => this.shelf());

    questButtons(this, 'home', 'evening', 1120, 580, 'Home', () => !this.busy);
    new Button(this, 1120, 660, '잠자리에 든다', () => this.sleep(), { w: 240, h: 56, fill: PALETTE.lilac, sub: '하루를 마치고 자동 저장' }).setDepth(700);
    if (s.flags.letterBoxFound) {
      const left = lettersAllowedTonight(s) - s.lettersToday;
      txt(this, 80, 640, nextLetterNumber(s) === null ? '상자에 남은 편지가 없다.' : left > 0 ? `오늘 밤 열 수 있는 편지: ${left}통` : '오늘 밤 편지는 여기까지.', {
        size: 18,
        color: '#FFFAF0',
        stroke: '#3B3355',
        strokeThickness: 4,
      }).setDepth(60);
    }

    // [변경 1] Thursday night: "내일까지 180달러…"
    const short = dueNow(s) - s.money;
    if (weekdayIndex(s.day) === 5 && short > 0 && !s.flags[`thuWorry_${s.day}`]) {
      s.flags[`thuWorry_${s.day}`] = true;
      this.time.delayedCall(500, () => {
        this.busy = true;
        void this.dlg.show('think', `내일까지 ${Math.ceil(short)}달러…`).then(() => {
          this.dlg.hide();
          this.busy = false;
        });
      });
    }
    if (s.flags.firstLetterPending) {
      delete s.flags.firstLetterPending;
      this.time.delayedCall(500, () => void this.letters());
    }
  }

  private async letters() {
    const s = G.state;
    const n = nextLetterNumber(s);
    if (n === null) {
      this.toasts.show('상자에 남은 편지가 없다.', PALETTE.lilac);
      return;
    }
    if (!canOpenLetterTonight(s)) {
      this.busy = true;
      await this.dlg.show('think', '오늘은 여기까지. 한꺼번에 읽을 자신이 없다.');
      this.dlg.hide();
      this.busy = false;
      return;
    }
    const def = letterDef(n)!;
    this.busy = true;
    sfx('paper');
    await this.dlg.show('think', `${n}번째 봉투. ${def.date}. "수취인 불명 — 반송" 도장.`);
    this.dlg.hide();
    const pick = await choose(this, ['열어서 읽는다', '태운다', '오늘은 그냥 둔다']);
    if (pick === 0) {
      const msgs = readLetter(s, n);
      await showLetter(this, `${def.date} · 사형수 동 · 우편 검열`, def.body, letterLook(n));
      msgs.forEach((m) => this.toasts.show(m, PALETTE.lilac));
    } else if (pick === 1) {
      burnLetter(s, n);
      sfx('fire');
      const flame = this.add.image(360, 420, 'fx_sparkle').setTint(0xffa45c).setScale(3).setDepth(900);
      this.tweens.add({ targets: flame, alpha: 0, scale: 5, duration: 900, onComplete: () => flame.destroy() });
      await this.dlg.show('think', '종이는 금방 탔다. 상자 바닥에 재가 조금 남았다.');
      this.dlg.hide();
    }
    this.busy = false;
    this.scene.restart();
  }

  private overlay(title: string): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0).setDepth(1200);
    const shade = this.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.5).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    panel(g, 120, 50, 1040, 620, 0xfbf6e8, 16);
    c.add([shade, g]);
    c.add(txt(this, 640, 90, title, { size: 30, fontFamily: FONT_TITLE }).setOrigin(0.5));
    c.add(txt(this, 640, 646, '아무 데나 누르면 닫힌다', { size: 15, color: '#9a96a8' }).setOrigin(0.5));
    shade.on('pointerdown', () => c.destroy());
    return c;
  }

  private caseWall() {
    const c = this.overlay('주 대 월트 할로우 — 재판 기록');
    c.add(txt(this, 640, 128, '변호사가 남긴 서류. 공식 진술을 카드로 잘라 벽에 붙여 두었다.', { size: 17, color: '#6b6385' }).setOrigin(0.5));
    STATEMENTS.forEach((st, i) => {
      const x = 160 + (i % 3) * 330;
      const y = 160 + Math.floor(i / 3) * 150;
      const g = this.add.graphics();
      g.fillStyle(0xfffaf0, 1).fillRect(x, y, 300, 130).lineStyle(2, PALETTE.ink, 1).strokeRect(x, y, 300, 130);
      g.fillStyle(PALETTE.killerRed, 1).fillCircle(x + 150, y + 6, 6);
      c.add(g);
      c.add(txt(this, x + 12, y + 14, st.id, { size: 14, color: '#9a96a8' }));
      c.add(txt(this, x + 12, y + 36, st.text, { size: 17, wordWrap: { width: 276, useAdvancedWrap: true } }));
    });
  }

  private logbook() {
    const s = G.state;
    const fresh = syncLogbook(s);
    const c = this.overlay('메리 루 호 항해 일지');
    // pages: entries flow down and continue on the next page (◀ ▶)
    const TOP = 130;
    const BOTTOM = 600;
    const pages: Phaser.GameObjects.Container[] = [];
    let y = TOP;
    let page!: Phaser.GameObjects.Container;
    const newPage = () => {
      page = this.add.container(0, 0);
      c.add(page);
      pages.push(page);
      y = TOP;
    };
    newPage();
    const put = (t: Phaser.GameObjects.Text, gap: number): number => {
      if (y > TOP && y + t.height > BOTTOM) newPage();
      t.setY(y);
      page.add(t);
      const top = y;
      y += t.height + gap;
      return top;
    };
    for (const id of logbookPages(s)) {
      const e = LOGBOOK_ENTRIES[id];
      const t = txt(this, 170, 0, e.text, {
        size: 26,
        fontFamily: FONT_HAND,
        color: e.hand === 'walt' ? '#3a3a3a' : '#2d5fa8',
        wordWrap: { width: 920 },
      });
      const top = put(t, 10);
      if (s.logbookStruck.includes(id)) {
        const g = this.add.graphics();
        g.lineStyle(2.4, 0x2d5fa8, 1).lineBetween(166, top + 16, 170 + t.width + 4, top + 14);
        page.add(g);
      }
    }
    if (s.tips.length) {
      y += 8;
      put(txt(this, 170, 0, '— 어장 메모 —', { size: 18, color: '#6b6385' }), 12);
      for (const tip of s.tips) {
        const tt = txt(this, 170, 0, `${GROUND_NAMES[tip]}: ${GROUND_TIPS[tip as Exclude<GroundId, 'theSpot'>]}`, {
          size: 24,
          fontFamily: FONT_HAND,
          color: '#3a3a3a',
          wordWrap: { width: 920 },
        });
        put(tt, 6);
      }
    }
    if (pages.length > 1) {
      let cur = 0;
      const label = txt(this, 640, 618, '', { size: 17, color: '#6b6385' }).setOrigin(0.5);
      const show = () => {
        pages.forEach((p, i) => p.setVisible(i === cur));
        label.setText(`${cur + 1} / ${pages.length}`);
      };
      const prev = new Button(this, 540, 618, '◀', () => {
        cur = Math.max(0, cur - 1);
        show();
      }, { w: 56, h: 34, size: 18, fill: 0xfff3d6 });
      const next = new Button(this, 740, 618, '▶', () => {
        cur = Math.min(pages.length - 1, cur + 1);
        show();
      }, { w: 56, h: 34, size: 18, fill: 0xfff3d6 });
      c.add([label, prev, next]);
      show();
    }
    if (fresh.length) this.toasts.show(`일지를 더 읽었다 · 새로 ${fresh.length}쪽`, PALETTE.lilac);
  }

  private shelf() {
    const s = G.state;
    const c = this.overlay('그물에서 건진 물건들');
    if (!s.curiosities.length) {
      c.add(txt(this, 640, 300, '아직 아무것도 없다. 그물에 이상한 게 걸리면 챙김 상자에 넣자.', { size: 20, color: '#6b6385' }).setOrigin(0.5));
      return;
    }
    s.curiosities.forEach((id, i) => {
      const def = curiosityDef(id);
      const x = 180 + (i % 4) * 240;
      const y = 150 + Math.floor(i / 4) * 120;
      c.add(addSprite(this, x + 20, y + 30, `it_${id}`, 1.4));
      c.add(txt(this, x + 60, y + 6, def?.name ?? id, { size: 18 }));
      c.add(txt(this, x + 60, y + 32, def?.desc ?? '', { size: 14, color: '#6b6385', wordWrap: { width: 170 } }));
    });
  }

  private sleep() {
    if (this.busy) return;
    this.cameras.main.fadeOut(500, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => endSegment(this));
  }
}
