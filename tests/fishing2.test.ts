import { describe, expect, it } from 'vitest';
import { makeRng } from '../src/core/rng';
import { FISH, fishPrice, RARITY_PRICE } from '../src/data/fish';
import { FightModel } from '../src/systems/fight';
import { eligibleFish, type SpawnContext } from '../src/systems/fishSpawn';
import { conditionsFor, haulGrade, rollHaul } from '../src/systems/fishing';
import { newGame } from '../src/core/state';
import { paymentStatusLine } from '../src/systems/notebook';

const ctx = (over: Partial<SpawnContext> = {}): SpawnContext => ({
  place: 'oyster',
  conditions: { tide: '썰물', moon: '보름', weather: '맑음', rainedYesterday: false },
  time: 270,
  minutesSinceSail: 10,
  day: 10,
  ...over,
});

describe('[변경 1] fish table', () => {
  it('has the 36 fish, numbered 1–36', () => {
    expect(FISH.length).toBe(36);
    expect(FISH.map((f) => f.no)).toEqual(Array.from({ length: 36 }, (_, i) => i + 1));
  });

  it('prices follow rarity; legendaries cannot be sold', () => {
    for (const f of FISH) {
      const [a, b] = RARITY_PRICE[f.rarity];
      const p = fishPrice(f, (f.size[0] + f.size[1]) / 2);
      expect(p).toBeGreaterThanOrEqual(a);
      expect(p).toBeLessThanOrEqual(b);
    }
    expect(RARITY_PRICE.legendary).toEqual([0, 0]);
  });

  it('conditions gate the spawns (Old Red: oyster, ebb tide, the day after rain)', () => {
    const ids = (c: SpawnContext) => eligibleFish(c).map((f) => f.id);
    expect(ids(ctx())).not.toContain('oldred');
    expect(ids(ctx({ conditions: { tide: '썰물', moon: '상현', weather: '흐림', rainedYesterday: true } }))).toContain('oldred');
    expect(ids(ctx({ time: 290 }))).toContain('specktrout');
    expect(ids(ctx({ time: 320 }))).not.toContain('specktrout');
    expect(ids(ctx({ place: 'channel', minutesSinceSail: 10 }))).toContain('tarpon');
    expect(ids(ctx({ place: 'channel', minutesSinceSail: 45 }))).not.toContain('tarpon');
    expect(ids(ctx({ place: 'sandbar' }))).not.toContain('seahorse');
  });

  it('a held, steady fight is winnable; a careless one snaps', () => {
    const win = new FightModel('A', 3, makeRng(1));
    for (let i = 0; i < 200 && !win.result; i++) {
      win.update(0.1, win.want);
      win.tap(win.want);
    }
    expect(win.result).toBe('win');
    const lose = new FightModel('C', 3, makeRng(1));
    for (let i = 0; i < 200 && !lose.result; i++) {
      lose.update(0.1, 'none');
      lose.tap('none');
    }
    expect(lose.result).toBe('lose');
  });

  it('haul grades', () => {
    const items = rollHaul({
      ground: 'gusSpot',
      minutes: 75,
      conditions: conditionsFor(10, 3),
      netTornAtStart: false,
      snagged: false,
      snagLoss: 0,
      day: 10,
      towIndex: 1,
      rng: makeRng(2),
      storyTaken: [],
      netFish: [],
    });
    expect(['보통', '풍어', '대박', '전설의 그물']).toContain(haulGrade(items, 'gusSpot'));
    expect(haulGrade([], 'oyster')).toBe('보통');
  });
});

describe('[변경 1] payment status line', () => {
  it('reads like the brief', () => {
    const s = newGame(1);
    s.day = 5;
    s.money = 120;
    expect(paymentStatusLine(s)).toBe('이번 주 상환 $250 · 모은 돈 $120 · 금요일까지 2일');
    s.day = 7;
    expect(paymentStatusLine(s)).toContain('오늘 17시까지');
  });
});
