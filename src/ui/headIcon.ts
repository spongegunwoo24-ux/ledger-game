import type Phaser from 'phaser';
import { PALETTE } from '../art/palette';
import { check } from '../core/conditions';
import type { GameState } from '../core/state';
import type { CharId, LocId } from '../core/types';
import { SMALLTALK } from '../data/dialogue/smalltalk';
import { activeQuestIds, currentStep, questDef, stepAvailableNow } from '../systems/quests';
import { getSettings } from './settings';

/** [변경 1] Head marks over people: yellow "!" quest here, green "✔" finishing step, blue "…" new talk. */
export type HeadMark = 'quest' | 'turnin' | 'talk';

export function headMarkFor(s: GameState, who: CharId, loc: LocId): HeadMark | null {
  for (const qid of activeQuestIds(s)) {
    const def = questDef(qid);
    if (!def || def.giver !== who || !stepAvailableNow(s, qid, loc, 'afternoon')) continue;
    const q = s.quests[qid];
    const st = currentStep(s, qid);
    const last = q.step === def.steps.length - 1 && q.progress + 1 >= (st?.repeat ?? 1);
    return last ? 'turnin' : 'quest';
  }
  const talked = Number(s.flags[`talk_${who}`]) || 0;
  if (talked === 0 && (SMALLTALK[who] ?? []).some((l) => check(s, l.when))) return 'talk';
  return null;
}

const COLOR: Record<HeadMark, number> = { quest: 0xf2b705, turnin: 0x3fa34d, talk: 0x3d7dd8 };

/** Bobbing round badge; returns null when guidance is off or there is nothing to show. */
export function addHeadMark(scene: Phaser.Scene, x: number, y: number, mark: HeadMark | null, size = 34): Phaser.GameObjects.Container | null {
  if (!mark || !getSettings().guidance) return null;
  const r = size * 0.6;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.ink, 0.25).fillCircle(2, 3, r);
  g.fillStyle(COLOR[mark], 1).fillCircle(0, 0, r);
  g.lineStyle(3, PALETTE.ink, 1).strokeCircle(0, 0, r);
  g.fillStyle(0xffffff, 1);
  if (mark === 'quest') {
    g.fillRoundedRect(-r * 0.13, -r * 0.62, r * 0.26, r * 0.78, r * 0.12);
    g.fillCircle(0, r * 0.45, r * 0.15);
  } else if (mark === 'talk') {
    for (const dx of [-0.42, 0, 0.42]) g.fillCircle(dx * r, 0, r * 0.15);
  } else {
    g.lineStyle(r * 0.24, 0xffffff, 1);
    g.beginPath();
    g.moveTo(-r * 0.42, 0);
    g.lineTo(-r * 0.1, r * 0.32);
    g.lineTo(r * 0.45, -r * 0.35);
    g.strokePath();
  }
  c.add(g);
  scene.tweens.add({ targets: c, y: y - 8, duration: 450, yoyo: true, repeat: -1 });
  return c;
}
