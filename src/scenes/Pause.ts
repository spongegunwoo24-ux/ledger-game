import Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { audioSettings, music, setAudio } from '../audio/sfx';
import { G } from '../core/game';
import { exportSave, importSave } from '../core/save';
import { initView } from '../core/view';
import { Button, panel } from '../ui/Button';
import { Toasts } from '../ui/Dialogue';
import { getSettings, setSettings, TEXT_SPEED_LABEL, TEXT_SPEEDS } from '../ui/settings';
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
    panel(g, 440, 40, 400, 640, 0xfff3d6, 24);
    txt(this, 640, 80, '잠깐 쉬기', { size: 34, fontFamily: FONT_TITLE }).setOrigin(0.5);
    const toasts = new Toasts(this);
    const close = () => {
      if (this.from) this.scene.resume(this.from);
      this.scene.stop();
    };
    new Button(this, 640, 150, '계속하기', close, { w: 300, h: 54, fill: PALETTE.butter });
    new Button(this, 640, 214, '세이브 파일로 내보내기', () => exportSave(G.state), { w: 300, h: 54, size: 20, fill: 0xfffaf0 });
    new Button(this, 640, 278, '세이브 파일 불러오기', () => {
      importSave()
        .then((s) => {
          G.state = s;
          if (this.from) this.scene.stop(this.from);
          this.scene.stop();
          enterSegment(this.scene.get('Title') as Phaser.Scene);
        })
        .catch((e: Error) => toasts.show(e.message, PALETTE.coral));
    }, { w: 300, h: 54, size: 20, fill: 0xfffaf0 });
    const snd = new Button(this, 640, 342, audioSettings().muted ? '소리 켜기' : '소리 끄기', () => {
      const m = !audioSettings().muted;
      setAudio({ muted: m });
      snd.setText(m ? '소리 켜기' : '소리 끄기');
    }, { w: 300, h: 54, size: 20, fill: 0xfffaf0 });
    // [변경 1] text speed and guidance settings
    const speedLabel = () => `글자 속도: ${TEXT_SPEED_LABEL[getSettings().textSpeed]}`;
    const spd = new Button(this, 640, 406, speedLabel(), () => {
      const i = TEXT_SPEEDS.indexOf(getSettings().textSpeed);
      setSettings({ textSpeed: TEXT_SPEEDS[(i + 1) % TEXT_SPEEDS.length] });
      spd.setText(speedLabel());
    }, { w: 300, h: 54, size: 20, fill: 0xfffaf0 });
    const guideLabel = () => `길 안내 표시: ${getSettings().guidance ? '켜짐' : '꺼짐'}`;
    const gd = new Button(this, 640, 470, guideLabel(), () => {
      setSettings({ guidance: !getSettings().guidance });
      gd.setText(guideLabel());
    }, { w: 300, h: 54, size: 20, fill: 0xfffaf0 });
    new Button(this, 640, 560, '처음 화면으로', () => {
      music(null);
      if (this.from) this.scene.stop(this.from);
      this.scene.stop();
      this.scene.start('Title');
    }, { w: 300, h: 54, size: 20, fill: PALETTE.coral, sub: '마지막 자동 저장부터 이어짐' });
    this.input.keyboard?.on('keydown-ESC', close);
  }
}
