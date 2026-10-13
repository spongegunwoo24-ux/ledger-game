import Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { ambientWaves, music, sfx } from '../audio/sfx';
import { G } from '../core/game';
import { hash32, makeRng, pick } from '../core/rng';
import type { CharId, LocId } from '../core/types';
import { initView } from '../core/view';
import { talkLinesFor } from '../data/dialogue/smalltalk';
import { locationDef } from '../data/locations';
import { peopleAt } from '../data/schedules';
import { dueNow, payDebt } from '../systems/economy';
import { activeQuestIds, currentStep, performStep, stepAvailableNow, stepScene } from '../systems/quests';
import { Button, panel } from '../ui/Button';
import { Hud } from '../ui/Hud';
import { addHeadMark, headMarkFor } from '../ui/headIcon';
import { makeRunCtx, runSteps, toastAll, type RunCtx } from '../ui/runner';
import { runMinigame } from '../ui/minigames';
import { Stage } from '../ui/Stage';
import { txt } from '../ui/text';
import { checkAfternoonClock, locationEvents } from './director';
import { tickClock } from '../core/clock';


interface LocData {
  loc: LocId;
}

/** A visited place in the afternoon: people present, quest tasks, small services. */
export class LocationScene extends Phaser.Scene {
  private loc!: LocId;
  private stage!: Stage;
  private ctx!: RunCtx;
  private hud!: Hud;
  private busy = false;
  private leaving = false;
  private side: Phaser.GameObjects.Container | null = null;
  private marks: Phaser.GameObjects.Container[] = [];
  private markSpots: { who: CharId; x: number; y: number }[] = [];

  constructor() {
    super('Location');
  }

  init(d: LocData) {
    this.loc = d.loc;
    this.busy = false;
    this.leaving = false;
    this.side = null;
    this.marks = [];
    this.markSpots = [];
  }

