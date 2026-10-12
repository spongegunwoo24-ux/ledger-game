import Phaser from 'phaser';
import { PALETTE, FONT_TITLE, CSS } from '../art/palette';
import { fishTexKey } from '../art/fish';
import { TEX_SCALE } from '../art/pen';
import { sfx } from '../audio/sfx';
import { holdClock, releaseClock } from '../core/clock';
import { fishPrice, fishWeight, RARITY_LABEL, type FishDef } from '../data/fish';
import { Button, panel } from './Button';
import { txt } from './text';

export type CardChoice = 'keep' | 'release' | 'bait' | 'photo';

/**
 * [변경 1] Fish card: name, size, weight, a short line; "NEW!" for a first catch,
 * "기록 갱신!" for a record. Release / keep (legendaries: photograph or keep for mounting).
 */
export function showFishCard(scene: Phaser.Scene, f: FishDef, inches: number, flags: { isNew: boolean; record: boolean }): Promise<CardChoice> {
  return new Promise((resolve) => {
    const token = {};
    holdClock(token);
    const legend = f.rarity === 'legendary';
    const big = legend || f.rarity === 'rare' || f.rarity === 'veryRare';
    const c = scene.add.container(0, 0).setDepth(1250);
    const shade = scene.add.rectangle(0, 0, 1280, 720, legend ? 0x15121f : PALETTE.ink, legend ? 0.8 : 0.45).setOrigin(0).setInteractive();
    c.add(shade);
    const w = big ? 760 : 560;
    const h = big ? 520 : 400;
    const x = 640 - w / 2;
    const y = 360 - h / 2;
    const g = scene.add.graphics();
    if (legend) {
      g.fillStyle(0xffe29a, 0.25).fillCircle(640, 300, 330);
      g.fillStyle(0xffe29a, 0.18).fillCircle(640, 300, 250);
    }
    panel(g, x, y, w, h, legend ? 0xfff6dc : 0xfffaf0, 22);
    const bandCol = legend ? 0xd9a040 : f.rarity === 'veryRare' ? 0xffd45e : f.rarity === 'rare' ? PALETTE.lilac : f.rarity === 'uncommon' ? PALETTE.mint : 0xd9d4e3;
    g.fillStyle(bandCol, 1).fillRoundedRect(x + 3, y + 3, w - 6, 50, { tl: 20, tr: 20, bl: 0, br: 0 });
    c.add(g);
    c.add(txt(scene, 640, y + 28, `${RARITY_LABEL[f.rarity]} · No.${f.no}`, { size: 20, color: '#3B3355' }).setOrigin(0.5));
    const img = scene.add.image(640, y + (big ? 190 : 150), fishTexKey(f.id)).setScale((big ? 4.2 : 3) / TEX_SCALE);
    c.add(img);
    scene.tweens.add({ targets: img, angle: { from: -4, to: 4 }, duration: 600, yoyo: true, repeat: -1 });
    c.add(txt(scene, 640, y + (big ? 300 : 230), f.name, { size: big ? 40 : 32, fontFamily: FONT_TITLE }).setOrigin(0.5));
    c.add(txt(scene, 640, y + (big ? 346 : 268), `${inches.toFixed(1)}인치 · ${fishWeight(f, inches).toFixed(1)} lb${legend ? '' : ` · $${fishPrice(f, inches).toFixed(2)}`}`, { size: 22, color: '#2d5fa8' }).setOrigin(0.5));
    c.add(txt(scene, 640, y + (big ? 384 : 300), f.desc, { size: 18, color: '#6b6385', align: 'center', wordWrap: { width: w - 80 } }).setOrigin(0.5, 0));
    const stamp = (s: string, sx: number, sy: number, col: string, delay: number, size = 34) => {
      const t = txt(scene, sx, sy, s, { size, fontFamily: FONT_TITLE, color: col }).setOrigin(0.5).setAngle(-14).setAlpha(0);
      c.add(t);
      scene.tweens.add({ targets: t, alpha: 0.9, scale: { from: 2.4, to: 1 }, duration: 260, delay, ease: 'Back.Out', onStart: () => sfx('thud') });
    };
    if (legend) stamp('전설', x + w - 110, y + 110, '#c27a1a', 300, 52);
    if (flags.isNew) stamp('NEW!', x + 110, y + 110, CSS.killerRed, legend ? 700 : 250);
    else if (flags.record) stamp('기록 갱신!', x + 130, y + 110, '#2f8f5f', 250, 28);
    for (let i = 0; i < (big ? 18 : 8); i++) {
      const sp = scene.add.image(640 + (Math.random() - 0.5) * w, y + 60 + Math.random() * (h - 120), 'fx_sparkle').setScale(0.5 + Math.random()).setAlpha(0);
      c.add(sp);
      scene.tweens.add({ targets: sp, alpha: { from: 1, to: 0 }, angle: 180, duration: 1200, delay: i * 70, repeat: legend ? -1 : 0 });
    }
    sfx(legend ? 'fanfare' : big ? 'chime' : 'pop');
    let finished = false;
    const done = (ch: CardChoice) => {
      if (finished) return;
      finished = true;
      window.removeEventListener('keydown', key);
      releaseClock(token);
      c.destroy();
      resolve(ch);
    };
    const by = y + h - 44;
    const opts: [string, CardChoice, number][] = legend
      ? [
          ['사진 찍고 놓아주기', 'photo', PALETTE.butter],
          ['가져가기 (박제용)', 'keep', 0xfff3d6],
        ]
      : f.id === 'pinfish'
        ? [
            ['가져가기', 'keep', PALETTE.butter],
            ['미끼로 쓰기', 'bait', PALETTE.mint],
            ['놓아주기', 'release', 0xfff3d6],
          ]
        : f.release
          ? [
              ['놓아주기', 'release', PALETTE.mint],
              ['가져가기', 'keep', 0xfff3d6],
            ]
          : [
              ['가져가기', 'keep', PALETTE.butter],
              ['놓아주기', 'release', 0xfff3d6],
            ];
    const bw = Math.min(240, (w - 60) / opts.length - 12);
    opts.forEach(([label, ch, col], i) => {
      const bx = 640 + (i - (opts.length - 1) / 2) * (bw + 14);
      c.add(new Button(scene, bx, by, label, () => done(ch), { w: bw, h: 50, size: 19, fill: col }));
    });
    c.add(txt(scene, 640, y + h + 22, '스페이스 = 첫 번째 선택', { size: 14, color: '#C9B6E4' }).setOrigin(0.5));
    function key(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'Enter') done(opts[0][1]);
    }
    setTimeout(() => window.addEventListener('keydown', key), 400);
    c.setAlpha(0);
    scene.tweens.add({ targets: c, alpha: 1, duration: 220 });
  });
}
