// WebAudio-synthesized sound effects and a tiny ambient music sequencer.
// Everything degrades silently when audio is unavailable (tests, old browsers).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

const settings = { sfx: 0.7, music: 0.35, muted: false };

function loadSettings() {
  try {
    const raw = localStorage.getItem('ledger.audio');
    if (raw) Object.assign(settings, JSON.parse(raw));
  } catch {
    /* storage unavailable */
  }
}
loadSettings();

export function audioSettings() {
  return { ...settings };
}

export function setAudio(p: Partial<typeof settings>) {
  Object.assign(settings, p);
  try {
    localStorage.setItem('ledger.audio', JSON.stringify(settings));
  } catch {
    /* ignore */
  }
  if (master) master.gain.value = settings.muted ? 0 : 1;
  if (sfxGain) sfxGain.gain.value = settings.sfx;
  if (musicGain) musicGain.gain.value = settings.music;
}

function ac(): AudioContext | null {
  if (ctx) return ctx;
  const AC =
    typeof window !== 'undefined'
      ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = settings.muted ? 0 : 1;
  master.connect(ctx.destination);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = settings.sfx;
  sfxGain.connect(master);
  musicGain = ctx.createGain();
  musicGain.gain.value = settings.music;
  musicGain.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

/** Call from a user gesture to unlock audio. */
export function unlockAudio() {
  const c = ac();
  if (c && c.state === 'suspended') void c.resume();
}

function env(g: GainNode, t: number, a: number, peak: number, d: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone(type: OscillatorType, f0: number, f1: number, dur: number, peak: number, delay = 0, out?: AudioNode) {
  const c = ac();
  if (!c || !sfxGain) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(g, t, 0.01, peak, dur);
  o.connect(g).connect(out ?? sfxGain);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, peak: number, filter: BiquadFilterType, f0: number, f1: number, delay = 0, q = 1) {
  const c = ac();
  if (!c || !sfxGain || !noiseBuf) return;
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const bq = c.createBiquadFilter();
  bq.type = filter;
  bq.Q.value = q;
  bq.frequency.setValueAtTime(f0, t);
  bq.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  const g = c.createGain();
  env(g, t, 0.01, peak, dur);
  src.connect(bq).connect(g).connect(sfxGain);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

/** Toby's whistle motif — fixed 7 notes, reused everywhere (Detail D06). */
export const WHISTLE_MOTIF: [number, number][] = [
  [784, 0.18],
  [659, 0.18],
  [784, 0.18],
  [988, 0.34],
  [880, 0.18],
  [784, 0.18],
  [659, 0.5],
];

export function whistle(volume = 0.16, fade = false) {
  const c = ac();
  if (!c || !sfxGain) return;
  let t = c.currentTime + 0.02;
  WHISTLE_MOTIF.forEach(([f, d], i) => {
    const v = fade ? volume * (1 - i / WHISTLE_MOTIF.length) : volume;
    const o = c.createOscillator();
    const lfo = c.createOscillator();
    const lg = c.createGain();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 0.97, t);
    o.frequency.linearRampToValueAtTime(f, t + 0.05);
    lfo.frequency.value = 6;
    lg.gain.value = f * 0.012;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + 0.04);
    g.gain.setValueAtTime(Math.max(0.0002, v), t + d - 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(sfxGain!);
    o.start(t);
    lfo.start(t);
    o.stop(t + d + 0.02);
    lfo.stop(t + d + 0.02);
    t += d + 0.03;
  });
}

export type SfxId =
  | 'click'
  | 'splash'
  | 'plop'
  | 'cash'
  | 'paper'
  | 'squawk'
  | 'whistle'
  | 'snag'
  | 'thud'
  | 'bell'
  | 'tick'
  | 'pop'
  | 'reject'
  | 'gulp'
  | 'door'
  | 'brush'
  | 'creak'
  | 'clink'
  | 'step'
  | 'whoosh'
  | 'chime'
  | 'fire'
  | 'gravel'
  | 'bark'
  | 'slam';

export function sfx(id: SfxId | string) {
  if (!ac()) return;
  switch (id) {
    case 'click':
      tone('triangle', 880, 660, 0.06, 0.12);
      break;
    case 'splash':
      noise(0.5, 0.35, 'lowpass', 2400, 300);
      noise(0.25, 0.2, 'highpass', 3000, 1500, 0.05);
      break;
    case 'plop':
      tone('sine', 620, 180, 0.13, 0.28);
      break;
    case 'cash':
      tone('triangle', 1318, 1318, 0.5, 0.18);
      tone('triangle', 1760, 1760, 0.6, 0.15, 0.08);
      noise(0.08, 0.1, 'highpass', 6000, 6000);
      break;
    case 'paper':
      noise(0.12, 0.18, 'bandpass', 3000, 2000, 0, 0.8);
      noise(0.1, 0.12, 'bandpass', 2600, 1800, 0.12, 0.8);
      break;
    case 'squawk':
      tone('sawtooth', 520, 330, 0.18, 0.12);
      tone('sawtooth', 470, 300, 0.16, 0.1, 0.16);
      break;
    case 'whistle':
      whistle();
      break;
    case 'snag':
      tone('square', 90, 50, 0.35, 0.25);
      noise(0.3, 0.3, 'lowpass', 800, 100);
      tone('sawtooth', 300, 200, 0.4, 0.06, 0.1);
      break;
    case 'thud':
      tone('sine', 140, 60, 0.2, 0.35);
      break;
    case 'bell':
      tone('sine', 392, 392, 2.2, 0.2);
      tone('sine', 784, 784, 1.4, 0.07);
      tone('sine', 1176, 1176, 0.8, 0.04);
      break;
    case 'tick':
      tone('square', 1800, 1800, 0.03, 0.06);
      break;
    case 'pop':
      tone('sine', 400, 900, 0.08, 0.2);
      break;
    case 'reject':
      tone('triangle', 260, 200, 0.14, 0.16);
      break;
    case 'gulp':
      tone('sine', 300, 120, 0.18, 0.25);
      tone('sine', 220, 90, 0.12, 0.15, 0.12);
      break;
    case 'door':
      tone('sawtooth', 160, 120, 0.25, 0.05);
      tone('sine', 120, 70, 0.15, 0.3, 0.2);
      break;
    case 'slam':
      noise(0.25, 0.45, 'lowpass', 900, 120);
      tone('sine', 110, 45, 0.3, 0.5);
      break;
    case 'brush':
      noise(0.22, 0.12, 'bandpass', 1500, 900, 0, 1.5);
      break;
    case 'creak':
      tone('sawtooth', 210, 160, 0.4, 0.04);
      break;
    case 'clink':
      tone('triangle', 2093, 2093, 0.2, 0.1);
      tone('triangle', 2637, 2637, 0.25, 0.08, 0.05);
      break;
    case 'step':
      noise(0.06, 0.12, 'lowpass', 900, 400);
      break;
    case 'gravel':
      for (let i = 0; i < 6; i++) noise(0.09, 0.1 * (1 - i / 7), 'bandpass', 1800, 1200, i * 0.42, 1.2);
      break;
    case 'whoosh':
      noise(0.35, 0.15, 'bandpass', 600, 2400, 0, 1);
      break;
    case 'chime':
      [1047, 1319, 1568, 2093].forEach((f, i) => tone('triangle', f, f, 0.5, 0.1, i * 0.08));
      break;
    case 'fire':
      for (let i = 0; i < 8; i++) noise(0.12, 0.08, 'bandpass', 2000 + Math.random() * 2000, 900, i * 0.1, 2);
      break;
    case 'bark':
      tone('sawtooth', 420, 300, 0.09, 0.14);
      tone('sawtooth', 440, 320, 0.09, 0.14, 0.16);
      break;
    default:
      break;
  }
}

// ---------- winch loop (Trawl) ----------
export class Winch {
  private o: OscillatorNode | null = null;
  private o2: OscillatorNode | null = null;
  private g: GainNode | null = null;
  private f: BiquadFilterNode | null = null;

  start() {
    const c = ac();
    if (!c || !sfxGain || this.o) return;
    this.o = c.createOscillator();
    this.o2 = c.createOscillator();
    this.f = c.createBiquadFilter();
    this.g = c.createGain();
    this.o.type = 'sawtooth';
    this.o2.type = 'square';
    this.o.frequency.value = 70;
    this.o2.frequency.value = 35;
    this.f.type = 'lowpass';
    this.f.frequency.value = 500;
    this.g.gain.value = 0.0001;
    this.g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 0.3);
    this.o.connect(this.f);
    this.o2.connect(this.f);
    this.f.connect(this.g).connect(sfxGain);
    this.o.start();
    this.o2.start();
  }

  /** load: 0..1 — pitch rises with the weight in the net. */
  setLoad(load: number, hauling = false) {
    const c = ac();
    if (!c || !this.o || !this.o2 || !this.f || !this.g) return;
    const base = hauling ? 110 : 62;
    const f = base + load * (hauling ? 90 : 46);
    this.o.frequency.setTargetAtTime(f, c.currentTime, 0.2);
    this.o2.frequency.setTargetAtTime(f / 2, c.currentTime, 0.2);
    this.f.frequency.setTargetAtTime(400 + load * 900, c.currentTime, 0.2);
    this.g.gain.setTargetAtTime(hauling ? 0.07 : 0.035 + load * 0.03, c.currentTime, 0.2);
  }

  stop() {
    const c = ac();
    if (!c || !this.o || !this.g) return;
    this.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.1);
    const o = this.o;
    const o2 = this.o2;
    setTimeout(() => {
      try {
        o.stop();
        o2?.stop();
      } catch {
        /* already stopped */
      }
    }, 400);
    this.o = null;
    this.o2 = null;
  }
}

