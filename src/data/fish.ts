import type { GroundId, Moon, Tide, Weather } from '../core/types';
import type { BaitId } from './bait';

/** [변경 1] The 36 fish (DESIGN §8.14). */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'veryRare' | 'legendary';
/** A straight / B side-to-side / C heavy to the bottom / D sudden runs / E jumps / F weak */
export type Pattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type Behavior = 'curious' | 'shy' | 'hunter' | 'thief' | 'school';
export type Layer = 'surface' | 'middle' | 'bottom';
export type FishShape = 'oval' | 'long' | 'flat' | 'tall' | 'eel' | 'octopus' | 'seahorse' | 'shark' | 'big' | 'puffer' | 'ray' | 'slim';
/** Sea grounds, plus land spots used from M2. 'any' = every sea ground. */
export type FishPlace = GroundId | 'any' | 'pier' | 'breakwater' | 'beach' | 'riverbank';

export interface FishCond {
  tide?: Tide;
  weather?: Weather[];
  notWeather?: Weather[];
  moon?: Moon;
  rainedYesterday?: boolean;
  /** only before this clock minute (e.g. 05:00 = 300) */
  before?: number;
  /** only within N minutes of sailing out */
  withinMinutesOfSailing?: number;
  minWeek?: number;
  maxWeek?: number;
  /** extra rarity multiplier (golden croaker) */
  chance?: number;
}

export interface FishDef {
  id: string;
  no: number;
  name: string;
  rarity: Rarity;
  places: FishPlace[];
  cond: FishCond;
  /** inches */
  size: [number, number];
  pattern: Pattern | null;
  behavior: Behavior;
  layer: Layer;
  shape: FishShape;
  /** body / accent colors */
  colors: [number, number];
  baits: BaitId[];
  /** short encyclopedia line */
  desc: string;
  netOnly?: boolean;
  /** release is the right call (the card suggests it) */
  release?: boolean;
  /** cannot be netted (breaks out) */
  netProof?: boolean;
}

const ALL_BAITS: BaitId[] = ['shrimp', 'pinfish', 'crab'];

