import Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { addSprite } from '../art/manifest';
import { addTint, drawBackdrop } from '../art/backdrops';
import { charTexKey } from '../art/characters';
import { ambientWaves, music, sfx } from '../audio/sfx';
import { hasFridaySave, loadFriday, startNewGame } from '../core/game';
import { initView } from '../core/view';
import { Button } from '../ui/Button';
import { txt } from '../ui/text';
import { enterSegment } from './director';

/** Endings. [변경 1] Repossession is a real game over with a restart from the last Friday. */
export class EndingScene extends Phaser.Scene {
  private id = 'repossess';

  constructor() {
    super('Ending');
  }

  init(d: { id: string }) {
    this.id = d.id;
  }

  create() {
    initView(this);
    if (this.id === 'repossess') this.repossess();
  }

  private repossess() {
    music(null);
    ambientWaves(true, 0.05);
    this.cameras.main.fadeIn(900, 21, 18, 31);
    const bd = drawBackdrop(this, 'dock', { seg: 'morning' });
    addTint(this, 'morning', 40);
    // hide the berth Mary Lou drawn by the backdrop; our own copy gets lifted
    for (const o of bd.list) if (o instanceof Phaser.GameObjects.Image && o.texture.key === 'boat_marylou') o.setVisible(false);
    // crane
    const crane = this.add.graphics().setDepth(2);
    crane.fillStyle(0xffd45e, 1).fillRect(660, 60, 26, 420);
    crane.lineStyle(3, PALETTE.ink, 1).strokeRect(660, 60, 26, 420);
    for (let y = 70; y < 470; y += 34) crane.lineStyle(2, PALETTE.ink, 0.8).lineBetween(660, y, 686, y + 34);
    crane.fillStyle(0xffd45e, 1).fillRect(300, 60, 400, 22);
    crane.lineStyle(3, PALETTE.ink, 1).strokeRect(300, 60, 400, 22);
    const cable = this.add.graphics().setDepth(3);
    const boat = addSprite(this, 330, 420, 'boat_marylou', 0.8).setOrigin(0.5, 200 / 240).setDepth(4);
    const chain = { y: 300 };
    const drawCable = () => {
      cable.clear();
      cable.lineStyle(3, PALETTE.ink, 1).lineBetween(330, 82, 330, boat.y - 150);
      cable.lineBetween(330, boat.y - 150, 220, boat.y - 60).lineBetween(330, boat.y - 150, 440, boat.y - 70);
    };
    drawCable();
    void chain;
    const ledger = addSprite(this, 470, 330, 'ch_ledger', 0.9).setDepth(5);
    const say = txt(this, 640, 640, '', { size: 26, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 6, align: 'center' })
      .setOrigin(0.5)
      .setDepth(20);
    this.time.delayedCall(800, () => {
      sfx('creak');
      say.setText('월요일 아침. 본사 크레인이 왔다.');
      this.tweens.add({ targets: boat, y: 250, angle: -4, duration: 4200, ease: 'Sine.InOut', onUpdate: drawCable });
    });
    this.time.delayedCall(2600, () => {
      sfx('squawk');
      ledger.setTexture('ch_ledger_fly');
      this.tweens.add({ targets: ledger, x: 1400, y: 60, duration: 2600, ease: 'Sine.In' });
      say.setText('장부가 날아올랐다. 한 번도 돌아보지 않고.');
    });
    this.time.delayedCall(6200, () => this.busStop());
  }

  private busStop() {
    this.cameras.main.fadeOut(700, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.children.removeAll(true);
      this.cameras.main.fadeIn(700, 21, 18, 31);
      music('sad');
      drawBackdrop(this, 'board', { seg: 'morning' });
      addTint(this, 'morning', 40);
      const sign = this.add.graphics().setDepth(2);
      sign.fillStyle(0x6d6a7a, 1).fillRect(330, 300, 8, 240);
      sign.fillStyle(0xfffaf0, 1).fillRoundedRect(290, 280, 90, 50, 8).lineStyle(3, PALETTE.ink, 1).strokeRoundedRect(290, 280, 90, 50, 8);
      txt(this, 335, 305, 'BUS', { size: 20, fontFamily: FONT_TITLE }).setOrigin(0.5).setDepth(3);
      this.add.image(420, 545, charTexKey('eli')).setOrigin(0.5, 0.97).setScale(0.75).setDepth(4);
      const calvin = this.add.image(1000, 545, charTexKey('calvin')).setOrigin(0.5, 0.97).setScale(-0.75, 0.75).setDepth(4);
      this.tweens.add({ targets: calvin, angle: { from: -6, to: 6 }, duration: 380, yoyo: true, repeat: 7 });
      txt(this, 1000, 330, '잘 가요, 일라이 씨.', { size: 22, color: '#3B3355', stroke: '#FFFAF0', strokeThickness: 5 }).setOrigin(0.5).setDepth(5);
      this.time.delayedCall(2600, () => this.gameOver());
    });
  }

  private gameOver() {
    const c = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x15121f, 0).setOrigin(0);
    c.add(shade);
    this.tweens.add({ targets: shade, fillAlpha: 0.85, duration: 900 });
    const t = txt(this, 640, 230, '메리 루 호가 압류되었습니다.', { size: 44, fontFamily: FONT_TITLE, color: '#FFE29A' }).setOrigin(0.5).setAlpha(0);
    c.add(t);
    this.tweens.add({ targets: t, alpha: 1, duration: 900, delay: 400 });
    const hasFri = hasFridaySave();
    const b1 = new Button(
      this,
      640,
      380,
      '지난 금요일부터 다시 하기',
      () => {
        if (loadFriday()) enterSegment(this);
      },
      { w: 380, h: 58, fill: PALETTE.butter, disabled: !hasFri, sub: hasFri ? '금요일 아침 저장' : '금요일 저장이 아직 없다' },
    );
    const b2 = new Button(
      this,
      640,
      460,
      '처음부터',
      () => {
        startNewGame();
        this.scene.start('Prologue');
      },
      { w: 380, h: 54, fill: 0xfff3d6 },
    );
    const b3 = new Button(this, 640, 530, '타이틀로', () => this.scene.start('Title'), { w: 380, h: 54, fill: 0xfff3d6 });
    for (const b of [b1, b2, b3]) {
      b.setAlpha(0);
      c.add(b);
    }
    this.tweens.add({ targets: [b1, b2, b3], alpha: 1, duration: 600, delay: 1300 });
  }
}
