import Phaser from 'phaser';
import { PALETTE, FONT_UI } from '../art/palette';
import { TEST_MODE } from '../core/view';
import { holdClock, releaseClock } from '../core/clock';
import { getSettings, TEXT_SPEED_MS } from './settings';
import { portraitKey } from '../art/characters';
import { CHAR_NAMES, CHAR_NAMES_EN } from '../data/names';
import { sfx } from '../audio/sfx';
import { Button, panel } from './Button';
import { txt } from './text';

const DEPTH = 900;

export type LineKind = 'say' | 'think' | 'narrate';

/** [변경 1] The last 100 lines, kept for the "기록" view (not saved). */
export const DIALOGUE_LOG: { who: string; text: string }[] = [];

export function logLine(kind: LineKind, text: string, who?: string) {
  const name = kind === 'say' && who ? (CHAR_NAMES[who] ?? who) : kind === 'think' ? '일라이 (속으로)' : '';
  DIALOGUE_LOG.push({ who: name, text });
  while (DIALOGUE_LOG.length > 100) DIALOGUE_LOG.shift();
}

/**
 * Bottom dialogue box with portrait, name tag and typewriter text.
 * [변경 1] click/Space/Enter completes the line, again → next line; holding fast-forwards;
 * "건너뛰기 ▶▶" (Tab) skips to the end of the scene or to the next choice; L / "기록" shows the log.
 */
export class DialogueBox {
  private c: Phaser.GameObjects.Container;
  private g: Phaser.GameObjects.Graphics;
  private portrait: Phaser.GameObjects.Image;
  private portraitRing: Phaser.GameObjects.Graphics;
  private nameTag: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private nameEn: Phaser.GameObjects.Text;
  private body: Phaser.GameObjects.Text;
  private arrow: Phaser.GameObjects.Text;
  private catcher: Phaser.GameObjects.Zone;
  private skipBtn: Button;
  private logBtn: Button;
  private seenNames = new Set<string>();
  private typing: Phaser.Time.TimerEvent | null = null;
  private full = '';
  private resolve: (() => void) | null = null;
  private keyDown: (e: KeyboardEvent) => void;
  private keyUp: (e: KeyboardEvent) => void;
  private holdStart = 0;
  private holding = false;
  private holdTimer: Phaser.Time.TimerEvent;
  private shownAt = 0;
  /** set by the skip button; the runner fast-forwards until a choice */
  skipping = false;

