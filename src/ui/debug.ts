import type Phaser from 'phaser';
import { G } from '../core/game';
import { SEGMENTS, type FeelId, type Segment } from '../core/types';
import { fmtTime, segmentStartTime } from '../core/clock';
import { isPaymentDay } from '../core/calendar';
import { ALL_EVENTS } from '../data/events';
import { FISH } from '../data/fish';
import { EVIDENCE_NAMES } from '../data/evidenceNames';
import { enterSegment } from '../scenes/director';
import { simulateSeason, type Profile } from '../systems/simulate';

/**
 * Debug panel (F9 or ?debug=1). Unavailable in production builds unless ?debug=1.
 * Plain DOM so it works on top of any scene.
 */
const TRUTHS = [
  '캘빈 쇼가 얼 테이트, 그렉 할보슨, 토미 레예스, 샐 모레티, 대니얼 웹을 사라지게 했다.',
  '준 파이크는 남편 파이크 박사가 죽였다. 캘빈은 알고 있고 그것으로 파이크를 쥐고 있다.',
  '에디스 클레이는 치매로 밤에 걷다가 바다에 빠진 사고였다.',
  '월트는 등대 앞 "그 자리"에서 밤에 그물질하다 대니얼을 건졌고, 추 없이 해류에 돌려보냈다.',
  '거스는 캘빈이 선창에 증거품을 심는 걸 봤고, 무릎 꿇고 빌었고, 거짓 증언을 했다.',
  '토비는 거스의 고백을 우연히 듣고 캘빈에게 순진하게 전했다 (Day 44).',
  '캘빈은 Day 44 밤 거스를 데려갔다. Day 45 새벽 캘빈의 배가 더 깊이 잠긴다.',
];

let panelEl: HTMLDivElement | null = null;
let truthsEl: HTMLDivElement | null = null;

export function debugAllowed(): boolean {
  const q = new URLSearchParams(window.location.search).get('debug') === '1';
  return import.meta.env.DEV || q;
}

function activeScene(game: Phaser.Game): Phaser.Scene | null {
  const list = game.scene.getScenes(true).filter((s) => s.scene.key !== 'Pause');
  return list[0] ?? null;
}

function restartFlow(game: Phaser.Game) {
  for (const sc of game.scene.getScenes(true)) if (sc.scene.key === 'Pause') sc.scene.stop();
  const sc = activeScene(game);
  if (sc) enterSegment(sc);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text) e.textContent = text;
  return e;
}

function row(label: string, ...children: HTMLElement[]): HTMLDivElement {
  const r = el('div', { style: 'display:flex;gap:6px;align-items:center;margin:4px 0;flex-wrap:wrap' });
  r.appendChild(el('span', { style: 'min-width:70px;color:#ffe29a' }, label));
  children.forEach((c) => r.appendChild(c));
  return r;
}

function btn(text: string, fn: () => void): HTMLButtonElement {
  const b = el('button', { style: 'background:#ffe29a;border:2px solid #3b3355;border-radius:8px;padding:2px 8px;cursor:pointer' }, text);
  b.onclick = fn;
  return b;
}

function input(value: string, w = 60): HTMLInputElement {
  return el('input', { value, style: `width:${w}px` });
}

