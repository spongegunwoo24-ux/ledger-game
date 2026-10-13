import type Phaser from 'phaser';
import { PALETTE, FONT_TITLE, FONT_HAND } from '../art/palette';
import { holdClock, releaseClock } from '../core/clock';
import type { GameState } from '../core/state';
import { eliNameScribbled, isAnonymous, orderDone, orderLabel, ranking, todaysOrders } from '../systems/board';
import { panel } from './Button';
import { txt } from './text';

/** [변경 2] The harbor board up close: today's orders and this week's fishermen ranking. */
export function openBoard(scene: Phaser.Scene, s: GameState) {
  const token = {};
  holdClock(token);
  const c = scene.add.container(0, 0).setDepth(1250);
  const shade = scene.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.5).setOrigin(0).setInteractive();
  const g = scene.add.graphics();
  g.fillStyle(0x6b4a32, 1).fillRoundedRect(150, 70, 980, 590, 16);
  g.lineStyle(5, PALETTE.ink, 1).strokeRoundedRect(150, 70, 980, 590, 16);
  panel(g, 180, 100, 440, 530, 0xfbf1d9, 6);
  panel(g, 650, 100, 450, 530, 0xfbf1d9, 6);
  c.add([shade, g]);
  c.add(txt(scene, 400, 130, '오늘의 주문', { size: 26, fontFamily: FONT_TITLE }).setOrigin(0.5));
  const orders = todaysOrders(s);
  if (!orders.length) c.add(txt(scene, 400, 200, '아직 붙은 주문이 없다.', { size: 18, color: '#9a96a8' }).setOrigin(0.5));
  orders.forEach((o, i) => {
    const y = 180 + i * 120;
    c.add(txt(scene, 210, y, o.from, { size: 20, fontFamily: FONT_HAND, color: '#3B3355' }));
    c.add(txt(scene, 210, y + 30, `${orderLabel(o)} · 웃돈 $${o.bonus}`, { size: 19 }));
    const done = orderDone(s, o);
    const note = done ? (s.flags[`order_${s.day}_${o.idx}`] === 'anon' ? '납품함 (익명)' : '납품함') : isAnonymous(s, o) ? '나한테서라면 안 받는다. 듀이 편에 익명으로.' : '아침 시장에서 납품';
    c.add(txt(scene, 210, y + 60, note, { size: 15, color: done ? '#2f8f5f' : '#9a96a8' }));
  });
  c.add(txt(scene, 875, 130, '이번 주 어부 순위 (lb)', { size: 24, fontFamily: FONT_TITLE }).setOrigin(0.5));
  ranking(s).forEach((r, i) => {
    const y = 172 + i * 50;
    const col = r.eli ? '#b04a52' : '#3B3355';
    c.add(txt(scene, 690, y, `${i + 1}.`, { size: 20, fontFamily: FONT_HAND, color: col }));
    const name = txt(scene, 730, y, r.name, { size: 22, fontFamily: FONT_HAND, color: col });
    c.add(name);
    c.add(txt(scene, 1070, y, `${r.lbs}`, { size: 22, fontFamily: FONT_HAND, color: col }).setOrigin(1, 0));
    if (r.eli && eliNameScribbled(s)) {
      const sg = scene.add.graphics();
      sg.lineStyle(4, PALETTE.killerRed, 0.9);
      for (let k = 0; k < 3; k++) sg.lineBetween(name.x - 4, name.y + 8 + k * 6, name.x + name.width + 4, name.y + 4 + k * 7);
      c.add(sg);
      c.add(txt(scene, name.x + name.width + 14, y + 2, '살인마 아들', { size: 16, fontFamily: FONT_HAND, color: '#D7263D' }));
    }
  });
  c.add(txt(scene, 875, 600, '순위가 오르면 어부들 눈빛이 달라진다.', { size: 14, color: '#9a96a8' }).setOrigin(0.5));
  c.add(txt(scene, 640, 645, '아무 데나 누르면 닫힘', { size: 14, color: '#FFFAF0' }).setOrigin(0.5));
  let open = true;
  const close = () => {
    if (!open) return;
    open = false;
    releaseClock(token);
    window.removeEventListener('keydown', key);
    c.destroy();
  };
  const key = (e: KeyboardEvent) => {
    if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') close();
  };
  window.setTimeout(() => {
    if (!open) return;
    shade.on('pointerdown', close);
    window.addEventListener('keydown', key);
  }, 200);
  scene.events.once('shutdown', close);
}
