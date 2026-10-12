import Phaser from 'phaser';
import { PALETTE, FONT_HAND } from '../art/palette';
import { portraitKey } from '../art/characters';
import { weekOf } from '../core/calendar';
import { check } from '../core/conditions';
import { holdClock, releaseClock } from '../core/clock';
import { G } from '../core/game';
import { ALL_EVENTS } from '../data/events';
import { PEOPLE } from '../data/people';
import { CHAR_NAMES } from '../data/names';
import { feelStateOf, FEEL_ICON } from '../systems/feelings';
import { notebookEntries, paymentStatusLine } from '../systems/notebook';
import { questDef } from '../systems/quests';
import { panel } from './Button';
import { txt } from './text';

type Tab = 'situation' | 'quests' | 'story';
const TAB_LABEL: Record<Tab, string> = { situation: '지금 상황', quests: '퀘스트', story: '지난 이야기' };

let lastTab: Tab = 'quests';

/** [변경 1] The notebook: "지금 상황" / "퀘스트" (click to track) / "지난 이야기". */
export function openNotebook(scene: Phaser.Scene, tab: Tab = lastTab) {
  if (scene.children.getByName('notebook')) return;
  lastTab = tab;
  const token = {};
  holdClock(token);
  const c = scene.add.container(0, 0).setDepth(1300).setName('notebook');
  const shade = scene.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.45).setOrigin(0).setInteractive();
  c.add(shade);
  const g = scene.add.graphics();
  panel(g, 200, 50, 880, 630, 0xfbf6e8, 14);
  g.fillStyle(PALETTE.coral, 1).fillRect(200, 50, 30, 630);
  c.add(g);
  const close = () => {
    scene.input.off('wheel', wheel);
    window.removeEventListener('keydown', key);
    releaseClock(token);
    maskG.destroy();
    c.destroy();
  };
  // tabs
  (Object.keys(TAB_LABEL) as Tab[]).forEach((t, i) => {
    const tx = 300 + i * 170;
    const tg = scene.add.graphics();
    tg.fillStyle(t === tab ? PALETTE.butter : 0xe9e0f7, 1).fillRoundedRect(tx - 70, 66, 140, 40, 12).lineStyle(2, PALETTE.ink).strokeRoundedRect(tx - 70, 66, 140, 40, 12);
    const tt = txt(scene, tx, 86, TAB_LABEL[t], { size: 19 }).setOrigin(0.5);
    const z = scene.add.zone(tx - 70, 66, 140, 40).setOrigin(0).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => {
      close();
      openNotebook(scene, t);
    });
    c.add([tg, tt, z]);
  });
  c.add(txt(scene, 1050, 86, '✕', { size: 26 }).setOrigin(0.5));
  const body = scene.add.container(0, 0);
  const viewTop = 120;
  const viewH = 540;
  const height = drawTab(scene, body, tab, () => {
    close();
    openNotebook(scene, tab);
  });
  body.y = viewTop;
  const maskG = scene.make.graphics({}, false);
  maskG.fillRect(240, viewTop, 820, viewH);
  body.setMask(maskG.createGeometryMask());
  c.add(body);
  const minY = viewTop + Math.min(0, viewH - height);
  const scroll = (dy: number) => (body.y = Phaser.Math.Clamp(body.y - dy, minY, viewTop));
  const wheel = (_p: unknown, _o: unknown, _dx: number, dy: number) => scroll(dy * 0.6);
  scene.input.on('wheel', wheel);
  const key = (e: KeyboardEvent) => {
    if (e.code === 'Escape' || e.code === 'KeyN') close();
    if (e.code === 'ArrowDown') scroll(40);
    if (e.code === 'ArrowUp') scroll(-40);
  };
  setTimeout(() => window.addEventListener('keydown', key), 0);
  c.add(txt(scene, 640, 668, '바깥을 누르거나 N·Esc로 닫기 · 휠로 스크롤', { size: 14, color: '#9a96a8' }).setOrigin(0.5));
  shade.on('pointerdown', (p: Phaser.Input.Pointer) => {
    if (p.worldX < 200 || p.worldX > 1080 || p.worldY < 50 || p.worldY > 680 || (p.worldX > 1030 && p.worldY < 110)) close();
  });
}

function section(scene: Phaser.Scene, body: Phaser.GameObjects.Container, y: number, head: string, text: string): number {
  body.add(txt(scene, 260, y, head, { size: 18, color: '#b04a52' }));
  const t = txt(scene, 260, y + 26, text, { size: 20, wordWrap: { width: 780, useAdvancedWrap: true }, lineSpacing: 6 });
  body.add(t);
  return y + 26 + t.height + 18;
}

