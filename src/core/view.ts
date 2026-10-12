import type Phaser from 'phaser';

/** Logical resolution. All game code works in these coordinates. */
export const W = 1280;
export const H = 720;

/**
 * Render resolution multiplier. The canvas is W·R × H·R and every camera is
 * zoomed by R, so vector graphics and text stay crisp at 1920×1080 and on
 * high-DPI screens while gameplay code keeps using 1280×720 coordinates.
 */
export let R = 1;

export function computeR(): number {
  if (typeof window === 'undefined') return 1;
  const dpr = window.devicePixelRatio || 1;
  const fit = Math.min((window.innerWidth * dpr) / W, (window.innerHeight * dpr) / H);
  R = Math.max(1, Math.min(2, Math.ceil(fit * 2) / 2));
  return R;
}

/** Call at the top of every scene's create(). */
export function initView(scene: Phaser.Scene): void {
  const cam = scene.cameras.main;
  cam.setOrigin(0, 0);
  cam.setZoom(R);
  cam.setScroll(0, 0);
}

/** ?test=1 — headless play-testing helpers (instant text). */
export const TEST_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === '1';
