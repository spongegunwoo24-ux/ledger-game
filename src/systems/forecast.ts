import type { GameState } from '../core/state';
import { FISH, type FishDef, type FishPlace } from '../data/fish';
import { GROUND_NAMES } from '../data/groundNames';
import { SHORES } from '../data/shore';
import { conditionsFor } from './fishing';

/**
 * [변경 2] The radio before sleep (DESIGN §8.17 #5): tomorrow's weather, tide and moon,
 * and one fish whose conditions line up tomorrow ("내일은 보름에 썰물. 레드피시가 굴 양식장에 몰립니다.").
 */
function placeName(p: FishPlace): string {
  const shore = SHORES.find((s) => s.place === p);
  if (shore) return shore.name;
  return (GROUND_NAMES as Record<string, string>)[p] ?? '앞바다';
}

/** a fish that has a specific condition met tomorrow (the interesting ones), rarer first */
export function tomorrowsFish(s: GameState): FishDef | null {
  const c = conditionsFor(s.day + 1, s.seed);
  const order = { legendary: 0, veryRare: 1, rare: 2, uncommon: 3, common: 4 } as const;
  const hits = FISH.filter((f) => {
    const k = f.cond;
    const specific = k.tide || k.moon || k.weather || k.rainedYesterday;
    if (!specific || f.rarity === 'legendary') return false;
    if (k.tide && k.tide !== c.tide) return false;
    if (k.moon && k.moon !== c.moon) return false;
    if (k.weather && !k.weather.includes(c.weather)) return false;
    if (k.notWeather && k.notWeather.includes(c.weather)) return false;
    if (k.rainedYesterday && !c.rainedYesterday) return false;
    return f.places.some((p) => p !== 'any');
  }).sort((a, b) => order[a.rarity] - order[b.rarity]);
  if (!hits.length) return null;
  // vary between days with the same conditions
  return hits[(s.day * 7) % Math.min(3, hits.length)];
}

export function forecastLines(s: GameState): string[] {
  const c = conditionsFor(s.day + 1, s.seed);
  const lines = [`내일 날씨는 ${c.weather}, ${c.tide}, ${c.moon}달입니다.`];
  const f = tomorrowsFish(s);
  if (f) {
    const where = placeName(f.places.find((p) => p !== 'any')!);
    lines.push(`${f.name.split(' · ')[0]}가 ${where} 쪽에 몰린다는 소식입니다.`);
  } else lines.push('바다는 조용하겠습니다. 새우잡이엔 나쁘지 않은 날.');
  if (c.weather === '폭풍') lines.push('어선은 출항을 삼가 주십시오.');
  return lines;
}
