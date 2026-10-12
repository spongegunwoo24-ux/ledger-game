/** [변경 1] Bait types (8.14). Sold at Hank's stand at dawn. */
export type BaitId = 'shrimp' | 'pinfish' | 'crab' | 'lure';

export interface BaitDef {
  id: BaitId;
  name: string;
  price: number;
  pack: number;
  /** attraction radius in px around the bait */
  range: number;
  desc: string;
  /** lures are not used up when a fish bites; only lost when the line breaks */
  reusable?: boolean;
}

export const BAITS: BaitDef[] = [
  { id: 'shrimp', name: '새우 미끼', price: 2, pack: 10, range: 150, desc: '거의 모든 고기가 문다. 미끼 도둑도 제일 좋아한다.' },
  { id: 'pinfish', name: '살아있는 핀피시', price: 4, pack: 4, range: 230, desc: '큰 사냥꾼들이 멀리서도 달려온다.' },
  { id: 'crab', name: '게 미끼', price: 3, pack: 5, range: 130, desc: '쉽스헤드와 블랙드럼이 좋아한다. 바닥에 두면 좋다.' },
  { id: 'lure', name: '반짝이 루어', price: 6, pack: 1, range: 200, desc: '송어, 고등어, 사냥꾼만 문다. 줄이 끊기지 않으면 계속 쓴다.', reusable: true },
];

export function baitDef(id: string): BaitDef {
  return BAITS.find((b) => b.id === id) ?? BAITS[0];
}