function drawTab(scene: Phaser.Scene, body: Phaser.GameObjects.Container, tab: Tab, redraw: () => void): number {
  const s = G.state;
  let y = 0;
  if (tab === 'situation') {
    y = section(scene, body, y, '나는 누구', '일라이 할로우, 서른두 살. 도시에서 직업 없이 친구 집 소파를 전전했다. 새우는 싫어한다.');
    y = section(
      scene,
      body,
      y,
      '여기 있는 이유',
      '사형당한 아버지 월트의 장례식 때문에 10년 만에 고향 펠리컨 코브에 왔다. 아버지가 남긴 배 메리 루 호에 은행 빚 4,250달러가 묶여 있어서, 이번 새우잡이 철 10주 동안 배를 몰아 갚아야 한다.',
    );
    y = section(
      scene,
      body,
      y,
      '이번 주 상환',
      `${paymentStatusLine(s)}\n남은 빚 $${s.debt.toFixed(0)}. 매주 금요일 오후 5시 마감. 모자라면 한 번은 경고(월요일 5시까지 연체료 10%), 두 번째는 압류.`,
    );
    let caseText = '아버지 월트 할로우는 "펠리컨 코브 연쇄 실종 사건"(실종 7건)의 범인으로 올봄 사형되었다. 사건을 맡았던 사람은 은퇴한 주 수사관 캘빈 쇼. 마을 사람들은 사건이 끝났다고 말한다.';
    if (weekOf(s.day) >= 6) caseText += '\n그런데 이상한 점이 있다…';
    y = section(scene, body, y, '아버지 사건', caseText);
    body.add(txt(scene, 260, y, '만난 사람', { size: 18, color: '#b04a52' }));
    y += 30;
    for (const p of PEOPLE.filter((x) => check(s, x.met))) {
      body.add(scene.add.image(290, y + 26, p.id === 'ledger' ? 'por_ledger' : portraitKey(p.id)).setScale(0.22));
      const rel = p.feel ? (p.id === 'calvin' ? '신뢰' : feelStateOf(s.feelings[p.feel] ?? 0)) : '';
      body.add(txt(scene, 330, y + 4, `${CHAR_NAMES[p.id]}${rel ? `  ${FEEL_ICON[rel as keyof typeof FEEL_ICON]} ${rel}` : ''}`, { size: 19 }));
      const t = txt(scene, 330, y + 28, p.intro, { size: 16, color: '#6b6385', wordWrap: { width: 700 } });
      body.add(t);
      y += Math.max(58, t.height + 36);
    }
    return y;
  }
  if (tab === 'quests') {
    const entries = notebookEntries(s);
    body.add(txt(scene, 260, y, '메인', { size: 18, color: '#b04a52' }));
    y += 28;
    for (const e of entries.filter((x) => x.pinned)) {
      body.add(txt(scene, 270, y, `📌 ${e.when}, ${e.where}`, { size: 17, color: '#6b6385' }));
      body.add(txt(scene, 300, y + 22, e.text, { size: 26, fontFamily: FONT_HAND, color: '#2d5fa8' }));
      y += 62;
    }
    y += 6;
    body.add(txt(scene, 260, y, '서브 (누르면 추적)', { size: 18, color: '#b04a52' }));
    y += 28;
    const subs = entries.filter((x) => x.questId);
    if (!subs.length) {
      body.add(txt(scene, 270, y, '지금 진행 중인 부탁은 없다.', { size: 18, color: '#9a96a8' }));
      y += 36;
    }
    for (const e of subs) {
      const tracked = s.trackedQuest === e.questId || (!s.trackedQuest && e === subs[0]);
      const bg = scene.add.graphics();
      bg.fillStyle(tracked ? 0xfff0b8 : 0xfffaf0, 1).fillRoundedRect(260, y - 4, 780, 76, 10).lineStyle(2, PALETTE.ink, 0.6).strokeRoundedRect(260, y - 4, 780, 76, 10);
      body.add(bg);
      body.add(txt(scene, 276, y + 2, `${tracked ? '▶ ' : ''}${e.questTitle} · ${e.progress}`, { size: 17, color: tracked ? '#b04a52' : '#6b6385' }));
      body.add(txt(scene, 290, y + 24, `${e.when} (${e.timeHint}), ${e.where}: ${e.text}`, { size: 24, fontFamily: FONT_HAND, color: '#2d5fa8', wordWrap: { width: 740 } }));
      const z = scene.add.zone(260, y - 4, 780, 76).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        s.trackedQuest = e.questId ?? null;
        redraw();
      });
      body.add(z);
      y += 86;
    }
    const done = Object.keys(s.quests).filter((k) => s.quests[k].state === 'done');
    if (done.length) {
      body.add(txt(scene, 260, y, '끝낸 일', { size: 18, color: '#b04a52' }));
      y += 28;
      for (const k of done) {
        body.add(txt(scene, 276, y, `✔ ${questDef(k)?.title ?? k}`, { size: 18, color: '#2f8f5f' }));
        y += 30;
      }
    }
    y += 8;
    body.add(txt(scene, 260, y, '오늘의 주문', { size: 18, color: '#b04a52' }));
    y += 28;
    body.add(txt(scene, 276, y, '항구 게시판에 아직 주문이 붙지 않았다.', { size: 18, color: '#9a96a8' }));
    return y + 40;
  }
  // story
  if (!s.story.length) {
    body.add(txt(scene, 260, 0, '아직 적은 게 없다.', { size: 18, color: '#9a96a8' }));
    return 40;
  }
  for (const st of [...s.story].reverse()) {
    const ev = ALL_EVENTS.find((e) => e.id === st.id);
    if (!ev) continue;
    body.add(txt(scene, 260, y, `${st.day}일째${st.skipped ? ' · 건너뜀' : ''}`, { size: 15, color: '#9a96a8' }));
    const t = txt(scene, 260, y + 20, ev.summary, { size: 19, wordWrap: { width: 780, useAdvancedWrap: true }, lineSpacing: 4 });
    body.add(t);
    y += t.height + 36;
  }
  return y;
}