export const FISH: FishDef[] = [
  { id: 'pinfish', no: 1, name: '핀피시', rarity: 'common', places: ['pier', 'oyster', 'gusSpot'], cond: {}, size: [4, 8], pattern: 'F', behavior: 'thief', layer: 'middle', shape: 'oval', colors: [0xb9c8d8, 0xe0c060], baits: ['shrimp'], desc: '미끼 도둑. 잡으면 살아있는 미끼로 쓸 수 있다.' },
  { id: 'croaker', no: 2, name: '크로커', rarity: 'common', places: ['sandbar', 'river', 'gusSpot'], cond: {}, size: [6, 12], pattern: 'F', behavior: 'school', layer: 'middle', shape: 'oval', colors: [0xd9d3a8, 0xa89a6a], baits: ['shrimp'], desc: '떼로 다닌다. 잡으면 "꾸룩" 하고 운다.' },
  { id: 'spot', no: 3, name: '스팟', rarity: 'common', places: ['sandbar'], cond: {}, size: [5, 10], pattern: 'F', behavior: 'school', layer: 'middle', shape: 'oval', colors: [0xc9d3c0, 0x3b3355], baits: ['shrimp'], desc: '어깨에 검은 점 하나. 떼로 지나간다.' },
  { id: 'mullet', no: 4, name: '숭어', rarity: 'common', places: ['river', 'pier'], cond: { tide: '밀물' }, size: [8, 16], pattern: 'B', behavior: 'school', layer: 'surface', shape: 'slim', colors: [0x9fa8b8, 0x6d7a8a], baits: ['shrimp'], desc: '밀물에 강 하구로 몰려든다. 가끔 물 위로 뛴다.' },
  { id: 'hardhead', no: 5, name: '바다메기', rarity: 'common', places: ['any'], cond: { weather: ['흐림'] }, size: [8, 14], pattern: 'C', behavior: 'thief', layer: 'bottom', shape: 'oval', colors: [0x8a8a7a, 0xd9d3c0], baits: ALL_BAITS, desc: '흐린 날이면 어디서나. 너무 자주 걸려서 거스가 짜증을 낸다.' },
  { id: 'sandtrout', no: 6, name: '모래송어', rarity: 'common', places: ['sandbar'], cond: {}, size: [10, 16], pattern: 'B', behavior: 'curious', layer: 'middle', shape: 'slim', colors: [0xe8dcb0, 0xc9a86a], baits: ['shrimp', 'lure'], desc: '모래톱의 단골. 모래 색을 닮았다.' },
  { id: 'ladyfish', no: 7, name: '레이디피시', rarity: 'common', places: ['pier', 'river'], cond: { weather: ['맑음'] }, size: [14, 24], pattern: 'E', behavior: 'curious', layer: 'surface', shape: 'long', colors: [0xdfe6ef, 0x9fb7c9], baits: ['shrimp', 'lure'], desc: '맑은 날 강 하구에서 은빛으로 뛴다.' },
  { id: 'bluefish', no: 8, name: '블루피시', rarity: 'common', places: ['breakwater'], cond: { weather: ['바람'] }, size: [12, 20], pattern: 'D', behavior: 'hunter', layer: 'middle', shape: 'oval', colors: [0x6d9fbf, 0x3d5570], baits: ['pinfish', 'lure'], desc: '바람 부는 날 방파제의 사냥꾼.' },
  { id: 'specktrout', no: 9, name: '얼룩송어', rarity: 'uncommon', places: ['oyster'], cond: { before: 300 }, size: [14, 24], pattern: 'B', behavior: 'shy', layer: 'middle', shape: 'slim', colors: [0xb9c0b0, 0x3b3355], baits: ['shrimp', 'lure'], desc: '새벽 다섯 시 전, 굴 양식장. 겁이 많다.' },
  { id: 'redfish', no: 10, name: '레드피시', rarity: 'uncommon', places: ['oyster', 'river'], cond: { tide: '썰물' }, size: [18, 30], pattern: 'A', behavior: 'curious', layer: 'middle', shape: 'oval', colors: [0xe08a5a, 0x2f2a3d], baits: ['shrimp', 'crab'], desc: '썰물에 굴 양식장. 꼬리에 점이 1~5개. 점 개수마다 도감 칸이 따로 있다.' },
  { id: 'flounder', no: 11, name: '플라운더', rarity: 'uncommon', places: ['sandbar'], cond: { tide: '썰물' }, size: [12, 20], pattern: 'C', behavior: 'shy', layer: 'bottom', shape: 'flat', colors: [0xb8a888, 0x8a7a5a], baits: ['shrimp', 'pinfish'], desc: '모래톱 바닥에 납작 붙어 있다. 겁쟁이.' },
  { id: 'sheepshead', no: 12, name: '쉽스헤드', rarity: 'uncommon', places: ['wreck', 'pier'], cond: {}, size: [12, 20], pattern: 'C', behavior: 'shy', layer: 'bottom', shape: 'tall', colors: [0xd9d9d9, 0x2f2a3d], baits: ['crab', 'shrimp'], desc: '난파선 기둥을 갉아 먹는다. 사람 이빨 같은 이빨이 있다.' },
  { id: 'blackdrum', no: 13, name: '블랙드럼', rarity: 'uncommon', places: ['river'], cond: { weather: ['흐림'] }, size: [14, 30], pattern: 'C', behavior: 'curious', layer: 'bottom', shape: 'tall', colors: [0x5d5a6a, 0x3b3355], baits: ['crab', 'shrimp'], desc: '흐린 날 강 하구 바닥. 북 치는 소리를 낸다.' },
  { id: 'kingfish', no: 14, name: '걸프 킹피시', rarity: 'uncommon', places: ['beach'], cond: { weather: ['맑음'] }, size: [8, 14], pattern: 'F', behavior: 'curious', layer: 'bottom', shape: 'slim', colors: [0xc9c0b0, 0x9a9080], baits: ['shrimp'], desc: '맑은 날 해변 파도 밑.' },
  { id: 'needlefish', no: 15, name: '동갈치', rarity: 'uncommon', places: ['pier'], cond: { weather: ['맑음'] }, size: [12, 20], pattern: 'B', behavior: 'curious', layer: 'surface', shape: 'long', colors: [0x9fd6b0, 0x4f8f6f], baits: ['shrimp', 'lure'], desc: '부두 수면을 바늘처럼 가른다.' },
  { id: 'stingray', no: 16, name: '노랑가오리', rarity: 'uncommon', places: ['sandbar'], cond: {}, size: [12, 24], pattern: 'C', behavior: 'curious', layer: 'bottom', shape: 'ray', colors: [0xd9b45a, 0x8a6a3a], baits: ['shrimp', 'crab'], desc: '모래톱 바닥을 날듯이 헤엄친다. 놓아주자.', release: true },
  { id: 'spanishmackerel', no: 17, name: '스페인고등어', rarity: 'uncommon', places: ['channel'], cond: { notWeather: ['바람', '비'] }, size: [14, 24], pattern: 'D', behavior: 'hunter', layer: 'middle', shape: 'slim', colors: [0xbfd6e6, 0xe0c060], baits: ['pinfish', 'lure'], desc: '맑고 바람 없는 날 깊은 수로. 빠른 미끼를 쫓는다.' },
  { id: 'jack', no: 18, name: '잭 크레발', rarity: 'uncommon', places: ['channel'], cond: {}, size: [18, 36], pattern: 'D', behavior: 'hunter', layer: 'middle', shape: 'tall', colors: [0xc9c060, 0x6d7a5a], baits: ['pinfish', 'lure'], desc: '깊은 수로의 깡패. 엄청 세다.' },
  { id: 'puffer', no: 19, name: '복어', rarity: 'uncommon', places: ['pier'], cond: { weather: ['맑음'] }, size: [6, 10], pattern: 'F', behavior: 'curious', layer: 'middle', shape: 'puffer', colors: [0xe8d9a0, 0x8a7a5a], baits: ['shrimp'], desc: '잡으면 빵빵하게 부푼다. 화난 게 아니라 무서운 거다.' },
  { id: 'octopus', no: 20, name: '문어', rarity: 'uncommon', places: ['wreck'], cond: { weather: ['흐림'] }, size: [6, 18], pattern: 'C', behavior: 'thief', layer: 'bottom', shape: 'octopus', colors: [0xd98a8a, 0xb05a5a], baits: ['crab', 'shrimp'], desc: '흐린 날 난파선 바닥의 미끼 도둑. 다리가 여덟 개라 손이 빠르다.' },
  { id: 'tripletail', no: 21, name: '트리플테일', rarity: 'rare', places: ['oyster', 'channel', 'gusSpot'], cond: { weather: ['맑음'] }, size: [14, 24], pattern: 'A', behavior: 'curious', layer: 'surface', shape: 'tall', colors: [0x8a6a4a, 0xc9a86a], baits: ['shrimp'], desc: '떠다니는 부표나 나무 옆 수면에 비스듬히 누워 있다.' },
  { id: 'redsnapper', no: 22, name: '레드스내퍼', rarity: 'rare', places: ['wreck'], cond: {}, size: [16, 28], pattern: 'A', behavior: 'shy', layer: 'middle', shape: 'oval', colors: [0xff6f6f, 0xffb3b3], baits: ['pinfish', 'shrimp'], desc: '난파선의 붉은 보석. 겁이 많다.' },
  { id: 'grouper', no: 23, name: '갱 그루퍼', rarity: 'rare', places: ['wreck'], cond: { weather: ['흐림'] }, size: [20, 36], pattern: 'C', behavior: 'curious', layer: 'bottom', shape: 'big', colors: [0x8a7a6a, 0x5a4a3a], baits: ['pinfish', 'crab'], desc: '흐린 날 난파선 바닥의 큰 입.' },
  { id: 'cobia', no: 24, name: '코비아', rarity: 'rare', places: ['channel'], cond: { maxWeek: 4 }, size: [30, 50], pattern: 'D', behavior: 'curious', layer: 'middle', shape: 'shark', colors: [0x6d6a5a, 0xd9d3c0], baits: ['pinfish', 'crab'], desc: '철 초반, 가오리를 따라 깊은 수로에 들어온다.' },
  { id: 'kingmackerel', no: 25, name: '킹고등어', rarity: 'rare', places: ['channel'], cond: { moon: '보름' }, size: [30, 45], pattern: 'D', behavior: 'hunter', layer: 'middle', shape: 'long', colors: [0x9fb7c9, 0x5a7a9a], baits: ['pinfish', 'lure'], desc: '보름에 깊은 수로. 사냥꾼.' },
  { id: 'barracuda', no: 26, name: '바라쿠다', rarity: 'rare', places: ['wreck'], cond: { weather: ['맑음'] }, size: [30, 48], pattern: 'D', behavior: 'hunter', layer: 'middle', shape: 'long', colors: [0xb9c8d8, 0x3b3355], baits: ['pinfish', 'lure'], desc: '맑은 날 난파선. 반짝이는 것은 뭐든 문다.' },
  { id: 'bonnethead', no: 27, name: '보닛헤드 상어', rarity: 'rare', places: ['sandbar'], cond: { weather: ['맑음'] }, size: [24, 36], pattern: 'A', behavior: 'curious', layer: 'middle', shape: 'shark', colors: [0x9fa8b8, 0xdfe3ea], baits: ['shrimp', 'crab'], desc: '머리가 삽처럼 생긴 작은 상어. 놓아주자.', release: true },
  { id: 'seahorse', no: 28, name: '해마', rarity: 'rare', places: ['any'], cond: {}, size: [3, 6], pattern: null, behavior: 'curious', layer: 'bottom', shape: 'seahorse', colors: [0xffc76a, 0xe0a040], baits: [], desc: '그물로만 올라온다. 꼬리로 그물코를 꼭 잡고 있었다.', netOnly: true },
  { id: 'eel', no: 29, name: '미국뱀장어', rarity: 'rare', places: ['river', 'riverbank'], cond: { rainedYesterday: true }, size: [18, 30], pattern: 'B', behavior: 'curious', layer: 'bottom', shape: 'eel', colors: [0x6d6a3a, 0xc9c080], baits: ['shrimp', 'crab'], desc: '비 온 다음 날 강 하구 바닥을 기어 다닌다.' },
  { id: 'mahi', no: 30, name: '만새기', rarity: 'rare', places: ['channel'], cond: { minWeek: 6, weather: ['맑음'] }, size: [24, 40], pattern: 'E', behavior: 'hunter', layer: 'surface', shape: 'tall', colors: [0x7ccf6a, 0xffd45e], baits: ['pinfish', 'lure'], desc: '6주차부터, 깊은 수로 끝 해초 띠. 물 위로 뛰어오른다.' },
  { id: 'goldcroaker', no: 31, name: '황금 크로커', rarity: 'veryRare', places: ['sandbar'], cond: { chance: 0.5 }, size: [8, 12], pattern: 'F', behavior: 'school', layer: 'middle', shape: 'oval', colors: [0xffd45e, 0xffa45c], baits: ['shrimp'], desc: '행운의 물고기. 크로커 떼 사이에 아주 가끔 섞여 있다.' },
  { id: 'whitecat', no: 32, name: '흰 바다메기', rarity: 'veryRare', places: ['any'], cond: { weather: ['비'] }, size: [10, 16], pattern: 'C', behavior: 'thief', layer: 'bottom', shape: 'oval', colors: [0xfffaf0, 0xffd6d6], baits: ALL_BAITS, desc: '비 오는 날, 아주 가끔. 알비노.' },
  { id: 'tarpon', no: 33, name: '은빛 왕 · 타폰', rarity: 'legendary', places: ['channel'], cond: { moon: '보름', withinMinutesOfSailing: 30 }, size: [60, 80], pattern: 'E', behavior: 'hunter', layer: 'surface', shape: 'big', colors: [0xdfe6ef, 0x9fb7c9], baits: ['pinfish', 'lure'], desc: '보름날, 출항하고 30분 안에만 깊은 수로에 나타나는 은빛 왕. 놓아주자.', release: true, netProof: true },
  { id: 'oldred', no: 34, name: '올드 레드 · 황소 레드피시', rarity: 'legendary', places: ['oyster'], cond: { tide: '썰물', rainedYesterday: true }, size: [40, 50], pattern: 'A', behavior: 'shy', layer: 'middle', shape: 'big', colors: [0xd9704a, 0x2f2a3d], baits: ['shrimp', 'crab'], desc: '거스가 30년 동안 못 잡은 고기. 비 온 다음 날 썰물, 굴 양식장 남쪽.', netProof: true },
  { id: 'goliath', no: 35, name: '골리앗 그루퍼', rarity: 'legendary', places: ['wreck'], cond: { weather: ['흐림'], moon: '보름' }, size: [60, 90], pattern: 'C', behavior: 'curious', layer: 'bottom', shape: 'big', colors: [0x7a6a5a, 0x4a3a2a], baits: ['pinfish', 'crab'], desc: '난파선 가장 깊은 곳의 주인. 너무 커서 사진만 찍고 놓아준다.', release: true, netProof: true },
  { id: 'granddrum', no: 36, name: '할아버지 드럼', rarity: 'legendary', places: ['river'], cond: { weather: ['비'], tide: '밀물' }, size: [40, 60], pattern: 'C', behavior: 'curious', layer: 'bottom', shape: 'big', colors: [0x6a6a7a, 0x3b3355], baits: ['crab', 'shrimp'], desc: '비 오는 날 밀물, 강 하구 바닥에서 북 치는 소리가 난다.', netProof: true },
];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: '흔함',
  uncommon: '보통',
  rare: '드묾',
  veryRare: '아주 드묾',
  legendary: '전설',
};

