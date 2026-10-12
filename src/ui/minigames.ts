import Phaser from 'phaser';
import { PALETTE, SHADE, FONT_TITLE, CSS } from '../art/palette';
import { addSprite } from '../art/manifest';
import { sfx } from '../audio/sfx';
import type { MinigameId } from '../core/events';
import { G } from '../core/game';
import { TEST_MODE } from '../core/view';
import { Button, panel } from './Button';
import { txt } from './text';

const DEPTH = 1100;

/**
 * Small tactile minigames used inside scripted scenes. None of them can be failed
 * and none has a timer; the score (0..1) only changes a line or two.
 * The result is stored as flag `mg_<id>` (score) and `mg_<id>_good` (score ≥ 0.7).
 */
export async function runMinigame(scene: Phaser.Scene, id: MinigameId, params: Record<string, unknown>): Promise<number> {
  let score = 1;
  if (TEST_MODE && (window as unknown as { __autoMinigame?: boolean }).__autoMinigame) id = 'skip' as MinigameId;
  switch (id) {
    case 'knot':
      score = await knot(scene, Number(params.points ?? 6));
      break;
    case 'paint':
      score = await paint(scene, String(params.word ?? 'KILLER'), params.calvin === true);
      break;
    case 'search':
      score = await search(scene, params);
      break;
    case 'carry':
      score = await carry(scene, String(params.label ?? '얼음'), Number(params.count ?? 3));
      break;
    case 'photo':
      score = await photo(scene, String(params.subject ?? 'it_shrimp_large'), String(params.caption ?? ''));
      break;
  }
  G.state.flags[`mg_${id}`] = Math.round(score * 100) / 100;
  G.state.flags[`mg_${id}_good`] = score >= 0.7;
  return score;
}

function frame(scene: Phaser.Scene, title: string, hint: string) {
  const c = scene.add.container(0, 0).setDepth(DEPTH);
  c.add(scene.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.55).setOrigin(0).setInteractive());
  const g = scene.add.graphics();
  panel(g, 140, 40, 1000, 640, 0xfff3d6, 24);
  c.add(g);
  c.add(txt(scene, 640, 82, title, { size: 32, fontFamily: FONT_TITLE }).setOrigin(0.5));
  const h = txt(scene, 640, 640, hint, { size: 20, color: '#6b6385', align: 'center' }).setOrigin(0.5);
  c.add(h);
  return { c, hint: h };
}

// ---------------- knot: net mending ----------------
function knot(scene: Phaser.Scene, n: number): Promise<number> {
  return new Promise((resolve) => {
    const { c, hint } = frame(scene, '그물 수선', '번호 순서대로 그물코를 눌러 줄을 꿰자. 1번부터.');
    const g = scene.add.graphics();
    c.add(g);
    // net mesh
    g.lineStyle(3, 0x7f9f80, 1);
    for (let i = 0; i <= 12; i++) {
      g.lineBetween(260 + i * 64, 140, 260 + i * 64 - 120, 600);
      g.lineBetween(260 + i * 64 - 120, 140, 260 + i * 64, 600);
    }
    // the hole
    g.fillStyle(0xfff3d6, 1);
    g.fillEllipse(640, 370, 300, 220);
    g.lineStyle(3, 0x5f7f60, 1);
    g.strokeEllipse(640, 370, 300, 220);
    const pts: { x: number; y: number }[] = [];
    // zig-zag lacing order across the hole
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const t = i / (n - 1);
      pts.push({ x: 640 + side * 150 * Math.sin(Math.PI * (0.25 + t * 0.5)), y: 270 + t * 200 });
    }
    const rope = scene.add.graphics();
    c.add(rope);
    let next = 0;
    let errors = 0;
    const dots: Phaser.GameObjects.Container[] = [];
    pts.forEach((p, i) => {
      const dg = scene.add.graphics();
      dg.fillStyle(PALETTE.butter, 1).fillCircle(0, 0, 22).lineStyle(3, PALETTE.ink, 1).strokeCircle(0, 0, 22);
      const t = txt(scene, 0, 0, String(i + 1), { size: 22 }).setOrigin(0.5);
      const d = scene.add.container(p.x, p.y, [dg, t]).setSize(52, 52).setInteractive({ useHandCursor: true });
      d.on('pointerdown', () => {
        if (i === next) {
          sfx('tick');
          sfx('brush');
          dg.clear().fillStyle(PALETTE.mint, 1).fillCircle(0, 0, 22).lineStyle(3, PALETTE.ink, 1).strokeCircle(0, 0, 22);
          if (i > 0) {
            rope.lineStyle(6, 0xd9b48a, 1);
            rope.lineBetween(pts[i - 1].x, pts[i - 1].y, p.x, p.y);
          }
          scene.tweens.add({ targets: d, scale: 1.25, yoyo: true, duration: 90 });
          next++;
          if (next >= n) {
            hint.setText(errors <= 1 ? '단단하게 묶였다.' : '조금 삐뚤지만 버틸 거다.');
            sfx('chime');
            scene.time.delayedCall(900, () => {
              c.destroy();
              resolve(Math.max(0, 1 - errors * 0.15));
            });
          }
        } else if (i > next) {
          errors++;
          sfx('reject');
          scene.tweens.add({ targets: d, x: p.x + 6, yoyo: true, repeat: 2, duration: 40 });
          hint.setText(`그건 ${i + 1}번. 지금은 ${next + 1}번이다.`);
        }
      });
      c.add(d);
      dots.push(d);
    });
  });
}

