import type { Cond } from '../core/conditions';
import type { BackdropKey } from '../core/events';
import type { LocId } from '../core/types';
import { LOC_NAMES } from './names';

export interface LocationDef {
  id: LocId;
  name: string;
  bg: BackdropKey;
  /** node position on the town map */
  x: number;
  y: number;
  /** node is shown/usable only when met */
  requires?: Cond | Cond[];
  /** thought shown when nothing else happens there */
  idle: string[];
}

export const LOCATIONS: LocationDef[] = [
  { id: 'home', name: LOC_NAMES.home, bg: 'home', x: 170, y: 250, idle: ['집이다. 오후에 집에 있으면 하루가 일찍 끝난다.'] },
  { id: 'dock', name: LOC_NAMES.dock, bg: 'dock', x: 330, y: 560, idle: ['메리 루가 밧줄에 매여 흔들린다. 갈매기가 기둥마다 한 마리씩.', '부두 판자가 햇볕에 뜨겁다.'] },
  { id: 'diner', name: LOC_NAMES.diner, bg: 'diner', x: 560, y: 330, idle: ['네온사인이 낮에도 켜져 있다. 커피 냄새.'] },
  { id: 'church', name: LOC_NAMES.church, bg: 'church', x: 760, y: 200, idle: ['성당 안은 서늘하다. 초 일곱 개가 흔들린다.'] },
  { id: 'bank', name: LOC_NAMES.bank, bg: 'bank', x: 660, y: 440, idle: ['에어컨이 너무 세다. 은행은 어디나 그렇다.'] },
  { id: 'sheriff', name: LOC_NAMES.sheriff, bg: 'sheriff', x: 900, y: 360, idle: ['"던바를 다시 한번!" 포스터가 벽마다 붙어 있다.'] },
  { id: 'fishMarket', name: LOC_NAMES.fishMarket, bg: 'fishMarket', x: 470, y: 600, idle: ['어부들이 나를 보더니 목소리를 낮춘다.'] },
  { id: 'secondhand', name: LOC_NAMES.secondhand, bg: 'secondhand', x: 420, y: 180, idle: ['종이 딸랑. 오래된 물건 냄새.'] },
  { id: 'pawn', name: LOC_NAMES.pawn, bg: 'pawn', x: 1000, y: 520, idle: ['창살 너머로 기타가 걸려 있다. 어디서 많이 본 기타다.'] },
  { id: 'pharmacy', name: LOC_NAMES.pharmacy, bg: 'pharmacy', x: 1060, y: 240, idle: ['문에 빛바랜 종이: "곧 돌아옵니다". 종이가 문보다 오래돼 보인다.'] },
  { id: 'calvinCabin', name: LOC_NAMES.calvinCabin, bg: 'calvinYard', x: 1150, y: 400, idle: ['잘 깎인 잔디. 현관에 장화가 가지런하다.'] },
  { id: 'gusHouse', name: LOC_NAMES.gusHouse, bg: 'gusHouse', x: 240, y: 430, idle: ['낡은 집. 창문에 그물 조각이 커튼처럼 걸려 있다.'] },
  {
    id: 'edithHouse',
    name: LOC_NAMES.edithHouse,
    bg: 'edithHouse',
    x: 900,
    y: 620,
    requires: { day: { gte: 37 } },
    idle: ['오래 비어 있던 집. 창틀에 말라붙은 화분.'],
  },
  { id: 'board', name: LOC_NAMES.board, bg: 'board', x: 760, y: 560, idle: ['게시판에 실종 전단 일곱 장. 오래된 것일수록 색이 바랬다.'] },
  { id: 'lighthouse', name: LOC_NAMES.lighthouse, bg: 'lighthouse', x: 1180, y: 120, idle: ['등대에서 내려다보면 그 앞바다가 보인다. 그냥 물이다. 다른 데랑 똑같은.'] },
  { id: 'dunes', name: LOC_NAMES.dunes, bg: 'dunes', x: 120, y: 620, idle: ['모래언덕. 바람이 발자국을 금방 지운다.'] },
];

export function locationDef(id: LocId): LocationDef {
  const l = LOCATIONS.find((x) => x.id === id);
  if (!l) throw new Error(`unknown location ${id}`);
  return l;
}
