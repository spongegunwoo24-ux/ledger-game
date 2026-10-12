// Palette tokens (DESIGN.md §4.2) plus a few supporting shades.

export const PALETTE = {
  sea: 0x6cc4d6,
  seaDeep: 0x3d8fa8,
  sand: 0xf5e3b3,
  mint: 0xa8e6cf,
  coral: 0xff8b94,
  butter: 0xffe29a,
  peach: 0xffc7a8,
  lilac: 0xc9b6e4,
  ink: 0x3b3355,
  killerRed: 0xd7263d,
} as const;

/** Supporting shades derived from the main palette. */
export const SHADE = {
  white: 0xfffaf0,
  cream: 0xfff3d6,
  paper: 0xfbf1d9,
  wood: 0xc99a6b,
  woodDark: 0x9c6f4a,
  woodLight: 0xe2bf8f,
  seaLight: 0xa6e1ea,
  foam: 0xeefbfd,
  sky: 0xbfe8f2,
  grass: 0x9fd69a,
  palm: 0x6fbf8a,
  grey: 0xb9b4c7,
  greyDark: 0x7d7896,
  night: 0x24304f,
  orange: 0xffa45c,
  red: 0xe85d5d,
  pink: 0xffb3c1,
  skin: 0xffd8bf,
  skinDark: 0xd9a27e,
  hairBrown: 0x7a5236,
  hairDark: 0x3e3044,
  hairGrey: 0xd8d4e0,
  tan: 0xd8b98a,
  khaki: 0xc8b67a,
  black: 0x2f2a3d,
  blush: 0xff9fae,
  yellow: 0xffd45e,
  oilskin: 0xffcf3f,
  green: 0x7ccf9b,
  shrimp: 0xff9e8a,
  shrimpDeep: 0xf27b6b,
  shrimpPale: 0xffc6b5,
} as const;

export const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

export const CSS = {
  ink: hex(PALETTE.ink),
  sand: hex(PALETTE.sand),
  paper: hex(SHADE.paper),
  coral: hex(PALETTE.coral),
  mint: hex(PALETTE.mint),
  butter: hex(PALETTE.butter),
  lilac: hex(PALETTE.lilac),
  sea: hex(PALETTE.sea),
  seaDeep: hex(PALETTE.seaDeep),
  peach: hex(PALETTE.peach),
  white: hex(SHADE.white),
  greyDark: hex(SHADE.greyDark),
  killerRed: hex(PALETTE.killerRed),
  eliPen: '#2d5fa8',
};

/** Color grading per segment (overlay color + alpha). */
export const TINTS = {
  dawn: { color: 0xd9a6d6, alpha: 0.28 },
  morning: { color: 0xffd98a, alpha: 0.14 },
  afternoon: { color: 0xffffff, alpha: 0 },
  evening: { color: 0xff9a5c, alpha: 0.24 },
  night: { color: 0x1d2550, alpha: 0.5 },
} as const;

export const FONT_UI = '"Gowun Dodum", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
export const FONT_TITLE = '"Jua", "Gowun Dodum", "Noto Sans KR", sans-serif';
export const FONT_HAND = '"Nanum Pen Script", "Gowun Dodum", "Noto Sans KR", cursive';
