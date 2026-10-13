import Phaser from 'phaser';
import { ambientWaves, music } from '../audio/sfx';
import { weekOf } from '../core/calendar';
import type { Step } from '../core/events';
import { G } from '../core/game';
import { initView } from '../core/view';
import { fridayPayment, gusCanOffer, dueNow, overdueDeadline } from '../systems/economy';
import { makeRunCtx, runSteps, toastAll, type RunCtx } from '../ui/runner';
import { currentStep, performStep, stepScene } from '../systems/quests';
import { Stage } from '../ui/Stage';
import { endSegment, enterSegment, eventById, type CutsceneData } from './director';

/** Plays one scripted event (or a generated scene like the Friday payment). */
export class CutsceneScene extends Phaser.Scene {
  private stage!: Stage;
  private ctx!: RunCtx;
  private dataIn!: CutsceneData;

  constructor() {
    super('Cutscene');
  }

  init(data: CutsceneData) {
    this.dataIn = data;
  }

  create() {
    initView(this);
    this.cameras.main.fadeIn(350, 21, 18, 31);
    this.stage = new Stage(this, G.state.segment);
    this.ctx = makeRunCtx(this, this.stage);
    void this.play();
  }

  private async play() {
    const d = this.dataIn;
    const s = G.state;
    if (d.special === 'payment') {
      if (await this.payment()) return;
    } else if (d.special === 'deadline') {
      if (await this.deadline()) return;
    } else if (d.questId) {
      const st = currentStep(s, d.questId);
      if (st) {
        this.stage.setBackdrop(st.bg ?? 'dock', s.segment);
        for (const a of st.actors ?? []) this.stage.place(a.who, a.at, a.face ?? 1);
        ambientWaves(st.bg === 'dock' || st.bg === 'sea' || st.bg === 'dockDusk', 0.04);
        await runSteps(this.ctx, stepScene(s, d.questId));
        toastAll(this.ctx, performStep(s, d.questId));
        await new Promise<void>((r) => this.time.delayedCall(900, () => r()));
      }
    } else if (d.eventId) {
      const ev = eventById(d.eventId);
      if (ev) {
        if (!s.eventsDone.includes(ev.id)) s.eventsDone.push(ev.id);
        this.stage.setBackdrop(ev.bg, ev.tint ?? s.segment, { candles: Number(s.flags.candles) || 7 });
        for (const a of ev.actors ?? []) this.stage.place(a.who, a.at, a.face ?? 1);
        if (ev.bg === 'dock' || ev.bg === 'dockDusk' || ev.bg === 'sea' || ev.bg === 'lighthouse') ambientWaves(true, 0.04);
        else ambientWaves(false);
        await runSteps(this.ctx, ev.steps);
        if (!s.story.some((x) => x.id === ev.id)) s.story.push({ id: ev.id, day: s.day, skipped: this.ctx.skipped });
        if (ev.next) {
          this.finish(() => {
            if (ev.next?.scene === 'Trawl') this.scene.start('Trawl', { ground: ev.next.ground, tutorial: ev.next.tutorial });
            else if (ev.next?.scene === 'Title') this.scene.start('Title');
            else this.scene.start(ev.next!.scene);
          });
          return;
        }
      }
    }
    this.finish(() => {
      switch (d.then) {
        case 'segment':
          enterSegment(this);
          break;
        case 'endSegment':
          endSegment(this);
          break;
        case 'location':
          this.scene.start('Location', { loc: d.location, skipEvents: false });
          break;
        case 'return':
          this.scene.start(d.returnTo ?? 'Town', d.returnData ?? {});
          break;
      }
    });
  }