// ---------- ambient waves + gentle music ----------
let waveSrc: AudioBufferSourceNode | null = null;
let waveGain: GainNode | null = null;
let musicTimer: number | null = null;
let currentTheme: string | null = null;

export function ambientWaves(on: boolean, level = 0.06) {
  const c = ac();
  if (!c || !sfxGain || !noiseBuf) return;
  if (!on) {
    if (waveGain) waveGain.gain.setTargetAtTime(0.0001, c.currentTime, 0.4);
    const s = waveSrc;
    setTimeout(() => s?.stop(), 1500);
    waveSrc = null;
    waveGain = null;
    return;
  }
  if (waveSrc) {
    waveGain?.gain.setTargetAtTime(level, c.currentTime, 0.5);
    return;
  }
  waveSrc = c.createBufferSource();
  waveSrc.buffer = noiseBuf;
  waveSrc.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;
  const lfo = c.createOscillator();
  const lg = c.createGain();
  lfo.frequency.value = 0.12;
  lg.gain.value = 300;
  lfo.connect(lg).connect(lp.frequency);
  waveGain = c.createGain();
  waveGain.gain.value = 0.0001;
  waveGain.gain.setTargetAtTime(level, c.currentTime, 0.8);
  waveSrc.connect(lp).connect(waveGain).connect(sfxGain);
  waveSrc.start();
  lfo.start();
}