  constructor(private scene: Phaser.Scene) {
    this.catcher = scene.add.zone(0, 0, 1280, 720).setOrigin(0).setDepth(DEPTH - 1).setInteractive();
    this.catcher.on('pointerdown', () => {
      this.startHold();
      this.advance();
    });
    this.catcher.on('pointerup', () => this.endHold());
    this.catcher.on('pointerout', () => this.endHold());
    this.c = scene.add.container(0, 0).setDepth(DEPTH);
    this.g = scene.add.graphics();
    this.c.add(this.g);
    this.portraitRing = scene.add.graphics();
    this.c.add(this.portraitRing);
    this.portrait = scene.add.image(155, 590, portraitKey('eli')).setScale(0.62);
    this.c.add(this.portrait);
    this.nameTag = scene.add.container(0, 0);
    const ng = scene.add.graphics();
    this.nameText = txt(scene, 0, 0, '', { size: 22, color: '#FFFAF0' }).setOrigin(0, 0.5);
    this.nameEn = txt(scene, 0, 0, '', { size: 13, color: '#FFE29A' }).setOrigin(0, 0.5);
    this.nameTag.add([ng, this.nameText, this.nameEn]);
    this.c.add(this.nameTag);
    this.body = txt(scene, 0, 0, '', { size: 25, lineSpacing: 10, wordWrap: { width: 900, useAdvancedWrap: true } });
    this.c.add(this.body);
    this.arrow = txt(scene, 1170, 680, '▼', { size: 18, color: '#3B3355' }).setOrigin(0.5);
    this.c.add(this.arrow);
    scene.tweens.add({ targets: this.arrow, y: 686, duration: 420, yoyo: true, repeat: -1 });
    this.skipBtn = new Button(scene, 1140, 534, '건너뛰기 ▶▶', () => this.skip(), { w: 150, h: 36, size: 16, fill: 0xfff3d6, silent: false });
    this.logBtn = new Button(scene, 1000, 534, '기록', () => openLog(scene), { w: 80, h: 36, size: 16, fill: 0xfff3d6 });
    this.c.add([this.skipBtn, this.logBtn]);
    this.keyDown = (e: KeyboardEvent) => {
      if (!this.c.visible) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        if (!e.repeat) {
          this.startHold();
          this.advance();
        }
      } else if (e.code === 'Tab') {
        e.preventDefault();
        this.skip();
      } else if (e.code === 'KeyL') {
        openLog(scene);
      }
    };
    this.keyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') this.endHold();
    };
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    // fast-forward while held
    this.holdTimer = scene.time.addEvent({
      delay: 70,
      loop: true,
      callback: () => {
        if (this.holding && this.c.visible && scene.time.now - this.holdStart > 350 && scene.time.now - this.shownAt > 90) this.advance(true);
      },
    });
    scene.events.once('shutdown', () => this.destroy());
    this.hide();
  }

  private startHold() {
    this.holding = true;
    this.holdStart = this.scene.time.now;
  }

  private endHold() {
    this.holding = false;
  }

  private skip() {
    if (!this.c.visible) return;
    this.skipping = true;
    this.finishTyping();
    this.advance(true);
  }

  hide() {
    this.c.setVisible(false);
    this.catcher.disableInteractive();
    releaseClock(this);
  }

  get visible() {
    return this.c.visible;
  }

  private layout(kind: LineKind, who?: string) {
    const g = this.g;
    g.clear();
    this.portraitRing.clear();
    const hasPortrait = kind === 'say' && !!who && this.scene.textures.exists(portraitKey(who));
    if (kind === 'narrate') {
      panel(g, 60, 556, 1160, 148, PALETTE.ink, 22);
      this.body.setColor('#FFF3D6').setFontFamily(FONT_UI).setFontSize(25);
      this.body.setPosition(110, 584).setWordWrapWidth(1060);
      this.arrow.setColor('#FFF3D6');
    } else if (kind === 'think') {
      panel(g, 60, 556, 1160, 148, 0xe9e0f7, 22);
      this.body.setColor('#4a3f73').setFontFamily(FONT_UI).setFontSize(25);
      this.body.setPosition(110, 584).setWordWrapWidth(1060);
      this.arrow.setColor('#4a3f73');
    } else {
      panel(g, 60, 556, 1160, 148, 0xfffaf0, 22);
      this.body.setColor('#3B3355').setFontFamily(FONT_UI).setFontSize(25);
      this.body.setPosition(hasPortrait ? 250 : 110, 590).setWordWrapWidth(hasPortrait ? 920 : 1060);
      this.arrow.setColor('#3B3355');
    }
    this.portrait.setVisible(hasPortrait);
    if (hasPortrait && who) {
      this.portrait.setTexture(portraitKey(who));
      this.portrait.setScale(0.62);
      this.portrait.setPosition(155, 590);
      this.portraitRing.lineStyle(4, PALETTE.ink, 1);
      this.portraitRing.strokeCircle(155, 590, 72);
    }
    const ng = this.nameTag.list[0] as Phaser.GameObjects.Graphics;
    ng.clear();
    if (kind === 'say' && who) {
      const name = CHAR_NAMES[who] ?? who;
      const showEn = !this.seenNames.has(who) && !!CHAR_NAMES_EN[who] && who !== 'eli';
      this.seenNames.add(who);
      this.nameText.setText(name);
      this.nameEn.setText(showEn ? CHAR_NAMES_EN[who] : '');
      const w = this.nameText.width + (showEn ? this.nameEn.width + 14 : 0) + 36;
      const x = hasPortrait ? 236 : 96;
      ng.fillStyle(PALETTE.ink, 1);
      ng.fillRoundedRect(x, 532, w, 40, 14);
      this.nameText.setPosition(x + 18, 552);
      this.nameEn.setPosition(x + 26 + this.nameText.width, 553);
      this.nameTag.setVisible(true);
    } else if (kind === 'think') {
      this.nameText.setText('일라이 (속으로)');
      this.nameEn.setText('');
      ng.fillStyle(0x7a6aa8, 1);
      ng.fillRoundedRect(96, 532, this.nameText.width + 36, 40, 14);
      this.nameText.setPosition(114, 552);
      this.nameTag.setVisible(true);
    } else {
      this.nameTag.setVisible(false);
    }
  }

  /** Shows a line and resolves when the player dismisses it. */
  show(kind: LineKind, text: string, who?: string): Promise<void> {
    logLine(kind, text, who);
    holdClock(this);
    this.layout(kind, who);
    this.c.setVisible(true);
    this.catcher.setInteractive();
    this.full = text;
    this.body.setText('');
    this.arrow.setVisible(false);
    this.shownAt = this.scene.time.now;
    const chars = Array.from(text);
    this.typing?.remove();
    this.typing = null;
    const delay = TEXT_SPEED_MS[getSettings().textSpeed];
    if (chars.length === 0 || TEST_MODE || delay === 0 || this.skipping || (this.holding && this.scene.time.now - this.holdStart > 350)) {
      this.finishTyping();
    } else {
      let i = 0;
      this.typing = this.scene.time.addEvent({
        delay,
        repeat: chars.length - 1,
        callback: () => {
          i++;
          this.body.setText(chars.slice(0, i).join(''));
          if (i % 3 === 0 && kind === 'say') sfx('tick');
          if (i >= chars.length) this.finishTyping();
        },
      });
    }
    return new Promise((res) => {
      this.resolve = res;
      if (this.skipping) this.scene.time.delayedCall(0, () => this.advance(true));
    });
  }

  private finishTyping() {
    this.typing?.remove();
    this.typing = null;
    this.body.setText(this.full);
    this.arrow.setVisible(true);
  }

  private advance(force = false) {
    if (!this.c.visible) return;
    if (this.typing && !force) {
      this.finishTyping();
      return;
    }
    this.finishTyping();
    const r = this.resolve;
    this.resolve = null;
    if (r) {
      if (!force) sfx('click');
      r();
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    this.holdTimer?.remove();
    this.typing?.remove();
    releaseClock(this);
    if (this.c.scene) this.c.destroy();
    if (this.catcher.scene) this.catcher.destroy();
  }
}

