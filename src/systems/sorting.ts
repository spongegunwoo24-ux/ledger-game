import { TUNING } from '../config/tuning';
import type { ShrimpSize } from '../core/types';
import type { CatchItem } from '../data/catch';

export type BinId = 'small' | 'medium' | 'large' | 'crab' | 'trash' | 'sea' | 'ledger' | 'keep';

export type Outcome =
  | 'basket'
  | 'basketLow'
  | 'crab'
  | 'trashed'
  | 'released'
  | 'turtleSaved'
  | 'turtleBinned'
  | 'fed'
  | 'kept'
  | 'lost'
  | 'storyTrashed'
  | 'reject';

const SIZE_RANK: Record<ShrimpSize, number> = { small: 0, medium: 1, large: 2 };

/** Decide what happens when an item is dropped on a bin. `reject` means it bounces back. */
export function placeItem(item: CatchItem, bin: BinId): Outcome {
  switch (item.kind) {
    case 'shrimp':
      if (bin === 'small' || bin === 'medium' || bin === 'large') {
        return bin === (item.size ?? 'small') ? 'basket' : 'basketLow';
      }
      if (bin === 'trash') return 'lost';
      if (bin === 'sea') return 'lost';
      if (bin === 'ledger') return 'fed';
      return 'reject';
    case 'crab':
      if (bin === 'crab') return 'crab';
      if (bin === 'sea') return 'released';
      if (bin === 'trash') return 'lost';
      return 'reject';
    case 'fish':
      if (bin === 'ledger') return 'fed';
      if (bin === 'sea') return 'released';
      if (bin === 'trash') return 'trashed';
      return 'reject';
    case 'trash':
      if (bin === 'trash') return 'trashed';
      return 'reject';
    case 'turtle':
      if (bin === 'sea') return 'turtleSaved';
      if (bin === 'trash') return 'turtleBinned';
      return 'reject';
    case 'curio':
      if (bin === 'keep') return 'kept';
      if (bin === 'trash' || bin === 'sea') return 'lost';
      return 'reject';
    case 'story':
      if (bin === 'keep') return 'kept';
      if (bin === 'trash') return 'storyTrashed';
      return 'reject';
  }
}

/** Price class an accepted shrimp is sold as: wrong basket = the lower of the two. */
export function soldAs(item: CatchItem, bin: BinId): ShrimpSize {
  const own = item.size ?? 'small';
  if (bin !== 'small' && bin !== 'medium' && bin !== 'large') return own;
  return SIZE_RANK[bin] < SIZE_RANK[own] ? bin : own;
}

export interface SortTally {
  lbs: Record<ShrimpSize, number>;
  crabs: number;
  wrongBasket: number;
  turtlesSaved: number;
  turtlesBinned: number;
  fed: number;
  stolen: number;
  lost: number;
  kept: string[];
  storyKept: string[];
  storyTrashed: string[];
}

export function emptyTally(): SortTally {
  return {
    lbs: { small: 0, medium: 0, large: 0 },
    crabs: 0,
    wrongBasket: 0,
    turtlesSaved: 0,
    turtlesBinned: 0,
    fed: 0,
    stolen: 0,
    lost: 0,
    kept: [],
    storyKept: [],
    storyTrashed: [],
  };
}

export function recordOutcome(t: SortTally, item: CatchItem, bin: BinId, outcome: Outcome): void {
  const lb = TUNING.trawl.lbsPerShrimpItem;
  switch (outcome) {
    case 'basket':
    case 'basketLow': {
      const s = soldAs(item, bin);
      t.lbs[s] += lb;
      if (s !== item.size) t.wrongBasket += 1;
      break;
    }
    case 'crab':
      t.crabs += 1;
      break;
    case 'turtleSaved':
      t.turtlesSaved += 1;
      break;
    case 'turtleBinned':
      t.turtlesBinned += 1;
      break;
    case 'fed':
      t.fed += 1;
      break;
    case 'lost':
      t.lost += 1;
      break;
    case 'kept':
      if (item.kind === 'story' && item.id) t.storyKept.push(item.id);
      else if (item.id) t.kept.push(item.id);
      break;
    case 'storyTrashed':
      if (item.id) t.storyTrashed.push(item.id);
      break;
    default:
      break;
  }
}

/** Which bin a correct sorter would use (Gus and the sorting table use this). */
export function correctBin(item: CatchItem, ledgerHungry: boolean): BinId {
  switch (item.kind) {
    case 'shrimp':
      return item.size ?? 'small';
    case 'crab':
      return 'crab';
    case 'fish':
      return ledgerHungry ? 'ledger' : 'sea';
    case 'trash':
      return 'trash';
    case 'turtle':
      return 'sea';
    case 'curio':
    case 'story':
      return 'keep';
  }
}
