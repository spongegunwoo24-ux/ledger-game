import type Phaser from 'phaser';
import { PALETTE, FONT_TITLE } from '../art/palette';
import { fishTexKey } from '../art/fish';
import { TEX_SCALE } from '../art/pen';
import { sfx } from '../audio/sfx';
import { holdClock, releaseClock } from '../core/clock';
import type { GameState, HeldFish } from '../core/state';
import { BAITS } from '../data/bait';
import { CURIOSITIES } from '../data/catch';
import { fishDef, RARITY_LABEL, type Rarity } from '../data/fish';
import { freshness, heldFishPrice, type Seller } from '../systems/economy';
import { Button, panel } from './Button';
import { txt } from './text';

const RARITY_COLOR: Record<Rarity, number> = {
  common: 0xfffaf0,
  uncommon: 0xdff3e8,
  rare: 0xdbe8ff,
  veryRare: 0xeadcff,
  legendary: 0xffe9a8,
};

export interface BagOptions {
  /** when set, fish cards can be picked and sold to this buyer (morning market) */
  sellTo?: Seller;
  sellLabel?: string;
  onSell?: (uids: number[]) => void;
}

/** a card in the collection: a fish on ice, or a legendary trophy (not for sale) */
interface Card {
  fish?: HeldFish;
  trophy?: string;
}

/**
 * [변경 2] The bag (I / "가방"): fish kept like a collection of picture cards.
 * At the morning market the cards can be ticked and sold; shrimp and crabs are sold together at the market.
 */
