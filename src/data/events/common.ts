import type { EventDef } from '../../core/events';

/** Repeatable, non-scheduled events (church Sundays, fines, …). */
export const COMMON_EVENTS: EventDef[] = [
  {
    id: 'SUN_CHURCH',
    summary: '일요일 미사에 갔다. 제단 옆에는 실종된 사람들을 위한 초가 켜져 있다.',
    trigger: { segment: 'morning', requires: { flag: 'churchToday' }, once: false },
    order: 5,
    bg: 'church',
    tint: 'morning',
    actors: [
      { who: 'matthew', at: { x: 640, y: 520 } },
      { who: 'eli', at: { x: 380, y: 548 } },
    ],
    steps: [
      { t: 'sfx', id: 'bell' },
      { t: 'narrate', text: '일요일 미사. 맨 뒷줄 끝자리가 비어 있다. 아무도 내 옆에 앉지 않는다.' },
      {
        t: 'if',
        cond: { day: { lte: 2 } },
        then: [
          { t: 'say', who: 'matthew', text: '오셨네요. 앉고 싶은 데 앉으세요. 성당 의자는 누구 것도 아니에요.' },
          { t: 'think', text: '앞쪽 제단 옆에 초가 일곱 개 켜져 있다. 이름표는 없다.' },
          { t: 'say', who: 'matthew', text: '실종된 분들 초예요. 7년째 켜 두고 있어요.' },
        ],
        else: [
          {
            t: 'if',
            cond: { feel: 'matthew', gte: 80 },
            then: [{ t: 'say', who: 'matthew', text: '일라이 씨 자리, 오늘은 제가 미리 닦아 뒀어요.' }],
            else: [{ t: 'say', who: 'matthew', text: '평화가 함께하기를. 오늘은 바다가 잔잔하대요.' }],
          },
        ],
      },
      { t: 'think', text: '설교는 반쯤 졸면서 들었다. 그래도 끝나고 나니 어깨가 조금 가볍다.' },
      { t: 'effect', effects: [{ feel: 'matthew', delta: 3 }, { clearFlag: 'churchToday' }] },
    ],
  },
  {
    id: 'LEE_FINE',
    summary: '바다거북을 쓰레기통에 버린 일로 단속관 리에게 경고장과 벌금 20달러를 받았다.',
    trigger: { segment: 'morning', requires: { flag: 'turtleBinned' }, once: false },
    order: 6,
    bg: 'dock',
    tint: 'morning',
    actors: [
      { who: 'eli', at: { x: 460, y: 548 } },
      { who: 'lee', at: { x: 800, y: 548 }, face: -1 },
    ],
    steps: [
      { t: 'say', who: 'lee', text: '안녕하세요! 수산 단속관 리예요. 어제 바다거북 한 마리가 쓰레기통에서 발견됐다는 제보가 있어서요.' },
      { t: 'say', who: 'lee', text: '거북은 난간 너머로, 바다로. 꼭이요! 이번엔 경고장이랑 벌금 20달러만 쓸게요.' },
      { t: 'narrate', text: '리 단속관은 경고장 귀퉁이에 웃는 거북을 그려 주었다. 벌금은 안 웃었다.' },
      { t: 'think', text: '부두 끝에서 어부 몇이 이쪽을 보며 수군거린다.' },
      { t: 'effect', effects: [{ money: -20 }, { feel: 'fishermen', delta: -3 }, { clearFlag: 'turtleBinned' }] },
    ],
  },
];
