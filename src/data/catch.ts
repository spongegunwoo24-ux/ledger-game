import type { ShrimpSize } from '../core/types';

export type CatchKind = 'shrimp' | 'crab' | 'fish' | 'trash' | 'turtle' | 'curio' | 'story';

export type ShrimpSpecies = 'brown' | 'white' | 'pink';

export interface CatchItem {
  uid: number;
  kind: CatchKind;
  size?: ShrimpSize;
  /** shrimp species (brown/white/pink), fish species id, trash variant, or curiosity / story item id */
  id?: string;
  /** fish length in inches */
  inches?: number;
  /** golden shrimp (rare net find) */
  golden?: boolean;
}

export const SHRIMP_SPECIES: ShrimpSpecies[] = ['brown', 'white', 'pink'];
export const SHRIMP_SPECIES_NAME: Record<ShrimpSpecies, string> = { brown: '갈색새우', white: '흰새우', pink: '분홍새우' };
export const SHRIMP_TINT: Record<ShrimpSpecies, number> = { brown: 0xe0b090, white: 0xfff6ee, pink: 0xffffff };
export const TRASH_VARIANTS = ['can', 'boot', 'weed', 'bag', 'tire'] as const;

export interface CuriosityDef {
  id: string;
  name: string;
  desc: string;
  /** pawnshop price; 0 = Vince won't take it */
  pawn: number;
}

/** Cosmetic curiosities that occasionally come up in the net (at least 12). */
export const CURIOSITIES: CuriosityDef[] = [
  { id: 'c_bottle', name: '초록 유리병', desc: '코르크가 없다. 안에 모래만 조금.', pawn: 5 },
  { id: 'c_coin', name: '1921년 동전', desc: '한쪽이 반들반들하다. 누가 오래 만지작거렸나 보다.', pawn: 15 },
  { id: 'c_compass', name: '깨진 나침반', desc: '바늘이 늘 같은 데를 가리킨다. 북쪽은 아니다.', pawn: 8 },
  { id: 'c_doll', name: '인형 머리', desc: '한쪽 눈만 깜빡인다. 선반에 두면 웃는 것 같다.', pawn: 0 },
  { id: 'c_key', name: '녹슨 열쇠', desc: '무엇을 여는 열쇠인지는 아무도 모른다.', pawn: 5 },
  { id: 'c_seaglass', name: '파란 바다 유리', desc: '모서리가 다 닳아서 사탕 같다.', pawn: 6 },
  { id: 'c_soldier', name: '장난감 병정', desc: '총은 잃어버렸고 경례만 남았다.', pawn: 7 },
  { id: 'c_shell', name: '커다란 소라 껍데기', desc: '귀에 대면 바다 소리. 당연하지.', pawn: 10 },
  { id: 'c_spoon', name: '은 숟가락', desc: '손잡이에 이니셜이 있다. M.L.', pawn: 12 },
  { id: 'c_marble', name: '유리구슬', desc: '안에 노란 소용돌이가 들었다.', pawn: 5 },
  { id: 'c_lure', name: '낡은 루어', desc: '누군가 아끼던 미끼. 바늘은 빠졌다.', pawn: 6 },
  { id: 'c_dice', name: '나무 주사위', desc: '굴리면 매번 4가 나온다. 수상하다.', pawn: 5 },
  { id: 'c_harmonica', name: '녹슨 하모니카', desc: '불면 한 음만 난다. 꽤 슬픈 음이다.', pawn: 9 },
  { id: 'c_sanddollar', name: '모래 달러', desc: '진짜 돈은 아니다. 메이지한테 보여 주면 좋아하겠다.', pawn: 0 },
];

export function curiosityDef(id: string): CuriosityDef | undefined {
  return CURIOSITIES.find((c) => c.id === id);
}

export interface StoryCatchDef {
  id: string;
  name: string;
  /** day the item is guaranteed in the first tow */
  day: number;
  /** if dropped in the trash, who fishes it back out (story beats always happen) */
  rescueLine: string;
}

export const STORY_CATCH: StoryCatchDef[] = [
  {
    id: 's_bottle_note',
    name: '쪽지가 든 병',
    day: 5,
    rescueLine: '…버리지 마. 안에 종이 들었다.',
  },
  {
    id: 's_tobacco_tin',
    name: '찌그러진 담배 깡통',
    day: 50,
    rescueLine: '…',
  },
];

export const SIZE_LABEL: Record<ShrimpSize, string> = { small: '소', medium: '중', large: '대' };
