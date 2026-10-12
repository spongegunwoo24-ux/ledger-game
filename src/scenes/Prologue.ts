import Phaser from 'phaser';
import { PALETTE, SHADE, FONT_TITLE, FONT_HAND, CSS } from '../art/palette';
import { addSprite } from '../art/manifest';
import { charTexKey } from '../art/characters';
import { TEX_SCALE } from '../art/pen';
import { ambientWaves, music, sfx } from '../audio/sfx';
import { initView } from '../core/view';
import { onKey } from '../core/keys';
import { Button, panel } from '../ui/Button';
import { txt } from '../ui/text';
import { enterSegment } from './director';

/** [변경 1] Prologue picture book: 8 pages, one picture + one sentence each. Skippable. */
const PAGES: string[] = [
  '일라이 할로우, 서른두 살. 직업 없음. 오늘도 친구 집 소파.',
  '10년 만에 고향에서 전화가 왔다.',
  '펠리컨 코브 연쇄 실종 사건 범인, 오늘 사형 집행. 범인의 이름은 월트 할로우. 일라이의 아버지다.',
  '아버지는 6년 동안 감옥에서 매달 편지를 보냈다. 일라이는 한 통도 뜯지 않았다.',
  '장례식만 치르고 바로 돌아올 생각이었다.',
  '아버지가 남긴 건 낡은 배 한 척. 그리고 그 배에 묶인 은행 빚 4,250달러.',
  '배를 팔아도 빚을 다 갚을 수 없다. 방법은 하나. 이번 새우잡이 철 10주 동안 배를 몰아서 갚는 것.',
  '그리고 이 마을 사람들은, 살인마의 아들을 반기지 않는다.',
];

const PX = 320;
const PY = 70;
const PW = 640;
const PH = 400;

export class PrologueScene extends Phaser.Scene {
  private page = 0;
  private pic: Phaser.GameObjects.Container | null = null;
  private caption!: Phaser.GameObjects.Text;
  private dots: Phaser.GameObjects.Arc[] = [];
  private busy = false;
  private done = false;

  constructor() {
    super('Prologue');
  }

  create() {
    initView(this);
    this.page = 0;
    this.done = false;
    this.cameras.main.setBackgroundColor('#2a2440');
    this.cameras.main.fadeIn(700, 21, 18, 31);
    music('sad');
    ambientWaves(false);
    const frame = this.add.graphics().setDepth(1);
    panel(frame, PX - 14, PY - 14, PW + 28, PH + 28, 0xfbf1d9, 10);
    this.caption = txt(this, 640, 560, '', { size: 28, color: '#FFF3D6', align: 'center', wordWrap: { width: 980, useAdvancedWrap: true }, lineSpacing: 10 })
      .setOrigin(0.5)
      .setDepth(5);
    this.dots = PAGES.map((_, i) => this.add.circle(640 - (PAGES.length - 1) * 11 + i * 22, 660, 6, 0x6b6385).setDepth(5));
    new Button(this, 1150, 680, '건너뛰기 ▶▶', () => this.finish(), { w: 170, h: 44, size: 18, fill: 0xfff3d6 }).setDepth(10);
    txt(this, 640, 700, '클릭·스페이스: 다음', { size: 14, color: '#9a96a8' }).setOrigin(0.5).setDepth(5);
    const zone = this.add.zone(0, 0, 1280, 640).setOrigin(0).setInteractive().setDepth(4);
    zone.on('pointerdown', () => this.next());
    onKey(this, ['Space', 'Enter', 'NumpadEnter'], () => this.next());
    onKey(this, 'Tab', () => this.finish());
    this.show(0);
  }