// ---------------- paint: cover the graffiti ----------------
function paint(scene: Phaser.Scene, word: string, withCalvin: boolean): Promise<number> {
  return new Promise((resolve) => {
    const { c, hint } = frame(scene, '페인트칠', withCalvin ? '붓으로 글자를 덮자. 드래그해서 칠한다. 캘빈 씨가 반대쪽을 맡았다.' : '붓으로 글자를 덮자. 드래그해서 칠한다.');
    const hull = scene.add.graphics();
    hull.fillStyle(SHADE.white, 1).fillRoundedRect(200, 180, 880, 360, 20).lineStyle(4, PALETTE.ink, 1).strokeRoundedRect(200, 180, 880, 360, 20);
    hull.fillStyle(PALETTE.coral, 1).fillRect(200, 470, 880, 30);
    c.add(hull);
    const graffiti = txt(scene, 640, 340, word, { size: 150, color: CSS.killerRed, fontFamily: FONT_TITLE }).setOrigin(0.5).setAngle(-4);
    c.add(graffiti);
    const paintLayer = scene.add.graphics();
    c.add(paintLayer);
    const cols = 22;
    const rows = 6;
    const bx = 220;
    const by = 230;
    const cw = 840 / cols;
    const rh = 240 / rows;
    const covered = new Set<number>();
    const total = cols * rows;
    const brush = (x: number, y: number) => {
      paintLayer.fillStyle(SHADE.white, 0.95);
      paintLayer.fillCircle(x, y, 26);
      const ci = Math.floor((x - bx) / cw);
      const ri = Math.floor((y - by) / rh);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          const cc = ci + dx;
          const rr = ri + dy;
          if (cc >= 0 && cc < cols && rr >= 0 && rr < rows) covered.add(rr * cols + cc);
        }
    };
    // Calvin paints the right half by himself, slowly
    let cx = 1040;
    let cy = 250;
    let dir = 1;
    let calvinTimer: Phaser.Time.TimerEvent | null = null;
    if (withCalvin) {
      const calvin = addSprite(scene, 1040, 600, 'ch_calvin', 1.2);
      c.add(calvin);
      calvinTimer = scene.time.addEvent({
        delay: 70,
        loop: true,
        callback: () => {
          brush(cx, cy);
          cy += 14 * dir;
          if (cy > 460 || cy < 240) {
            dir *= -1;
            cx -= 34;
          }
          if (cx < 660) calvinTimer?.remove();
        },
      });
    }
    let last = 0;
    const zone = scene.add.zone(200, 180, 880, 360).setOrigin(0).setInteractive({ useHandCursor: true });
    c.add(zone);
    const onMove = (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      brush(p.worldX, p.worldY);
      if (scene.time.now - last > 140) {
        sfx('brush');
        last = scene.time.now;
      }
      if (covered.size / total > 0.86) finish();
    };
    zone.on('pointermove', onMove);
    zone.on('pointerdown', onMove);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      calvinTimer?.remove();
      paintLayer.fillStyle(SHADE.white, 1).fillRect(210, 200, 860, 268);
      hint.setText('다 덮었다. 냄새는 한참 가겠지만.');
      sfx('chime');
      scene.time.delayedCall(1000, () => {
        c.destroy();
        resolve(1);
      });
    };
  });
}

