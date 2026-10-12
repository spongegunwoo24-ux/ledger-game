import Phaser from 'phaser';
import { CSS, FONT_UI } from '../art/palette';
import { R } from '../core/view';


export type TextOpts = Partial<Phaser.Types.GameObjects.Text.TextStyle> & { size?: number };

export function txt(scene: Phaser.Scene, x: number, y: number, s: string, o: TextOpts = {}): Phaser.GameObjects.Text {
  const { size = 22, ...given } = o;
  // drop undefined keys so they don't override the defaults below
  const rest = Object.fromEntries(Object.entries(given).filter(([, v]) => v !== undefined));
  return scene.add.text(x, y, s, {
    fontFamily: FONT_UI,
    fontSize: `${size}px`,
    color: CSS.ink,
    resolution: Math.max(1.5, R),
    ...rest,
  });
}
