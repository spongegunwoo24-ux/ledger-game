import type Phaser from 'phaser';
import { ambientWaves, music, sfx } from '../audio/sfx';
import { check } from '../core/conditions';
import { applyEffects } from '../core/effects';
import type { MinigameId, Step } from '../core/events';
import { G } from '../core/game';
import { choose, DialogueBox, Toasts } from './Dialogue';
import { runMinigame } from './minigames';
import { showItem, showLetter, titleCard } from './overlays';
import type { Stage } from './Stage';

export interface RunCtx {
  scene: Phaser.Scene;
  stage: Stage;
  dlg: DialogueBox;
  toasts: Toasts;
}

export function makeRunCtx(scene: Phaser.Scene, stage: Stage): RunCtx {
  return { scene, stage, dlg: new DialogueBox(scene), toasts: new Toasts(scene) };
}

const wait = (scene: Phaser.Scene, ms: number) => new Promise<void>((r) => scene.time.delayedCall(ms, () => r()));

function fade(scene: Phaser.Scene, dir: 'in' | 'out', ms: number): Promise<void> {
  const cam = scene.cameras.main;
  return new Promise((res) => {
    if (dir === 'out') {
      cam.once('camerafadeoutcomplete', () => res());
      cam.fadeOut(ms, 21, 18, 31);
    } else {
      cam.once('camerafadeincomplete', () => res());
      cam.fadeIn(ms, 21, 18, 31);
    }
  });
}

export function toastAll(ctx: RunCtx, msgs: string[]) {
  for (const m of msgs) ctx.toasts.show(m);
}

/** Plays a list of scripted steps. Resolves when the last step finishes. */
export async function runSteps(ctx: RunCtx, steps: Step[]): Promise<void> {
  const s = G.state;
  for (const st of steps) {
    switch (st.t) {
      case 'say':
        await ctx.dlg.show('say', st.text, st.who);
        break;
      case 'think':
        await ctx.dlg.show('think', st.text);
        break;
      case 'narrate':
        await ctx.dlg.show('narrate', st.text);
        break;
      case 'choice': {
        const opts = st.options.filter((o) => check(s, o.cond));
        const i = await choose(ctx.scene, opts.map((o) => o.text));
        const o = opts[i];
        if (o.remember && !s.calvinMemory.includes(o.remember)) s.calvinMemory.push(o.remember);
        toastAll(ctx, applyEffects(s, o.effects));
        if (o.then) await runSteps(ctx, o.then);
        break;
      }
      case 'move':
        await ctx.stage.move(st.who, st.to, st.ms);
        break;
      case 'enter':
        ctx.stage.place(st.who, st.at, st.face ?? 1);
        break;
      case 'exit':
        await ctx.stage.exit(st.who, st.to, st.ms);
        break;
      case 'face':
        ctx.stage.face(st.who, st.dir);
        break;
      case 'camera':
        await ctx.stage.camera(st.to, st.zoom ?? 1, st.ms ?? 800);
        break;
      case 'fade':
        ctx.dlg.hide();
        await fade(ctx.scene, st.dir, st.ms ?? 600);
        break;
      case 'sfx':
        sfx(st.id);
        break;
      case 'music':
        if (st.id === 'waves') ambientWaves(true);
        else if (st.id === 'nowaves') ambientWaves(false);
        else music(st.id);
        break;
      case 'wait':
        ctx.dlg.hide();
        await wait(ctx.scene, st.ms);
        break;
      case 'effect':
        toastAll(ctx, applyEffects(s, st.effects));
        break;
      case 'showItem':
        ctx.dlg.hide();
        await showItem(ctx.scene, st.item.startsWith('prop_') ? st.item : `it_${st.item}`, st.caption);
        break;
      case 'bg':
        ctx.stage.setBackdrop(st.key, st.tint);
        break;
      case 'if':
        await runSteps(ctx, check(s, st.cond) ? st.then : (st.else ?? []));
        break;
      case 'minigame':
        ctx.dlg.hide();
        await runMinigame(ctx.scene, st.id as MinigameId, st.params ?? {});
        break;
      case 'card':
        ctx.dlg.hide();
        await titleCard(ctx.scene, st.title, st.sub);
        break;
      case 'letter':
        ctx.dlg.hide();
        await showLetter(ctx.scene, st.title ?? '', st.text, { jitter: 0.3 });
        break;
      case 'shake':
        await ctx.stage.shake(st.who);
        break;
      case 'notes':
        ctx.stage.setNotes(st.who, st.on);
        break;
    }
  }
  ctx.dlg.hide();
}