// ---------------- search: dunes ----------------
function search(scene: Phaser.Scene, params: Record<string, unknown>): Promise<number> {
  return new Promise((resolve) => {
    const { c, hint } = frame(scene, String(params.title ?? '모래언덕 수색'), String(params.hint ?? '수상한 곳을 눌러 살펴보자.'));
    const g = scene.add.graphics();
    g.fillStyle(PALETTE.sand, 1).fillRoundedRect(180, 130, 920, 480, 20);
    g.fillStyle(0xf0d8a0, 1);
    for (let i = 0; i < 7; i++) g.fillEllipse(240 + i * 130, 200 + (i % 3) * 120, 200, 70);
    c.add(g);
    // paw prints trail toward the target
    const target = { x: 960, y: 520 };
    for (let i = 0; i < 9; i++) {
      const px = 300 + i * 75;
      const py = 300 + i * 25 + (i % 2) * 14;
      g.fillStyle(0xc9a87a, 0.8).fillEllipse(px, py, 12, 10);
      g.fillCircle(px - 6, py - 9, 3).fillCircle(px, py - 11, 3).fillCircle(px + 6, py - 9, 3);
    }
    const spots: { x: number; y: number; text: string; win?: boolean }[] = [
      { x: 300, y: 200, text: '모래 속에 게 한 마리. 비스킷은 아니다.' },
      { x: 520, y: 470, text: '빈 깡통. 누가 여기서 맥주를 마셨나.' },
      { x: 760, y: 220, text: '갈매기 깃털. 쓸모없다.' },
      { x: 640, y: 380, text: '발자국이 계속 이어진다. 저쪽, 낡은 보트하우스 쪽으로.' },
      { ...target, text: '…낑낑. 판자 밑에서 소리가 난다.', win: true },
    ];
    let found = false;
    let tries = 0;
    spots.forEach((s) => {
      const m = scene.add.graphics();
      m.fillStyle(0xe2c48a, 1).fillEllipse(0, 0, 90, 46).lineStyle(2, 0xb0905a, 1).strokeEllipse(0, 0, 90, 46);
      const zc = scene.add.container(s.x, s.y, [m]).setSize(100, 56).setInteractive({ useHandCursor: true });
      zc.on('pointerdown', () => {
        if (found) return;
        tries++;
        sfx('brush');
        hint.setText(s.text);
        scene.tweens.add({ targets: zc, scaleY: 0.7, yoyo: true, duration: 120 });
        if (s.win) {
          found = true;
          sfx('bark');
          scene.time.delayedCall(1300, () => {
            c.destroy();
            resolve(tries <= 2 ? 1 : 0.8);
          });
        }
      });
      c.add(zc);
    });
    if (params.boathouse) {
      const bh = scene.add.graphics();
      bh.fillStyle(0xb8a080, 1).fillRect(880, 420, 200, 120).lineStyle(3, PALETTE.ink, 1).strokeRect(880, 420, 200, 120);
      c.addAt(bh, 3);
    }
  });
}

