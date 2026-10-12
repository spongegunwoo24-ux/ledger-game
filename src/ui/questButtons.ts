import type Phaser from 'phaser';
import { PALETTE } from '../art/palette';
import { G } from '../core/game';
import type { LocId, Segment } from '../core/types';
import { stepsHere } from '../systems/quests';
import { Button } from './Button';

/**
 * [변경 2] Quest steps outside the afternoon (dawn at the harbor, morning at the market, evening at home):
 * buttons stacked upward from (x, yBottom). Each plays the step as a cutscene and comes back to `returnTo`.
 */
export function questButtons(scene: Phaser.Scene, loc: LocId, seg: Segment, x: number, yBottom: number, returnTo: string, canGo: () => boolean = () => true): Button[] {
  return stepsHere(G.state, loc, seg).map(({ qid, step }, i) =>
    new Button(
      scene,
      x,
      yBottom - i * 70,
      step.button,
      () => {
        if (!canGo()) return;
        scene.cameras.main.fadeOut(250, 21, 18, 31);
        scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start('Cutscene', { questId: qid, then: 'return', returnTo }));
      },
      { w: 300, h: 60, size: 19, fill: PALETTE.coral, sub: step.task },
    ).setDepth(70),
  );
}
