import Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { music } from '../audio/sfx';
import { clearSave, browserStorage } from '../core/save';
import { initView } from '../core/view';
import { Button } from '../ui/Button';
import { makeRunCtx, runSteps } from '../ui/runner';
import { Stage } from '../ui/Stage';
import { txt } from '../ui/text';

/** Endings. M1 ships the repossession ending (§12.2); the main endings arrive in M5. */
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
    this.cameras.main.fadeIn(800, 21, 18, 31);
    const stage = new Stage(this, 'morning');
    const ctx = makeRunCtx(this, stage);
    if (this.id === 'repossess') {
      music('sad');
      stage.setBackdrop('board', 'morning');
      stage.place('eli', { x: 420, y: 600 });
      void runSteps(ctx, [
        { t: 'narrate', text: '월요일 아침. 은행 사람들이 메리 루에 쇠사슬을 걸었다.' },
        { t: 'think', text: '가방 하나. 처음 올 때도 가방 하나였다.' },
        { t: 'narrate', text: '광장 버스 정류장. 하루에 두 번 오는 버스.' },
        { t: 'enter', who: 'calvin', at: { x: 1000, y: 600 }, face: -1 },
        { t: 'narrate', text: '길 건너편에서 캘빈이 손을 흔든다. 늘 그렇듯 웃으면서.' },
        { t: 'say', who: 'calvin', text: '잘 가요, 일라이 씨. 몸 건강히.' },
        { t: 'think', text: '버스가 왔다. 창밖으로 등대가 작아진다.' },
        { t: 'card', title: '압류 결말', sub: '펠리컨 코브는 계속 조용할 것이다.' },
      ]).then(() => this.credits());
    }
  }

  private credits() {
    this.children.removeAll();
    this.add.rectangle(0, 0, 1280, 720, 0x1d2550).setOrigin(0);
    txt(this, 640, 220, '「장부」', { size: 64, fontFamily: FONT_TITLE, color: '#FFE29A' }).setOrigin(0.5);
    txt(this, 640, 300, '다시 해 볼까요? 마지막 자동 저장(어제 밤)부터 이어 할 수 있어요.', { size: 22, color: '#F5E3B3' }).setOrigin(0.5);
    new Button(this, 640, 420, '어젯밤 저장으로 돌아가기', () => this.scene.start('Title'), { w: 360, h: 58, fill: PALETTE.butter });
    new Button(this, 640, 500, '처음부터', () => {
      const st = browserStorage();
      if (st) clearSave(st);
      this.scene.start('Title');
    }, { w: 360, h: 58, fill: 0xfff3d6 });
  }
}