export function toggleDebug(game: Phaser.Game) {
  if (panelEl) {
    panelEl.remove();
    panelEl = null;
    return;
  }
  const p = el('div', {
    style:
      'position:fixed;top:8px;right:8px;width:360px;max-height:94vh;overflow:auto;background:rgba(36,30,58,.94);color:#fffaf0;font:13px sans-serif;padding:10px;border-radius:12px;z-index:9999',
  });
  p.appendChild(el('div', { style: 'font-weight:bold;font-size:15px;margin-bottom:6px' }, '디버그 (F9)'));
  const s = () => G.state;
  const info = el('div', { style: 'margin-bottom:6px;color:#c9b6e4' });
  const refreshInfo = () => {
    const od = s().overdue;
    info.textContent = `Day ${s().day} ${s().segment} ${fmtTime(s().time)} · $${s().money.toFixed(2)} · 빚 $${s().debt}${od ? ` · 연체 $${od.amount} (Day ${od.deadlineDay})` : ''} · 미납 ${s().shortfalls}회`;
  };
  refreshInfo();
  const timer = window.setInterval(() => (panelEl ? refreshInfo() : window.clearInterval(timer)), 1000);
  p.appendChild(info);

  const day = input(String(s().day), 50);
  const seg = el('select');
  for (const sg of SEGMENTS) seg.appendChild(el('option', { value: sg }, sg));
  seg.value = s().segment;
  p.appendChild(
    row(
      '날짜',
      day,
      seg,
      btn('이동', () => {
        s().day = Math.max(1, Math.min(70, Number(day.value) || 1));
        s().segment = seg.value as Segment;
        s().slotsUsed = 0;
        s().lettersToday = 0;
        s().time = segmentStartTime(s().segment, s().day);
        refreshInfo();
        restartFlow(game);
      }),
    ),
  );
  // [변경 1] clock, payment-failure and legendary tests
  const clk = input(fmtTime(s().time), 50);
  p.appendChild(
    row(
      '시계',
      clk,
      btn('설정', () => {
        const [h, m] = clk.value.split(':').map((x) => Number(x) || 0);
        s().time = h * 60 + m;
        refreshInfo();
      }),
    ),
  );
  const jumpAfternoon = (day: number) => {
    s().day = day;
    s().segment = 'afternoon';
    s().time = 16 * 60 + 55;
    s().money = 0;
    s().slotsUsed = 1;
    refreshInfo();
    restartFlow(game);
  };
  p.appendChild(
    row(
      '상환',
      btn('다음 금요일 16:55 · 돈 0', () => {
        let d = s().day;
        while (!isPaymentDay(d) || s().flags[`paid_${d}`]) d++;
        jumpAfternoon(d);
      }),
      btn('연체 마감 월요일 16:55 · 돈 0', () => {
        const od = s().overdue;
        if (od) jumpAfternoon(od.deadlineDay);
      }),
    ),
  );
  const fishSel = el('select', { style: 'width:150px' });
  for (const f of [...FISH].sort((a, b) => (a.rarity === 'legendary' ? -1 : 0) - (b.rarity === 'legendary' ? -1 : 0)))
    fishSel.appendChild(el('option', { value: f.id }, `${f.name} (${f.rarity})`));
  p.appendChild(
    row(
      '물고기',
      fishSel,
      btn('바다에 소환', () => {
        const sea = (window as unknown as { __sea?: { forceFish(id: string): unknown; scene: Phaser.Scenes.ScenePlugin } }).__sea;
        if (sea && sea.scene.isActive()) sea.forceFish(fishSel.value);
        else window.alert('바다(그물질 화면)에서만 쓸 수 있다.');
      }),
    ),
  );
  const money = input(String(s().money), 70);
  p.appendChild(
    row(
      '돈',
      money,
      btn('설정', () => {
        s().money = Number(money.value) || 0;
        refreshInfo();
      }),
    ),
  );
  const fid = el('select');
  for (const k of Object.keys(s().feelings)) fid.appendChild(el('option', { value: k }, k));
  const fv = input('60', 40);
  p.appendChild(
    row(
      '호감',
      fid,
      fv,
      btn('설정', () => {
        s().feelings[fid.value as FeelId] = Math.max(0, Math.min(100, Number(fv.value) || 0));
      }),
    ),
  );
  const fl = input('', 120);
  p.appendChild(
    row(
      '플래그',
      fl,
      btn('켜기', () => (s().flags[fl.value] = true)),
      btn('끄기', () => delete s().flags[fl.value]),
    ),
  );
  const ev = el('select', { style: 'width:150px' });
  for (const k of Object.keys(EVIDENCE_NAMES)) ev.appendChild(el('option', { value: k }, k));
  p.appendChild(
    row(
      '증거',
      ev,
      btn('주기', () => {
        if (!s().evidence.includes(ev.value)) s().evidence.push(ev.value);
      }),
    ),
  );
  const it = input('', 120);
  p.appendChild(row('아이템', it, btn('주기', () => (s().items[it.value] = (s().items[it.value] ?? 0) + 1))));
  const evs = el('select', { style: 'width:180px' });
  for (const e of ALL_EVENTS) evs.appendChild(el('option', { value: e.id }, e.id));
  p.appendChild(
    row(
      '이벤트',
      evs,
      btn('실행', () => {
        const sc = activeScene(game);
        if (sc) sc.scene.start('Cutscene', { eventId: evs.value, then: 'segment' });
      }),
    ),
  );
  p.appendChild(
    row(
      '진실',
      btn('숨은 진실 보기', () => {
        if (truthsEl) {
          truthsEl.remove();
          truthsEl = null;
          return;
        }
        truthsEl = el('div', {
          style:
            'position:fixed;left:8px;bottom:8px;width:520px;background:rgba(120,20,40,.9);color:#fff;font:13px sans-serif;padding:10px;border-radius:10px;z-index:9998',
        });
        truthsEl.appendChild(el('div', { style: 'font-weight:bold' }, '숨은 진실 (테스트 전용)'));
        TRUTHS.forEach((t) => truthsEl!.appendChild(el('div', {}, '· ' + t)));
        document.body.appendChild(truthsEl);
      }),
    ),
  );
  const prof = el('select');
  for (const k of ['poor', 'average', 'great']) prof.appendChild(el('option', { value: k }, k));
  const nd = input('63', 40);
  const out = el('pre', { style: 'white-space:pre-wrap;font-size:11px;color:#a8e6cf;max-height:200px;overflow:auto' });
  p.appendChild(
    row(
      '시뮬',
      prof,
      nd,
      btn('일수만큼 자동 진행', () => {
        const r = simulateSeason(prof.value as Profile, Number(nd.value) || 63, s().seed);
        out.textContent = r.log.join('\n');
      }),
    ),
  );
  p.appendChild(out);
  p.appendChild(row('저장', btn('상태 JSON 복사', () => void navigator.clipboard?.writeText(JSON.stringify(s())))));
  document.body.appendChild(p);
  panelEl = p;
}

export function installDebug(game: Phaser.Game) {
  if (!debugAllowed()) return;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F9') {
      e.preventDefault();
      toggleDebug(game);
    }
  });
  if (new URLSearchParams(window.location.search).get('debug') === '1') {
    setTimeout(() => toggleDebug(game), 800);
  }
}