/** [변경 1] The last 100 lines of dialogue. */
export function openLog(scene: Phaser.Scene) {
  if (scene.children.getByName('dialogueLog')) return;
  const token = {};
  holdClock(token);
  const c = scene.add.container(0, 0).setDepth(1400).setName('dialogueLog');
  const shade = scene.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.6).setOrigin(0).setInteractive();
  const g = scene.add.graphics();
  panel(g, 160, 40, 960, 640, 0xfffaf0, 18);
  c.add([shade, g]);
  c.add(txt(scene, 640, 76, '대사 기록', { size: 28, fontFamily: '"Jua", sans-serif' }).setOrigin(0.5));
  const lines = DIALOGUE_LOG.slice(-100);
  const body = scene.add.container(0, 0);
  let y = 0;
  for (const l of lines) {
    const head = l.who ? `${l.who}: ` : '';
    const t = txt(scene, 200, y, head + l.text, { size: 19, color: l.who ? '#3B3355' : '#6b6385', wordWrap: { width: 880, useAdvancedWrap: true } });
    body.add(t);
    y += t.height + 10;
  }
  const viewTop = 110;
  const viewH = 520;
  body.y = viewTop + Math.min(0, viewH - y);
  const maskG = scene.make.graphics({}, false);
  maskG.fillRect(170, viewTop, 940, viewH);
  body.setMask(maskG.createGeometryMask());
  c.add(body);
  c.add(txt(scene, 640, 656, '휠/↑↓로 스크롤 · 아무 데나 누르거나 L·Esc로 닫기', { size: 15, color: '#9a96a8' }).setOrigin(0.5));
  const minY = viewTop + Math.min(0, viewH - y);
  const scroll = (dy: number) => {
    body.y = Phaser.Math.Clamp(body.y - dy, minY, viewTop);
  };
  const wheel = (_p: unknown, _o: unknown, _dx: number, dy: number) => scroll(dy * 0.6);
  scene.input.on('wheel', wheel);
  const close = () => {
    scene.input.off('wheel', wheel);
    window.removeEventListener('keydown', key);
    releaseClock(token);
    maskG.destroy();
    c.destroy();
  };
  const key = (e: KeyboardEvent) => {
    if (e.code === 'ArrowUp') scroll(-40);
    else if (e.code === 'ArrowDown') scroll(40);
    else if (e.code === 'KeyL' || e.code === 'Escape') close();
  };
  setTimeout(() => window.addEventListener('keydown', key), 0);
  shade.on('pointerdown', close);
}