  private finish(next: () => void) {
    this.ctx.dlg.hide();
    this.cameras.main.fadeOut(300, 21, 18, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.ctx.dlg.destroy();
      next();
    });
  }

  /** [변경 1] Friday 17:00 payment. Returns true when it already moved on to another scene. */
  private async payment(): Promise<boolean> {
    const s = G.state;
    s.flags[`paid_${s.day}`] = true;
    music('town');
    const pre: Step[] = [];
    if (gusCanOffer(s)) {
      s.flags.gusCanOffered = true;
      const short = Math.max(0, dueNow(s) - s.money);
      pre.push(
        { t: 'bg', key: 'dock', tint: 'afternoon' },
        { t: 'enter', who: 'eli', at: { x: 520, y: 552 } },
        { t: 'enter', who: 'gus', at: { x: 760, y: 552 }, face: -1 },
        { t: 'narrate', text: `은행 가는 길. 이번 주 돈이 $${short.toFixed(0)} 모자란다. 거스가 부두 끝에서 기다리고 있다. 손에 커피 깡통을 들고.` },
        { t: 'say', who: 'gus', text: '…' },
        { t: 'think', text: '깡통 안에 지폐가 말려 있다. 꼬깃꼬깃한 일 달러, 오 달러짜리들.' },
        { t: 'say', who: 'gus', text: '…세지 마. 백오십이다.' },
        {
          t: 'choice',
          options: [
            {
              text: '받는다. "…꼭 갚을게요."',
              effects: [{ money: 150 }, { flag: 'tookGusMoney' }, { feel: 'gus', delta: 5 }],
              then: [{ t: 'say', who: 'gus', text: '갚긴 뭘. 배 굶기지나 마.' }],
            },
            {
              text: '거절한다. "영감님 돈이잖아요."',
              effects: [{ feel: 'gus', delta: 2 }],
              then: [
                { t: 'say', who: 'gus', text: '…고집은 지 애비 닮아서.' },
                { t: 'narrate', text: '거스는 깡통을 다시 품에 넣는다. 조금 서운한 얼굴로.' },
              ],
            },
          ],
        },
        { t: 'exit', who: 'gus' },
      );
    }
    pre.push(
      { t: 'bg', key: 'bank', tint: 'afternoon' },
      { t: 'enter', who: 'eli', at: { x: 470, y: 552 } },
      { t: 'enter', who: 'priya', at: { x: 700, y: 552 }, face: -1 },
      { t: 'narrate', text: '금요일 오후 다섯 시. 은행.' },
    );
    this.stage.setBackdrop('bank', 'afternoon');
    await runSteps(this.ctx, pre);

    const r = fridayPayment(s);
    const week = weekOf(s.day);
    const post: Step[] = [];
    if (r.due <= 0) {
      post.push({ t: 'say', who: 'priya', text: '이번 주 몫은 이미 들어와 있어요. 미리 내셨잖아요.' });
    } else if (r.short <= 0) {
      post.push({ t: 'sfx', id: 'cash' });
      post.push({ t: 'say', who: 'priya', text: `$${r.paid.toFixed(0)}, 확인했어요. ${week}주차 상환 끝.` });
      post.push(
        week === 1
          ? { t: 'say', who: 'priya', text: '첫 주를 넘기는 분들이 생각보다 적어요. 잘하셨어요.' }
          : { t: 'say', who: 'priya', text: '수고하셨어요. 다음 주도 금요일 오후 다섯 시예요.' },
      );
    } else if (r.repossess) {
      if (r.paid > 0) post.push({ t: 'sfx', id: 'cash' });
      post.push(
        { t: 'say', who: 'priya', text: `$${r.short.toFixed(0)}이 모자라요.` },
        { t: 'say', who: 'priya', text: '…두 번째예요. 죄송해요. 이번엔 저도 막을 수가 없어요.' },
        { t: 'say', who: 'priya', text: '본사에서 내일 아침에 메리 루를 가지러 와요.' },
      );
    } else {
      if (r.paid > 0) post.push({ t: 'sfx', id: 'cash' });
      post.push(
        { t: 'say', who: 'priya', text: `이번 주 상환액에서 $${r.short.toFixed(0)}이 모자라요.` },
        { t: 'say', who: 'priya', text: '…규정상으로는 바로 압류 절차예요.' },
        { t: 'sfx', id: 'paper' },
        {
          t: 'notice',
          title: '연체 경고장',
          lines: [
            `미납액 $${r.short.toFixed(2)} + 연체료(10%) $${r.fee.toFixed(2)}`,
            `합계 $${r.overdue.toFixed(2)}을(를) 월요일 오후 5시까지 납부하십시오.`,
            '기한 내 미납 시, 또는 금요일 상환이 다시 부족할 시',
            '메리 루 호는 즉시 압류됩니다.',
          ],
          tone: 'red',
        },
        { t: 'say', who: 'eli', text: '월요일까지 기다려 주는 거예요? 규정이 있다면서요.' },
        { t: 'say', who: 'priya', text: '대니얼이라면 이렇게 했을 거예요.' },
        { t: 'think', text: '대니얼. 처음 듣는 이름이다. 물어보기 전에 프리야는 서류를 덮었다.' },
        { t: 'say', who: 'priya', text: '그런데 두 번째는 저도 못 막아요. 정말로요.' },
        { t: 'effect', effects: [{ flag: 'heardDanielName' }] },
      );
    }
    if (r.paidOff) {
      post.push(
        { t: 'say', who: 'priya', text: '…잠깐만요. 이게 마지막 금액이에요. 빚이 0이에요.' },
        { t: 'effect', effects: [{ flag: 'payoffCelebrate', value: s.day }] },
      );
    }
    await runSteps(this.ctx, post);
    if (r.repossess) {
      s.flags.repossessed = true;
      this.finish(() => this.scene.start('Ending', { id: 'repossess' }));
      return true;
    }
    return false;
  }

  /** [변경 1] Monday 17:00: the overdue amount must be in. */
  private async deadline(): Promise<boolean> {
    const s = G.state;
    s.flags[`deadline_${s.day}`] = true;
    const r = overdueDeadline(s);
    if (!r) return false;
    this.stage.setBackdrop('bank', 'afternoon');
    const steps: Step[] = [
      { t: 'enter', who: 'eli', at: { x: 470, y: 552 } },
      { t: 'enter', who: 'priya', at: { x: 700, y: 552 }, face: -1 },
      { t: 'narrate', text: '월요일 오후 다섯 시. 연체금 마감.' },
    ];
    if (r.paid > 0) steps.push({ t: 'sfx', id: 'cash' });
    if (r.repossess) {
      steps.push(
        { t: 'say', who: 'priya', text: `$${(r.owed - r.paid).toFixed(0)}이 아직 안 들어왔어요.` },
        { t: 'say', who: 'priya', text: '…죄송해요. 더는 붙잡을 수가 없어요.' },
      );
    } else {
      steps.push(
        { t: 'say', who: 'priya', text: '연체금 다 들어왔어요. 이번엔 넘어갔어요.' },
        { t: 'say', who: 'priya', text: '다음 금요일엔… 꼭이요.' },
      );
    }
    await runSteps(this.ctx, steps);
    if (r.repossess) {
      s.flags.repossessed = true;
      this.finish(() => this.scene.start('Ending', { id: 'repossess' }));
      return true;
    }
    return false;
  }
}