  private show(i: number) {
    this.busy = true;
    this.pic?.destroy();
    const c = this.add.container(0, 0).setDepth(2);
    const mask = this.make.graphics({}, false);
    mask.fillRect(PX, PY, PW, PH);
    c.setMask(mask.createGeometryMask());
    this.draw(i, c);
    this.pic = c;
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 500, onComplete: () => (this.busy = false) });
    this.caption.setText(PAGES[i]).setAlpha(0);
    this.tweens.add({ targets: this.caption, alpha: 1, duration: 600, delay: 250 });
    this.dots.forEach((d, k) => d.setFillStyle(k === i ? PALETTE.butter : 0x6b6385));
    sfx('paper');
  }

  private next() {
    if (this.busy || this.done) return;
    this.page++;
    if (this.page >= PAGES.length) this.finish();
    else this.show(this.page);
  }

  private finish() {
    if (this.done) return;
    this.done = true;
    music(null);
    this.cameras.main.fadeOut(600, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => enterSegment(this));
  }

  private chibi(c: Phaser.GameObjects.Container, id: string, x: number, y: number, scale = 1.4, flip = false, angle = 0) {
    const img = this.add.image(x, y, charTexKey(id)).setOrigin(0.5, 0.97).setScale(((flip ? -1 : 1) * scale) / TEX_SCALE, scale / TEX_SCALE).setAngle(angle);
    c.add(img);
    return img;
  }

  private draw(i: number, c: Phaser.GameObjects.Container) {
    const g = this.add.graphics();
    c.add(g);
    const fill = (col: number) => g.fillStyle(col, 1);
    switch (i) {
      case 0: {
        // city studio at night, Eli on a friend's sofa
        fill(0x4a4468);
        g.fillRect(PX, PY, PW, PH);
        fill(0x1d2550);
        g.fillRect(PX + 40, PY + 40, 200, 150);
        for (let k = 0; k < 7; k++) {
          fill(0x2f3a5c);
          g.fillRect(PX + 46 + k * 28, PY + 110 - (k % 3) * 22, 24, 80 + (k % 3) * 22);
          fill(PALETTE.butter);
          if (k % 2 === 0) g.fillRect(PX + 52 + k * 28, PY + 130, 6, 6);
        }
        g.lineStyle(4, PALETTE.ink).strokeRect(PX + 40, PY + 40, 200, 150);
        fill(0x6d5a7a);
        g.fillRect(PX, PY + 300, PW, 100);
        fill(0x8f6f9f);
        g.fillRoundedRect(PX + 210, PY + 210, 360, 110, 24);
        fill(0xa98fbf);
        g.fillRoundedRect(PX + 190, PY + 190, 60, 130, 20).fillRoundedRect(PX + 530, PY + 190, 60, 130, 20);
        this.chibi(c, 'eli', PX + 400, PY + 270, 1.3, false, -90);
        fill(0x9fb7c9);
        g.fillRect(PX + 470, PY + 330, 30, 40);
        c.add(txt(this, PX + 520, PY + 120, 'z z z', { size: 26, fontFamily: FONT_HAND, color: '#FFF3D6' }).setOrigin(0.5));
        break;
      }
      case 1: {
        fill(0x8f86c8);
        g.fillRect(PX, PY, PW, PH);
        fill(SHADE.wood);
        g.fillRect(PX + 170, PY + 250, 300, 30);
        g.fillRect(PX + 190, PY + 280, 16, 120).fillRect(PX + 434, PY + 280, 16, 120);
        const phone = this.add.container(PX + 320, PY + 205);
        const pg = this.add.graphics();
        pg.fillStyle(PALETTE.coral, 1).fillRoundedRect(-80, -20, 160, 70, 20).lineStyle(4, PALETTE.ink).strokeRoundedRect(-80, -20, 160, 70, 20);
        pg.fillStyle(0xfffaf0, 1).fillCircle(0, 15, 24).lineStyle(3, PALETTE.ink).strokeCircle(0, 15, 24);
        pg.fillStyle(PALETTE.coral, 1).fillRoundedRect(-95, -50, 190, 34, 16).lineStyle(4, PALETTE.ink).strokeRoundedRect(-95, -50, 190, 34, 16);
        phone.add(pg);
        c.add(phone);
        this.tweens.add({ targets: phone, angle: { from: -5, to: 5 }, duration: 60, yoyo: true, repeat: -1 });
        for (const [dx, a] of [
          [-150, -30],
          [150, 30],
        ] as [number, number][]) {
          const t = txt(this, PX + 320 + dx, PY + 150, '따르릉', { size: 30, fontFamily: FONT_TITLE, color: '#FFF3D6' }).setOrigin(0.5).setAngle(a);
          c.add(t);
          this.tweens.add({ targets: t, scale: 1.15, duration: 200, yoyo: true, repeat: -1 });
        }
        sfx('bell');
        break;
      }
      case 2: {
        fill(0xd9cfb8);
        g.fillRect(PX, PY, PW, PH);
        fill(0xf5efe0);
        g.fillRect(PX + 60, PY + 30, 520, 360);
        g.lineStyle(2, 0x9a96a8).strokeRect(PX + 60, PY + 30, 520, 360);
        c.add(txt(this, PX + 320, PY + 62, '걸프 코스트 데일리', { size: 22, fontFamily: FONT_TITLE, color: '#3B3355' }).setOrigin(0.5));
        g.lineStyle(2, PALETTE.ink).lineBetween(PX + 80, PY + 82, PX + 560, PY + 82);
        c.add(
          txt(this, PX + 320, PY + 118, '펠리컨 코브 연쇄 실종 사건 범인\n오늘 사형 집행', { size: 26, fontFamily: FONT_TITLE, color: '#2f2a3d', align: 'center' }).setOrigin(0.5),
        );
        // cropped photo: Walt, and a torn edge where someone was cut out
        fill(0xbfb6a8);
        g.fillRect(PX + 90, PY + 180, 230, 180);
        this.chibi(c, 'walt', PX + 190, PY + 360, 1.25);
        fill(0xf5efe0);
        g.fillPoints(
          [
            { x: PX + 300, y: PY + 180 },
            { x: PX + 320, y: PY + 180 },
            { x: PX + 320, y: PY + 360 },
            { x: PX + 290, y: PY + 360 },
            { x: PX + 305, y: PY + 320 },
            { x: PX + 292, y: PY + 280 },
            { x: PX + 308, y: PY + 240 },
            { x: PX + 294, y: PY + 210 },
          ],
          true,
        );
        for (let k = 0; k < 8; k++) {
          fill(0xb9b4c7);
          g.fillRect(PX + 345, PY + 190 + k * 20, 200 - (k % 3) * 30, 8);
        }
        break;
      }
      case 3: {
        fill(0x6d5a7a);
        g.fillRect(PX, PY, PW, PH);
        for (let k = 0; k < 26; k++) {
          const x = PX + 120 + (k % 7) * 60 + ((k * 13) % 17);
          const y = PY + 330 - Math.floor(k / 7) * 34 - ((k * 7) % 11);
          const env = this.add.graphics();
          env.fillStyle(0xfbf1d9, 1).fillRect(-40, -20, 80, 44).lineStyle(2, PALETTE.ink).strokeRect(-40, -20, 80, 44);
          env.lineStyle(2, 0x9a96a8).lineBetween(-40, -20, 0, 6).lineBetween(40, -20, 0, 6);
          env.setPosition(x, y).setAngle(((k * 37) % 30) - 15);
          c.add(env);
          if (k % 4 === 0) {
            const st = txt(this, x, y + 4, '반송', { size: 13, fontFamily: FONT_TITLE, color: CSS.killerRed }).setOrigin(0.5).setAngle(-12);
            c.add(st);
          }
        }
        break;
      }
      case 4: {
        // a seaside town sliding past a bus window
        const strip = this.add.container(PX, PY);
        const sg = this.add.graphics();
        sg.fillGradientStyle(0x9fdcef, 0x9fdcef, 0xfff0c4, 0xfff0c4, 1).fillRect(0, 0, 1600, 230);
        sg.fillStyle(PALETTE.sea, 1).fillRect(0, 230, 1600, 170);
        for (let k = 0; k < 12; k++) {
          sg.fillStyle([PALETTE.mint, PALETTE.coral, PALETTE.butter, 0xffe0e3][k % 4], 1).fillRect(40 + k * 130, 170, 90, 60);
          sg.fillStyle(PALETTE.coral, 1).fillTriangle(30 + k * 130, 172, 140 + k * 130, 172, 85 + k * 130, 130);
        }
        strip.add(sg);
        const lh = addSprite(this, 1300, 220, 'sc_lighthouse', 0.7);
        strip.add(lh);
        c.add(strip);
        this.tweens.add({ targets: strip, x: PX - 900, duration: 16000, ease: 'Linear' });
        fill(0x46506e);
        g.fillRect(PX, PY, PW, 30).fillRect(PX, PY + 370, PW, 30).fillRect(PX, PY, 26, PH).fillRect(PX + PW - 26, PY, 26, PH).fillRect(PX + 310, PY, 20, PH);
        c.bringToTop(g);
        break;
      }
      case 5: {
        fill(PALETTE.sea);
        g.fillRect(PX, PY, PW, PH);
        fill(0xfff0c4);
        g.fillRect(PX, PY, PW, 150);
        const b = addSprite(this, PX + 320, PY + 300, 'boat_marylou', 1.0).setOrigin(0.5, 200 / 240);
        c.add(b);
        const rust = this.add.graphics();
        rust.fillStyle(0x9c6f4a, 0.55);
        for (let k = 0; k < 9; k++) rust.fillEllipse(PX + 120 + k * 46, PY + 255 + (k % 3) * 9, 14, 22);
        c.add(rust);
        const tag = txt(this, PX + 520, PY + 70, '$4,250', { size: 40, fontFamily: FONT_TITLE, color: CSS.killerRed }).setOrigin(0.5).setAngle(8);
        c.add(tag);
        break;
      }
      case 6: {
        fill(0xd8e9e0);
        g.fillRect(PX, PY, PW, PH);
        this.chibi(c, 'priya', PX + 320, PY + 330, 1.5, true);
        const counter = this.add.graphics();
        counter.fillStyle(SHADE.wood, 1).fillRect(PX, PY + 270, PW, 130);
        counter.fillStyle(SHADE.woodLight, 1).fillRect(PX, PY + 260, PW, 18);
        counter.fillStyle(0xfffaf0, 1).fillRect(PX + 90, PY + 300, 140, 80);
        counter.lineStyle(2, PALETTE.ink).strokeRect(PX + 90, PY + 300, 140, 80);
        for (let k = 0; k < 4; k++) counter.lineStyle(2, 0x9a96a8).lineBetween(PX + 100, PY + 316 + k * 16, PX + 220, PY + 316 + k * 16);
        c.add(counter);
        break;
      }
      case 7: {
        fill(0xffc7a8);
        g.fillRect(PX, PY, PW, 200);
        fill(PALETTE.sea);
        g.fillRect(PX, PY + 200, PW, 60);
        fill(SHADE.wood);
        g.fillRect(PX, PY + 260, PW, 140);
        const ids = ['fisherman', 'townsfolk', 'hank', 'mabel', 'fisherman'];
        ids.forEach((id, k) => {
          const x = PX + 110 + k * 105;
          this.chibi(c, id, x, PY + 380, 1.25, k % 2 === 0);
          const brow = this.add.graphics();
          brow.lineStyle(4, PALETTE.ink).lineBetween(x - 20, PY + 268, x - 5, PY + 276).lineBetween(x + 20, PY + 268, x + 5, PY + 276);
          c.add(brow);
        });
        break;
      }
    }
  }
}
