import type Phaser from 'phaser';
import { PALETTE } from '../art/palette';
import { fishTexKey } from '../art/fish';
import type { GameState } from '../core/state';
import { CURIOSITIES, SHRIMP_SPECIES, SHRIMP_SPECIES_NAME, SHRIMP_TINT } from '../data/catch';
import { FISH, RARITY_LABEL } from '../data/fish';
import { FINDS } from '../data/finds';
import { txt } from './text';

/** [변경 2] 도감: 36 fish, 3 shrimp, curiosities from the net, beach finds. Unknown ones are silhouettes. */
export function drawEncyclopedia(scene: Phaser.Scene, body: Phaser.GameObjects.Container, s: GameState): number {
  let y = 0;
  const caught = FISH.filter((f) => s.fishLog[f.id]).length;
  body.add(txt(scene, 260, y, `물고기 ${caught} / ${FISH.length}`, { size: 18, color: '#b04a52' }));
  y += 30;
  const cols = 6;
  FISH.forEach((f, i) => {
    const x = 300 + (i % cols) * 128;
    const yy = y + Math.floor(i / cols) * 104;
    const log = s.fishLog[f.id];
    const g = scene.add.graphics();
    g.fillStyle(log ? 0xfffaf0 : 0xe9e4d8, 1).fillRoundedRect(x - 56, yy, 116, 96, 10).lineStyle(2, PALETTE.ink, 0.5).strokeRoundedRect(x - 56, yy, 116, 96, 10);
    body.add(g);
    const img = scene.add.image(x + 2, yy + 32, fishTexKey(f.id));
    img.setScale(Math.min(96 / img.width, 44 / img.height));
    if (!log) img.setTint(0x3b3355).setAlpha(0.35);
    body.add(img);
    body.add(txt(scene, x + 2, yy + 58, log ? f.name.split(' · ')[0] : `No.${f.no} ???`, { size: 13, color: log ? '#3B3355' : '#9a96a8' }).setOrigin(0.5, 0));
    body.add(txt(scene, x + 2, yy + 76, log ? `${log.count}마리 · 최고 ${log.best}인치` : RARITY_LABEL[f.rarity], { size: 11, color: '#6b6385' }).setOrigin(0.5, 0));
  });
  y += Math.ceil(FISH.length / cols) * 104 + 16;
  body.add(txt(scene, 260, y, `새우 ${SHRIMP_SPECIES.filter((sp) => s.shrimpSeen.includes(sp)).length} / ${SHRIMP_SPECIES.length}`, { size: 18, color: '#b04a52' }));
  y += 30;
  SHRIMP_SPECIES.forEach((sp, i) => {
    const seen = s.shrimpSeen.includes(sp);
    const x = 300 + i * 200;
    const img = scene.add.image(x, y + 20, 'it_shrimp_large').setScale(0.7);
    if (seen) img.setTint(SHRIMP_TINT[sp]);
    else img.setTint(0x3b3355).setAlpha(0.35);
    body.add(img);
    body.add(txt(scene, x + 40, y + 10, seen ? SHRIMP_SPECIES_NAME[sp] : '???', { size: 16, color: seen ? '#3B3355' : '#9a96a8' }));
  });
  y += 60;
  const curio = CURIOSITIES.filter((c) => s.curiosities.includes(c.id));
  body.add(txt(scene, 260, y, `그물에서 나온 물건 ${curio.length} / ${CURIOSITIES.length}`, { size: 18, color: '#b04a52' }));
  y += 28;
  for (const c of CURIOSITIES) {
    const have = s.curiosities.includes(c.id);
    body.add(txt(scene, 276, y, have ? `· ${c.name} — ${c.desc}` : '· ???', { size: 16, color: have ? '#3B3355' : '#9a96a8', wordWrap: { width: 760 } }));
    y += 26;
  }
  y += 12;
  const finds = FINDS.filter((f) => s.finds[f.id]);
  body.add(txt(scene, 260, y, `해변에서 주운 것 ${finds.length} / ${FINDS.length}`, { size: 18, color: '#b04a52' }));
  y += 28;
  for (const f of FINDS) {
    const n = s.finds[f.id] ?? 0;
    const g = scene.add.graphics();
    g.fillStyle(n ? f.color : 0xd9d4e3, 1).fillCircle(284, y + 10, 8).lineStyle(2, PALETTE.ink, 0.6).strokeCircle(284, y + 10, 8);
    body.add(g);
    body.add(txt(scene, 300, y, n ? `${f.name} ×${n} — ${f.desc}` : '???', { size: 16, color: n ? '#3B3355' : '#9a96a8', wordWrap: { width: 740 } }));
    y += 28;
  }
  return y + 20;
}