// ---------------- carry: heavy things ----------------
function carry(scene: Phaser.Scene, label: string, count: number): Promise<number> {
  return new Promise((resolve) => {
    const { c, hint } = frame(scene, `${label} 나르기`, `${label}을(를) 끌어서 오른쪽 문까지 옮기자. 무겁다.`);
    const g = scene.add.graphics();
    g.fillStyle(0x9fb7c9, 1).fillRoundedRect(200, 300, 200, 200, 14).lineStyle(3, PALETTE.ink, 1).strokeRoundedRect(200, 300, 200, 200, 14);
    g.fillStyle(PALETTE.mint, 1).fillRoundedRect(920, 260, 160, 260, 12).lineStyle(3, PALETTE.ink, 1).strokeRoundedRect(920, 260, 160, 260, 12);
    g.fillStyle(SHADE.woodDark, 1).fillRoundedRect(960, 330, 80, 190, 6);
    c.add(g);
    c.add(txt(scene, 300, 280, '트럭', { size: 20 }).setOrigin(0.5));
    c.add(txt(scene, 1000, 240, '문', { size: 20 }).setOrigin(0.5));
    let left = count;
    const spawn = () => {
      const blk = scene.add.graphics();
      blk.fillStyle(0xdff6fb, 1).fillRoundedRect(-40, -30, 80, 60, 8).lineStyle(3, PALETTE.ink, 1).strokeRoundedRect(-40, -30, 80, 60, 8);
      blk.fillStyle(0xffffff, 0.8).fillRect(-30, -22, 20, 8);
      const b = scene.add.container(300, 400, [blk]).setSize(80, 60).setInteractive({ draggable: true, useHandCursor: true });
      c.add(b);
      scene.input.setDraggable(b);
      let tx = b.x;
      let ty = b.y;
      b.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => {
        tx = x;
        ty = y;
      });
      const follow = scene.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          b.x += (tx - b.x) * 0.06;
          b.y += (ty - b.y) * 0.06;
          b.angle = Math.sin(scene.time.now / 90) * 3 * (Math.abs(tx - b.x) > 4 ? 1 : 0);
        },
      });
      b.on('dragend', () => {
        scene.time.delayedCall(250, () => {
          if (b.x > 900 && b.x < 1100) {
            follow.remove();
            sfx('thud');
            b.destroy();
            left--;
            if (left <= 0) {
              hint.setText('다 옮겼다. 허리가 끊어질 것 같다.');
              scene.time.delayedCall(800, () => {
                c.destroy();
                resolve(1);
              });
            } else {
              hint.setText(`${left}개 남았다.`);
              spawn();
            }
          }
        });
      });
    };
    spawn();
  });
}

// ---------------- photo: frame a subject ----------------
function photo(scene: Phaser.Scene, subject: string, caption: string): Promise<number> {
  return new Promise((resolve) => {
    const { c, hint } = frame(scene, '사진 찍기', '뷰파인더 안에 잘 들어왔을 때 눌러서 찍자.');
    const g = scene.add.graphics();
    g.fillStyle(0xbfe8f2, 1).fillRoundedRect(180, 130, 920, 480, 20);
    c.add(g);
    const subj = addSprite(scene, 640, 380, subject, 2);
    c.add(subj);
    scene.tweens.add({ targets: subj, x: { from: 420, to: 860 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const vf = scene.add.graphics();
    vf.lineStyle(4, 0xffffff, 1).strokeRect(-120, -90, 240, 180);
    vf.lineStyle(2, 0xffffff, 0.7).lineBetween(-20, 0, 20, 0).lineBetween(0, -20, 0, 20);
    const v = scene.add.container(640, 380, [vf]);
    c.add(v);
    const shutter = new Button(scene, 640, 580, '찰칵', () => {
      const d = Math.abs(subj.x - v.x);
      sfx('click');
      sfx('whoosh');
      const flash = scene.add.rectangle(0, 0, 1280, 720, 0xffffff, 0.9).setOrigin(0).setDepth(DEPTH + 5);
      scene.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
      const score = d < 60 ? 1 : d < 140 ? 0.75 : 0.5;
      hint.setText(score >= 1 ? '잘 나왔다.' : score >= 0.75 ? '조금 비켜났지만 괜찮다.' : '흔들렸다. 노라는 그래도 좋아할 거다.');
      if (caption) hint.setText(`${hint.text}  ${caption}`);
      shutter.setDisabled(true);
      scene.time.delayedCall(1000, () => {
        c.destroy();
        resolve(score);
      });
    }, { w: 180, h: 54 });
    c.add(shutter);
  });
}