export function openInventory(scene: Phaser.Scene, s: GameState, opts: BagOptions = {}) {
  if (scene.children.getByName('inventory')) return;
  const token = {};
  holdClock(token);
  const root = scene.add.container(0, 0).setDepth(1300).setName('inventory');
  const shade = scene.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.45).setOrigin(0).setInteractive();
  root.add(shade);
  const picked = new Set<number>();
  let page = 0;
  let body: Phaser.GameObjects.Container | null = null;

  const cards = (): Card[] => {
    const list: Card[] = [...s.hold.fish]
      .sort((a, b) => heldFishPrice(s, b) - heldFishPrice(s, a))
      .map((f) => ({ fish: f }));
    for (const [k, n] of Object.entries(s.items)) if (k.startsWith('legend_')) for (let i = 0; i < n; i++) list.unshift({ trophy: k.slice(7) });
    return list;
  };

  const draw = () => {
    body?.destroy();
    const c = scene.add.container(0, 0);
    body = c;
    root.add(c);
    const g = scene.add.graphics();
    panel(g, 70, 46, 1140, 640, 0xfbf6e8, 16);
    c.add(g);
    c.add(txt(scene, 640, 80, opts.sellTo ? '가방 · 팔 물고기 고르기' : '가방', { size: 30, fontFamily: FONT_TITLE }).setOrigin(0.5));
    c.add(txt(scene, 1186, 80, '닫기 (I / Esc)', { size: 14, color: '#9a96a8' }).setOrigin(1, 0.5));
    // ---- the fish collection ----
    const list = cards();
    c.add(txt(scene, 100, 108, `물고기 ${s.hold.fish.length}마리`, { size: 20, fontFamily: FONT_TITLE, color: '#b04a52' }));
    const cols = 5;
    const rows = 3;
    const per = cols * rows;
    const pages = Math.max(1, Math.ceil(list.length / per));
    page = Math.min(page, pages - 1);
    if (!list.length) c.add(txt(scene, 420, 330, '아직 얼음에 넣어 둔 물고기가 없다.\n바다에서 F로 낚거나, 그물에 걸린 걸 생선 상자에 넣으면 여기 모인다.', { size: 18, color: '#9a96a8', align: 'center' }).setOrigin(0.5));
    list.slice(page * per, page * per + per).forEach((card, i) => {
      const cx = 160 + (i % cols) * 130;
      const cy = 210 + Math.floor(i / cols) * 150;
      const id = card.fish?.id ?? card.trophy!;
      const def = fishDef(id);
      if (!def) return;
      const on = !!card.fish && picked.has(card.fish.uid);
      const cg = scene.add.graphics();
      cg.fillStyle(RARITY_COLOR[def.rarity], 1).fillRoundedRect(cx - 58, cy - 66, 116, 136, 12);
      cg.lineStyle(on ? 5 : 3, on ? PALETTE.killerRed : PALETTE.ink, 1).strokeRoundedRect(cx - 58, cy - 66, 116, 136, 12);
      c.add(cg);
      const img = scene.add.image(cx, cy - 22, fishTexKey(id));
      img.setScale(Math.min(100 / img.width, 54 / img.height) * TEX_SCALE * 0.5);
      c.add(img);
      c.add(txt(scene, cx, cy + 12, def.name.split(' · ')[0], { size: 15 }).setOrigin(0.5, 0));
      if (card.fish) {
        const fr = freshness(s, card.fish);
        c.add(txt(scene, cx, cy + 32, `${card.fish.inches}인치 · $${heldFishPrice(s, card.fish, opts.sellTo ?? 'cannery').toFixed(2)}`, { size: 13, color: '#2d5fa8' }).setOrigin(0.5, 0));
        c.add(txt(scene, cx, cy + 50, fr < 1 ? `얼음 ${s.day - card.fish.day}일 · ${Math.round(fr * 100)}%` : RARITY_LABEL[def.rarity], { size: 11, color: fr < 1 ? '#b04a52' : '#6b6385' }).setOrigin(0.5, 0));
      } else {
        c.add(txt(scene, cx, cy + 32, '전설 · 팔지 않음', { size: 13, color: '#b07a00' }).setOrigin(0.5, 0));
        c.add(txt(scene, cx, cy + 50, '메이블 가게에서 박제', { size: 11, color: '#6b6385' }).setOrigin(0.5, 0));
      }
      if (on) {
        const mk = scene.add.graphics();
        mk.fillStyle(PALETTE.killerRed, 1).fillCircle(cx + 46, cy - 54, 13);
        mk.lineStyle(3, 0xffffff, 1).beginPath().moveTo(cx + 40, cy - 54).lineTo(cx + 45, cy - 48).lineTo(cx + 53, cy - 60).strokePath();
        c.add(mk);
      }
      if (opts.sellTo && card.fish) {
        const uid = card.fish.uid;
        const z = scene.add.zone(cx - 58, cy - 66, 116, 136).setOrigin(0).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => {
          if (picked.has(uid)) picked.delete(uid);
          else picked.add(uid);
          sfx('click');
          draw();
        });
        c.add(z);
      }
    });
    if (pages > 1) {
      c.add(txt(scene, 420, 650, `${page + 1} / ${pages}`, { size: 15, color: '#6b6385' }).setOrigin(0.5));
      if (page > 0) c.add(new Button(scene, 350, 650, '◀', () => ((page -= 1), draw()), { w: 44, h: 32, size: 16, fill: 0xfff3d6 }));
      if (page < pages - 1) c.add(new Button(scene, 490, 650, '▶', () => ((page += 1), draw()), { w: 44, h: 32, size: 16, fill: 0xfff3d6 }));
    }
    // ---- right column ----
    const rx = 790;
    const sg = scene.add.graphics();
    sg.lineStyle(2, 0xd9cfb8, 1).lineBetween(rx - 20, 110, rx - 20, 660);
    c.add(sg);
    if (opts.sellTo) {
      const sel = s.hold.fish.filter((f) => picked.has(f.uid));
      const total = sel.reduce((a, f) => a + heldFishPrice(s, f, opts.sellTo), 0);
      c.add(txt(scene, rx, 120, opts.sellLabel ?? '듀이 트럭', { size: 20, fontFamily: FONT_TITLE, color: '#b04a52' }));
      c.add(txt(scene, rx, 152, '카드를 눌러 고른다. 안 판 건 얼음에 남고,\n하루 지날 때마다 값이 떨어진다.', { size: 14, color: '#6b6385' }));
      c.add(
        new Button(scene, rx + 90, 222, '전부 고르기', () => {
          for (const f of s.hold.fish) picked.add(f.uid);
          draw();
        }, { w: 170, h: 40, size: 16, fill: 0xfff3d6 }),
      );
      c.add(new Button(scene, rx + 290, 222, '고른 것 취소', () => (picked.clear(), draw()), { w: 170, h: 40, size: 16, fill: 0xfff3d6 }));
      c.add(
        new Button(scene, rx + 190, 286, `고른 ${sel.length}마리 팔기  $${total.toFixed(2)}`, () => {
          if (!sel.length) return;
          opts.onSell?.(sel.map((f) => f.uid));
          picked.clear();
          draw();
        }, { w: 380, h: 54, size: 20, fill: PALETTE.butter, disabled: !sel.length }),
      );
    }
    const y0 = opts.sellTo ? 350 : 120;
    c.add(txt(scene, rx, y0, '새우·게 (어창)', { size: 18, fontFamily: FONT_TITLE, color: '#b04a52' }));
    const h = s.hold;
    const lbs = h.small + h.medium + h.large;
    c.add(txt(scene, rx, y0 + 30, lbs > 0 || h.crabs > 0 ? `새우 ${lbs.toFixed(1)} lb · 게 ${h.crabs}마리${h.golden ? ` · 황금 새우 ${h.golden}` : ''}` : '비어 있다.', { size: 16 }));
    c.add(txt(scene, rx, y0 + 54, '새우와 게는 시장에서 한꺼번에 판다.', { size: 13, color: '#9a96a8' }));
    c.add(txt(scene, rx, y0 + 88, '미끼', { size: 18, fontFamily: FONT_TITLE, color: '#b04a52' }));
    c.add(txt(scene, rx, y0 + 116, BAITS.map((b) => `${b.name} ×${s.bait[b.id] ?? 0}`).join('\n'), { size: 15, lineSpacing: 4 }));
    if (!opts.sellTo) {
      c.add(txt(scene, rx, y0 + 230, '물건', { size: 18, fontFamily: FONT_TITLE, color: '#b04a52' }));
      const things = s.curiosities.map((id) => CURIOSITIES.find((x) => x.id === id)?.name ?? id);
      c.add(txt(scene, rx, y0 + 258, things.length ? things.slice(0, 8).map((t) => `· ${t}`).join('\n') : '아직 없다.', { size: 15, color: things.length ? '#3B3355' : '#9a96a8', lineSpacing: 4 }));
    }
  };
  draw();

  let open = true;
  const close = () => {
    if (!open) return;
    open = false;
    window.removeEventListener('keydown', key);
    releaseClock(token);
    root.destroy();
  };
  const key = (e: KeyboardEvent) => {
    if (e.code === 'KeyI' || e.code === 'Escape') close();
  };
  window.setTimeout(() => {
    if (open) window.addEventListener('keydown', key);
  }, 0);
  shade.on('pointerdown', (p: Phaser.Input.Pointer) => {
    if (p.worldX < 70 || p.worldX > 1210 || p.worldY < 46 || p.worldY > 686) close();
  });
  scene.events.once('shutdown', close);
}
