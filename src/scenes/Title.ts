import Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { addSprite } from '../art/manifest';
import { ambientWaves, audioSettings, music, setAudio, unlockAudio } from '../audio/sfx';
import { G, hasAutosave, loadAutosave, startNewGame } from '../core/game';
import { importSave } from '../core/save';
import { initView } from '../core/view';
import { Button } from '../ui/Button';
import { Toasts } from '../ui/Dialogue';
import { txt } from '../ui/text';
import { enterSegment } from './director';

export const PITCH = '연쇄살인범은 이미 처형됐다. 마을은 사건이 끝났다고 말한다. 처형된 사람은 내 아버지다.';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    initView(this);
    this.cameras.main.fadeIn(600, 21, 18, 31);
    const g = this.add.graphics();
    g.fillGradientStyle(0xb9a6dc, 0xb9a6dc, 0xffc7c2, 0xffc7c2, 1).fillRect(0, 0, 1280, 430);
    this.add.circle(980, 400, 70, 0xffc7a8, 1);
    g.fillGradientStyle(PALETTE.sea, PALETTE.sea, PALETTE.seaDeep, PALETTE.seaDeep, 1).fillRect(0, 420, 1280, 300);
    for (let i = 0; i < 24; i++) g.lineStyle(2, 0xffffff, 0.6).lineBetween((i * 113) % 1280, 450 + (i % 6) * 40, ((i * 113) % 1280) + 30, 450 + (i % 6) * 40);
    addSprite(this, 1150, 390, 'sc_lighthouse', 0.9);
    const boat = addSprite(this, 420, 470, 'boat_marylou', 0.9).setOrigin(0.5, 200 / 240);
    this.tweens.add({ targets: boat, y: 476, angle: 1, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const pel = addSprite(this, 560, 250, 'ch_ledger_fly', 1.1);
    this.tweens.add({ targets: pel, x: 640, y: 230, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    for (let i = 0; i < 3; i++) {
      const gull = addSprite(this, 200 + i * 340, 120 + i * 30, 'sc_gull', 0.9);
      this.tweens.add({ targets: gull, x: gull.x + 80, duration: 4000 + i * 600, yoyo: true, repeat: -1 });
    }

    txt(this, 640, 120, '「장부」', { size: 96, fontFamily: FONT_TITLE, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 10 }).setOrigin(0.5);
    txt(this, 640, 190, 'LEDGER', { size: 26, fontFamily: FONT_TITLE, color: '#3B3355' }).setOrigin(0.5);
    txt(this, 640, 236, PITCH, { size: 21, color: '#3B3355', align: 'center', wordWrap: { width: 900 } }).setOrigin(0.5);

    const toasts = new Toasts(this);
    const has = hasAutosave();
    const startY = has ? 560 : 590;
    if (has) {
      new Button(this, 640, startY, '이어하기', () => {
        unlockAudio();
        if (loadAutosave()) this.go();
        else toasts.show('저장된 게임을 읽지 못했어요.', PALETTE.coral);
      }, { w: 300, h: 58, fill: PALETTE.butter });
    }
    new Button(this, 640, startY + (has ? 70 : 0), '새 게임', () => {
      unlockAudio();
      startNewGame();
      this.go();
    }, { w: 300, h: 58, fill: has ? 0xfff3d6 : PALETTE.butter });
    new Button(this, 470, 680, '세이브 파일 불러오기', () => {
      importSave()
        .then((s) => {
          G.state = s;
          this.go();
        })
        .catch((e: Error) => toasts.show(e.message, PALETTE.coral));
    }, { w: 260, h: 44, size: 18, fill: 0xfff3d6 });
    const snd = new Button(this, 810, 680, audioSettings().muted ? '소리 켜기' : '소리 끄기', () => {
      const m = !audioSettings().muted;
      setAudio({ muted: m });
      snd.setText(m ? '소리 켜기' : '소리 끄기');
    }, { w: 180, h: 44, size: 18, fill: 0xfff3d6 });
    this.input.once('pointerdown', () => {
      unlockAudio();
      ambientWaves(true, 0.05);
      music('dawn');
    });
  }

  private go() {
    music(null);
    this.cameras.main.fadeOut(500, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => enterSegment(this));
  }
}
