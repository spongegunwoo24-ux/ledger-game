import Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { audioSettings, music, setAudio } from '../audio/sfx';
import { G } from '../core/game';
import { exportSave, importSave } from '../core/save';
import { initView } from '../core/view';
import { Button, panel } from '../ui/Button';
import { Toasts } from '../ui/Dialogue';
import { txt } from '../ui/text';
import { enterSegment } from './director';

/** Pause menu overlay (Esc / ≡): continue, export/import save, sound, back to title. */
export class PauseScene extends Phaser.Scene {
  private from = '';

  constructor() {
    super('Pause');
  }

  init(d: { from: string }) {
    this.from = d.from;
  }

  create() {
    initView(this);
    if (this.from) this.scene.pause(this.from);
    this.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.55).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    panel(g, 440, 120, 400, 480, 0xfff3d6, 24);
    txt(this, 640, 165, '잠깐 쉬기', { size: 34, fontFamily: FONT_TITLE }).setOrigin(0.5);
    const toasts = new Toasts(this);
    const close = () => {
      if (this.from) this.scene.resume(this.from);
      this.scene.stop();
    };
    new Button(this, 640, 240, '계속하기', close, { w: 300, h: 54, fill: PALETTE.butter });
    new Button(this, 640, 310, '세이브 파일로 내보내기', () => exportSave(G.state), { w: 300, h: 54, size: 20, fill: 0xfffaf0 });
    new Button(this, 640, 380, '세이브 파일 불러오기', () => {
      importSave()
        .then((s) => {
          G.state = s;
          if (this.from) this.scene.stop(this.from);
          this.scene.stop();
          enterSegment(this.scene.get('Title') as Phaser.Scene);
        })
        .catch((e: Error) => toasts.show(e.message, PALETTE.coral));
    }, { w: 300, h: 54, size: 20, fill: 0xfffaf0 });
    const snd = new Button(this, 640, 450, audioSettings().muted ? '소리 켜기' : '소리 끄기', () => {
      const m = !audioSettings().muted;
      setAudio({ muted: m });
      snd.setText(m ? '소리 켜기' : '소리 끄기');
    }, { w: 300, h: 54, size: 20, fill: 0xfffaf0 });
    new Button(this, 640, 530, '처음 화면으로', () => {
      music(null);
      if (this.from) this.scene.stop(this.from);
      this.scene.stop();
      this.scene.start('Title');
    }, { w: 300, h: 54, size: 20, fill: PALETTE.coral, sub: '마지막 자동 저장부터 이어짐' });
    this.input.keyboard?.on('keydown-ESC', close);
  }
}
