import Phaser from 'phaser';
import { ambientWaves, music } from '../audio/sfx';
import { weekOf } from '../core/calendar';
import type { Step } from '../core/events';
import { G } from '../core/game';
import { initView } from '../core/view';
import { fridayPayment, gusCanOffer, dueNow } from '../systems/economy';
import { makeRunCtx, runSteps, type RunCtx } from '../ui/runner';
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
    } else if (d.eventId) {
      const ev = eventById(d.eventId);
      if (ev) {
        if (!s.eventsDone.includes(ev.id)) s.eventsDone.push(ev.id);
        this.stage.setBackdrop(ev.bg, ev.tint ?? s.segment, { candles: Number(s.flags.candles) || 7 });
        for (const a of ev.actors ?? []) this.stage.place(a.who, a.at, a.face ?? 1);
        if (ev.bg === 'dock' || ev.bg === 'dockDusk' || ev.bg === 'sea' || ev.bg === 'lighthouse') ambientWaves(true, 0.04);
        else ambientWaves(false);
        await runSteps(this.ctx, ev.steps);
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
          this.scene.start(d.returnTo ?? 'Town', d.returnData);
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

  /** Friday payment at the end of the afternoon (no slot cost). */
  /** Returns true when it already moved on to another scene. */
  private async payment(): Promise<boolean> {
    const s = G.state;
    s.flags[`paid_${s.day}`] = true;
    music('town');
    const pre: Step[] = [];
    if (gusCanOffer(s)) {
      s.flags.gusCanOffered = true;
      pre.push(
        { t: 'bg', key: 'dock', tint: 'afternoon' },
        { t: 'enter', who: 'eli', at: { x: 520, y: 552 } },
        { t: 'enter', who: 'gus', at: { x: 760, y: 552 }, face: -1 },
        { t: 'narrate', text: '은행 가는 길. 거스가 부두 끝에서 기다리고 있다. 손에 커피 깡통을 들고.' },
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
      );
    }
    pre.push(
      { t: 'bg', key: 'bank', tint: 'afternoon' },
      { t: 'exit', who: 'gus' },
      { t: 'enter', who: 'eli', at: { x: 470, y: 552 } },
      { t: 'enter', who: 'priya', at: { x: 700, y: 552 }, face: -1 },
    );
    this.stage.setBackdrop('bank', 'afternoon');
    await runSteps(this.ctx, pre);

    const due = dueNow(s);
    const r = fridayPayment(s);
    const week = weekOf(s.day);
    const post: Step[] = [];
    if (due <= 0 && r.paid <= 0) {
      post.push({ t: 'say', who: 'priya', text: '이번 주 몫은 이미 들어와 있어요. 미리 내셨잖아요.' });
      post.push({ t: 'say', who: 'priya', text: '이렇게만 가면 배는 일라이 씨 거예요.' });
    } else if (r.short <= 0) {
      post.push({ t: 'sfx', id: 'cash' });
      post.push({ t: 'say', who: 'priya', text: `$${r.paid.toFixed(0)}, 확인했어요. ${week}주차 납부 끝.` });
      post.push(
        week === 1
          ? { t: 'say', who: 'priya', text: '첫 주를 넘기는 분들이 생각보다 적어요. 잘하셨어요.' }
          : { t: 'say', who: 'priya', text: '수고하셨어요. 다음 주도 금요일 오후예요.' },
      );
    } else if (r.extensionGranted) {
      if (r.paid > 0) post.push({ t: 'sfx', id: 'cash' });
      post.push(
        { t: 'say', who: 'priya', text: `이번 주는 $${r.short.toFixed(0)} 모자라네요.` },
        { t: 'think', text: '압류 얘기가 나올 줄 알았다.' },
        { t: 'say', who: 'priya', text: '…한 주 미뤄 드릴게요. 모자란 건 다음 주에 같이 내시면 돼요.' },
        { t: 'say', who: 'eli', text: '그래도 돼요? 규정이 있을 텐데.' },
        { t: 'say', who: 'priya', text: '대니얼이라면 이렇게 했을 거예요.' },
        { t: 'think', text: '대니얼. 처음 듣는 이름이다. 물어보기 전에 프리야는 서류를 덮었다.' },
        { t: 'effect', effects: [{ flag: 'heardDanielName' }] },
      );
    } else if (r.paid > 0) {
      post.push(
        { t: 'sfx', id: 'cash' },
        { t: 'say', who: 'priya', text: `$${r.paid.toFixed(0)} 받았어요. $${r.short.toFixed(0)}은 다음 주로 넘어가요.` },
        { t: 'say', who: 'priya', text: '조금이라도 내시면 은행은 기다려요. 한 푼도 없는 주가 세 번 이어지면 안 돼요.' },
      );
    } else if (r.repossess) {
      post.push(
        { t: 'say', who: 'priya', text: '…세 주째예요. 죄송해요. 이번엔 저도 막을 수가 없어요.' },
        { t: 'say', who: 'priya', text: '월요일에 본사 사람들이 메리 루를 가지러 와요.' },
      );
    } else {
      post.push(
        { t: 'say', who: 'priya', text: '이번 주는… 한 푼도 못 받았어요.' },
        r.warning >= 2
          ? { t: 'say', who: 'priya', text: '두 주 연속이에요. 다음 금요일에도 0이면 정말 압류예요. 몇 달러라도 가져오세요.' }
          : { t: 'say', who: 'priya', text: '세 주 연속으로 0이면 은행이 배를 가져가요. 아직은 괜찮아요. 아직은.' },
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
}
