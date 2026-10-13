import type { GroundId } from '../core/types';
import type { FishPlace } from './fish';

/** [변경 2] Land fishing spots in the walkable town (DESIGN §5.2): pier end, breakwater, riverbank, beach. */
export type ShoreId = 'pier' | 'breakwater' | 'riverbank' | 'beach';

export interface ShoreDef {
  id: ShoreId;
  name: string;
  /** spawn table place, plus the water next to it */
  place: FishPlace;
  also: FishPlace[];
  /** which sea ground's water colors to draw */
  water: GroundId;
  /** where you stand in town (world coordinates) */
  town: { x: number; y: number };
  desc: string;
}

export const SHORES: ShoreDef[] = [
  { id: 'pier', name: '부두 끝', place: 'pier', also: [], water: 'oyster', town: { x: 660, y: 1372 }, desc: '판자 끝에 걸터앉는다. 핀피시와 숭어가 기둥 사이를 돈다.' },
  { id: 'breakwater', name: '등대 방파제', place: 'breakwater', also: ['channel'], water: 'channel', town: { x: 2300, y: 380 }, desc: '바위 틈으로 물살이 빠르다. 큰 놈이 지나가는 길목.' },
  { id: 'riverbank', name: '강둑', place: 'riverbank', also: ['river'], water: 'river', town: { x: 250, y: 760 }, desc: '갈대 사이 흙탕물. 비 온 다음 날이 좋다.' },
  { id: 'beach', name: '해변', place: 'beach', also: ['sandbar'], water: 'sandbar', town: { x: 1250, y: 1352 }, desc: '파도 끝에 미끼를 던진다. 모래톱 고기들이 들어온다.' },
];

export function shoreDef(id: ShoreId): ShoreDef {
  return SHORES.find((x) => x.id === id) ?? SHORES[0];
}
