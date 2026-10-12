import Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { sfx } from '../audio/sfx';
import { panel } from './Button';
import { txt } from './text';

/** [변경 1] Big banner at the top for 2 seconds: new quest / step complete. */
export function questBanner(scene: Phaser.Scene, message: string) {
  const isNew = message.startsWith('새 할 일');
  sfx(isNew ? 'chime' : 'cash');
  const head = isNew ? '새 할 일' : message.startsWith('완료') ? '완료!' : '단계 완료';
  const body = message.replace(/^(새 할 일|완료|단계 완료):\s*/, '');
  const c = scene.add.container(640, -80).setDepth(1600);
  const g = scene.add.graphics();
  const w = Math.max(520, body.length * 24 + 120);
  panel(g, -w / 2, -48, w, 96, isNew ? PALETTE.butter : PALETTE.mint, 26);
  c.add(g);
  c.add(txt(scene, 0, -18, head, { size: 20, color: '#6b6385' }).setOrigin(0.5));
  c.add(txt(scene, 0, 14, body, { size: 30, fontFamily: FONT_TITLE }).setOrigin(0.5));
  for (let i = 0; i < 10; i++) {
    const sp = scene.add.image((Math.random() - 0.5) * w, (Math.random() - 0.5) * 80, 'fx_sparkle').setScale(0.6);
    c.add(sp);
    scene.tweens.add({ targets: sp, alpha: 0, scale: 1.4, angle: 180, duration: 900, delay: i * 60 });
  }
  scene.tweens.add({ targets: c, y: 120, duration: 320, ease: 'Back.Out' });
  scene.time.delayedCall(2200, () => scene.tweens.add({ targets: c, y: -100, alpha: 0, duration: 300, onComplete: () => c.destroy() }));
}