  create() {
    initView(this);
    const s = G.state;
    // location-triggered events first
    const evs = locationEvents(this.loc);
    if (evs.length) {
      this.scene.start('Cutscene', { eventId: evs[0].id, then: 'location', location: this.loc });
      return;
    }
    this.cameras.main.fadeIn(300, 21, 18, 31);
    const def = locationDef(this.loc);
    ambientWaves(['dock', 'lighthouse', 'dunes', 'fishMarket'].includes(this.loc), 0.04);
    music('town');
    this.stage = new Stage(this, 'afternoon');
    this.stage.setBackdrop(def.bg, 'afternoon');
    this.ctx = makeRunCtx(this, this.stage);
    this.hud = new Hud(this);
    txt(this, 640, 104, def.name, { size: 30, fontFamily: FONT_TITLE, color: '#FFFAF0', stroke: '#3B3355', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(60);
    this.placePeople();
    this.buildSide();
    // idle thought on arrival
    const rng = makeRng(hash32(s.seed, 'idle', s.day, this.loc));
    this.time.delayedCall(350, () => {
      if (!this.busy) void this.say([{ t: 'think', text: pick(rng, def.idle) }]);
    });
  }

  private placePeople() {
    const ppl = peopleAt(G.state, this.loc);
    const xs = [760, 940, 600, 1080];
    ppl.forEach((p, i) => {
      const img = this.stage.place(p, { x: xs[i % xs.length], y: 600 }, -1);
      img.setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => this.talk(p));
      this.markSpots.push({ who: p, x: img.x, y: img.y - img.displayHeight - 24 });
    });
    this.stage.place('eli', { x: 320, y: 610 }, 1);
  }

  private refreshMarks() {
    this.marks.forEach((m) => m.destroy());
    this.marks = [];
    for (const sp of this.markSpots) {
      const m = addHeadMark(this, sp.x, sp.y, headMarkFor(G.state, sp.who, this.loc));
      if (m) this.marks.push(m.setDepth(58));
    }
  }

  private talk(who: CharId) {
    if (this.busy) return;
    const s = G.state;
    const lines = talkLinesFor(s, who);
    if (!lines.length) return;
    const rng = makeRng(hash32(s.seed, 'talk', s.day, who, Number(s.flags[`talk_${who}`]) || 0));
    s.flags[`talk_${who}`] = (Number(s.flags[`talk_${who}`]) || 0) + 1;
    this.refreshMarks();
    void this.say([{ t: 'say', who, text: pick(rng, lines).text }]);
  }

  private async say(steps: Parameters<typeof runSteps>[1]) {
    this.busy = true;
    this.side?.setVisible(false);
    await runSteps(this.ctx, steps);
    this.busy = false;
    this.buildSide();
  }

  private buildSide() {
    this.refreshMarks();
    this.side?.destroy();
    const s = G.state;
    const c = this.add.container(0, 0).setDepth(600);
    const tasks: { label: string; sub?: string; fn: () => void; fill?: number }[] = [];

    // quest steps here
    for (const qid of activeQuestIds(s)) {
      if (!stepAvailableNow(s, qid, this.loc, 'afternoon')) continue;
      const st = currentStep(s, qid)!;
      tasks.push({ label: st.button, sub: st.task, fill: PALETTE.coral, fn: () => void this.doQuest(qid) });
    }
    // services
    if (this.loc === 'dock' && s.netTorn) {
      tasks.push({ label: '그물 수선하기', sub: '찢어진 그물을 직접 꿰맨다', fill: PALETTE.butter, fn: () => void this.repairNet() });
    }
    if (this.loc === 'bank' && s.debt > 0) {
      const due = dueNow(s);
      if (due > 0) tasks.push({ label: `이번 주 몫 미리 내기 $${Math.min(due, s.money).toFixed(0)}`, fill: PALETTE.mint, fn: () => this.prepay(due) });
      tasks.push({ label: '$50 더 갚기', fill: 0xfff3d6, fn: () => this.prepay(50) });
      tasks.push({ label: '$100 더 갚기', fill: 0xfff3d6, fn: () => this.prepay(100) });
    }

    const h = 90 + Math.max(1, tasks.length) * 72;
    const g = this.add.graphics();
    panel(g, 900, 178, 350, h, 0xfffaf0, 18, 0.96);
    c.add(g);
    c.add(txt(this, 1075, 208, '할 일', { size: 22, fontFamily: FONT_TITLE }).setOrigin(0.5));
    if (!tasks.length) c.add(txt(this, 1075, 258, '여기서 지금 할 일은 없다.', { size: 17, color: '#9a96a8' }).setOrigin(0.5));
    tasks.forEach((t, i) => {
      c.add(new Button(this, 1075, 264 + i * 72, t.label, t.fn, { w: 310, h: t.sub ? 62 : 52, size: 19, fill: t.fill, sub: t.sub }));
    });
    c.add(new Button(this, 1075, 660, '나가기 (지도로)', () => this.leave(), { w: 300, h: 52, size: 20, fill: 0xfff3d6 }));
    this.side = c;
  }

  private async doQuest(qid: string) {
    if (this.busy) return;
    const s = G.state;
    const st = currentStep(s, qid);
    if (!st) return;
    this.busy = true;
    this.side?.setVisible(false);
    if (st.bg) this.stage.setBackdrop(st.bg, 'afternoon');
    this.stage.clearActors();
    for (const a of st.actors ?? []) this.stage.place(a.who, a.at, a.face ?? 1);
    await runSteps(this.ctx, stepScene(s, qid));
    toastAll(this.ctx, performStep(s, qid));
    this.hud.refresh();
    // restore the place
    this.stage.setBackdrop(locationDef(this.loc).bg, 'afternoon');
    this.stage.clearActors();
    this.placePeople();
    this.busy = false;
    this.buildSide();
  }

  private async repairNet() {
    if (this.busy) return;
    this.busy = true;
    this.side?.setVisible(false);
    await runMinigame(this, 'knot', { points: 6 });
    G.state.netTorn = false;
    this.ctx.toasts.show('그물을 다 꿰맸다.');
    this.busy = false;
    this.buildSide();
  }

  private prepay(amount: number) {
    const s = G.state;
    const paid = payDebt(s, amount);
    if (paid <= 0) {
      this.ctx.toasts.show('낼 돈이 없다.', PALETTE.coral);
      return;
    }
    sfx('cash');
    this.ctx.toasts.show(`$${paid.toFixed(0)} 냈다. 남은 빚 $${s.debt.toFixed(0)}`, PALETTE.mint);
    this.hud.refresh();
    if (s.debt <= 0) s.flags.payoffCelebrate = s.day;
    this.buildSide();
    void this.say([{ t: 'say', who: 'priya', text: s.debt <= 0 ? '…다 갚으셨어요. 정말로요.' : '확인했어요. 미리 내 두면 금요일이 편하죠.' }]);
  }

  update(_t: number, delta: number) {
    if (this.busy || this.leaving || !this.ctx) return;
    tickClock(G.state, delta, 'land');
    if (checkAfternoonClock(this, 'Location', { loc: this.loc })) this.leaving = true;
  }

  private leave() {
    if (this.busy || this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(250, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Town'));
  }
}