const THEMES: Record<string, { notes: number[]; step: number; type: OscillatorType }> = {
  dawn: { notes: [392, 440, 523, 587, 659, 587, 523, 440], step: 0.62, type: 'sine' },
  day: { notes: [523, 587, 659, 784, 880, 784, 659, 587, 523, 659, 784, 659], step: 0.36, type: 'triangle' },
  evening: { notes: [349, 440, 523, 440, 392, 494, 587, 494], step: 0.6, type: 'sine' },
  town: { notes: [523, 659, 784, 659, 587, 698, 880, 698], step: 0.4, type: 'triangle' },
  sad: { notes: [330, 392, 440, 392, 294, 349, 392, 349], step: 0.85, type: 'sine' },
};

export function music(theme: string | null) {
  if (theme === currentTheme) return;
  currentTheme = theme;
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  const c = ac();
  if (!c || !musicGain || !theme) return;
  const th = THEMES[theme];
  if (!th) return;
  let i = 0;
  const play = () => {
    if (!ctx || !musicGain) return;
    const f = th.notes[i % th.notes.length];
    const t = ctx.currentTime + 0.02;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = th.type;
    o.frequency.value = f;
    env(g, t, 0.04, 0.06, th.step * 1.8);
    o.connect(g).connect(musicGain);
    o.start(t);
    o.stop(t + th.step * 2);
    if (i % 4 === 0) {
      const b = ctx.createOscillator();
      const bg = ctx.createGain();
      b.type = 'sine';
      b.frequency.value = f / 2;
      env(bg, t, 0.05, 0.04, th.step * 3.5);
      b.connect(bg).connect(musicGain);
      b.start(t);
      b.stop(t + th.step * 4);
    }
    i++;
  };
  play();
  musicTimer = window.setInterval(play, th.step * 1000);
}
