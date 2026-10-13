/** [변경 2] Things to pick up on the beach while walking the town (DESIGN §5.2, encyclopedia). */
export type FindRarity = 'common' | 'uncommon' | 'rare';

export interface FindDef {
  id: string;
  name: string;
  rarity: FindRarity;
  color: number;
  desc: string;
}

export const FINDS: FindDef[] = [
  { id: 'f_scallop', name: '가리비 껍데기', rarity: 'common', color: 0xffc7a8, desc: '부채처럼 골이 진 껍데기. 해변에 제일 흔하다.' },
  { id: 'f_whelk', name: '고둥 껍데기', rarity: 'common', color: 0xe2bf8f, desc: '귀에 대면 바다 소리가 난다고들 한다. 사실은 내 피 도는 소리다.' },
  { id: 'f_glass_green', name: '초록 바다 유리', rarity: 'common', color: 0x9fd69a, desc: '맥주병이었을 거다. 파도가 모서리를 다 갈아 버렸다.' },
  { id: 'f_driftwood', name: '유목 조각', rarity: 'common', color: 0xc99a6b, desc: '하얗게 바랜 나무. 어디서 왔는지는 바다만 안다.' },
  { id: 'f_bottlecap', name: '녹슨 병뚜껑', rarity: 'common', color: 0xd7263d, desc: '닥터페퍼. 이것도 해변의 일부다.' },
  { id: 'f_sanddollar', name: '모래 달러', rarity: 'uncommon', color: 0xfff3d6, desc: '동전처럼 납작한 성게 껍데기. 깨지지 않은 건 드물다.' },
  { id: 'f_starfish', name: '마른 불가사리', rarity: 'uncommon', color: 0xffa45c, desc: '팔 하나가 짧다. 다시 자라던 중이었나 보다.' },
  { id: 'f_glass_blue', name: '파란 바다 유리', rarity: 'rare', color: 0x6cc4d6, desc: '파란 건 귀하다. 약병이었을지도 모른다.' },
  { id: 'f_sharktooth', name: '상어 이빨', rarity: 'rare', color: 0x3b3355, desc: '검게 굳은 이빨. 몇백 년은 됐다고 메이블이 그랬다.' },
  { id: 'f_lightning', name: '번개 고둥', rarity: 'rare', color: 0xf5e3b3, desc: '왼쪽으로 감긴 고둥. 이 바다에만 산다.' },
];

export const FIND_WEIGHT: Record<FindRarity, number> = { common: 10, uncommon: 4, rare: 1 };

export function findDef(id: string): FindDef | undefined {
  return FINDS.find((f) => f.id === id);
}