/** Vertical choice menu; resolves with the chosen index. Keys 1–4 work too. */
export function choose(scene: Phaser.Scene, options: string[], y = 300): Promise<number> {
  return new Promise((resolve) => {
    const token = {};
    holdClock(token);
    const blocker = scene.add.zone(0, 0, 1280, 720).setOrigin(0).setDepth(DEPTH + 9).setInteractive();
    const shade = scene.add.rectangle(0, 0, 1280, 720, PALETTE.ink, 0.25).setOrigin(0).setDepth(DEPTH + 9);
    const buttons: Button[] = [];
    const total = options.length * 70;
    const startY = y - total / 2 + 35;
    const done = (i: number) => {
      scene.input.keyboard?.off('keydown', onKey);
      buttons.forEach((b) => b.destroy());
      blocker.destroy();
      shade.destroy();
      releaseClock(token);
      resolve(i);
    };
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) done(n - 1);
    };
    options.forEach((o, i) => {
      const b = new Button(scene, 640, startY + i * 70, o, () => done(i), { w: 760, h: 58, size: 22, fill: i % 2 ? 0xfff3d6 : 0xffe29a });
      b.setDepth(DEPTH + 10);
      b.setAlpha(0);
      scene.tweens.add({ targets: b, alpha: 1, y: b.y, duration: 160, delay: i * 50 });
      buttons.push(b);
    });
    scene.input.keyboard?.on('keydown', onKey);
  });
}

/** Small floating notifications at the top center. */
export class Toasts {
  private stack: Phaser.GameObjects.Container[] = [];
  constructor(private scene: Phaser.Scene) {}

  show(message: string, color: number = PALETTE.mint) {
    const s = this.scene;
    const t = txt(s, 0, 0, message, { size: 20 }).setOrigin(0.5);
    const w = t.width + 40;
    const g = s.add.graphics();
    panel(g, -w / 2, -22, w, 44, color, 18);
    const c = s.add.container(640, -40, [g, t]).setDepth(1500);
    const idx = this.stack.length;
    this.stack.push(c);
    s.tweens.add({ targets: c, y: 70 + idx * 54, duration: 260, ease: 'Back.Out' });
    s.time.delayedCall(2600 + idx * 200, () => {
      s.tweens.add({
        targets: c,
        alpha: 0,
        y: c.y - 20,
        duration: 260,
        onComplete: () => {
          c.destroy();
          this.stack = this.stack.filter((x) => x !== c);
        },
      });
    });
  }
}