/** Price range per fish by rarity (legendaries cannot be sold). */
export const RARITY_PRICE: Record<Rarity, [number, number]> = {
  common: [2, 6],
  uncommon: [8, 20],
  rare: [25, 60],
  veryRare: [70, 110],
  legendary: [0, 0],
};

/** Spawn weight by rarity. */
export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 100,
  uncommon: 34,
  rare: 7,
  veryRare: 1.6,
  legendary: 1.2,
};

export function fishDef(id: string): FishDef | undefined {
  return FISH.find((f) => f.id === id);
}

/** Pounds from length in inches (rough Gulf fish shape). */
export function fishWeight(f: FishDef, inches: number): number {
  const k = f.shape === 'eel' || f.shape === 'long' ? 0.00018 : f.shape === 'flat' || f.shape === 'ray' ? 0.0005 : f.shape === 'seahorse' ? 0.0003 : 0.0004;
  return Math.round(k * inches ** 3 * 10) / 10;
}

/** Sale price for one fish of the given length. */
export function fishPrice(f: FishDef, inches: number): number {
  const [a, b] = RARITY_PRICE[f.rarity];
  const t = (inches - f.size[0]) / Math.max(1, f.size[1] - f.size[0]);
  return Math.round((a + (b - a) * Math.max(0, Math.min(1, t))) * 100) / 100;
}
