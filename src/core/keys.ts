import type Phaser from 'phaser';

/**
 * Keyboard by physical key position (KeyboardEvent.code).
 * With a Korean IME switched to 한글, Chrome reports letter keys (and the Space that ends a
 * composition) as keyCode 229 "Process", so Phaser's keydown-F / keydown-SPACE never fire.
 * `code` stays 'KeyF' / 'Space', so everything here reads `code` only.
 */
const held = new Set<string>();
let installed = false;

function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('keydown', (e) => held.add(e.code), true);
  window.addEventListener('keyup', (e) => held.delete(e.code), true);
  window.addEventListener('blur', () => held.clear());
}

/** keys the browser would otherwise use to scroll or move focus */
const NO_DEFAULT = new Set(['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function isHeld(...codes: string[]): boolean {
  install();
  return codes.some((c) => held.has(c));
}

/**
 * Calls `fn` when one of `codes` is pressed while `scene` is running (not paused or asleep).
 * The listener is removed when the scene shuts down.
 */
export function onKey(scene: Phaser.Scene, codes: string | string[], fn: (e: KeyboardEvent) => void, opts: { repeat?: boolean } = {}): void {
  install();
  const list = Array.isArray(codes) ? codes : [codes];
  const h = (e: KeyboardEvent) => {
    if (!list.includes(e.code)) return;
    if (NO_DEFAULT.has(e.code)) e.preventDefault();
    if (e.repeat && !opts.repeat) return;
    if (!scene.sys.isActive()) return;
    fn(e);
  };
  window.addEventListener('keydown', h);
  scene.events.once('shutdown', () => window.removeEventListener('keydown', h));
  scene.events.once('destroy', () => window.removeEventListener('keydown', h));
}

/** 'Digit1'/'Numpad1' → 1, otherwise 0 */
export function digitOf(e: KeyboardEvent): number {
  const m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code);
  return m ? Number(m[1]) : 0;
}

export const KEY = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
} as const;
