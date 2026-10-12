/** Official statements from the trial file (DESIGN §8.11). Evidence requirements are used from M4. */
export interface StatementDef {
  id: string;
  text: string;
  requires: string[];
  optional?: string[];
}

export const STATEMENTS: StatementDef[] = [
  { id: 'S01', text: '피고인 월트 할로우는 펠리컨 코브 실종 7건 전부에 관여했다.', requires: ['S02', 'S03', 'S04'] },
  { id: 'S02', text: '에디스 클레이는 피고인에게 살해되었다.', requires: ['E_EDITH_NEIGHBOR', 'E_EDITH_MEDS'] },
  { id: 'S03', text: '준 파이크는 피고인에게 살해되었다.', requires: ['E_PHARMACY_LEDGER', 'E_PIKE_CAR'] },
  { id: 'S04', text: '샐 모레티가 사라진 밤, 피고인의 배는 바다에 있었다.', requires: ['E_ROSA_BACKDOOR', 'E_LOGBOOK_DOCKED'], optional: ['E_ROSA_BOOTS'] },
  { id: 'S05', text: '메리 루 호 선창에서 실종자들의 소지품이 발견되었다.', requires: ['E_NORA_EVIDENCE_PHOTO', 'E_GUS_CONFESSION'], optional: ['E_GUS_LETTER'] },
  { id: 'S06', text: '피고인은 사건이 있던 밤마다 바다에 나갔다. (증인: 거스)', requires: ['E_LOGBOOK_ONE_NIGHT', 'E_GUS_CONFESSION'] },
  { id: 'S07', text: '대니얼 웹의 시신에서 메리 루 호의 밧줄 섬유가 발견되었다.', requires: ['E_DANIEL_WATCH', 'E_GUS_CONFESSION'] },
  { id: 'S08', text: '피고인은 대니얼 웹과 다툰 뒤 그를 살해했다.', requires: ['E_DANIEL_NOTES', 'E_DANIEL_NOTE_UNSENT'], optional: ['E_LETTERS_DANIEL'] },
  { id: 'S09', text: '피고인 체포 후 실종은 멈췄다. 이것이 유죄의 증거다.', requires: ['E_GUS_MISSING', 'E_KNOT_FRAMES'], optional: ['E_CALVIN_BOAT_DEPTH'] },
];
