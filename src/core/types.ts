// Shared identifiers and small value types used across systems and data.

export type Segment = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
export const SEGMENTS: Segment[] = ['dawn', 'morning', 'afternoon', 'evening', 'night'];

export type CharId =
  | 'eli'
  | 'walt'
  | 'gus'
  | 'calvin'
  | 'toby'
  | 'dunbar'
  | 'pike'
  | 'nora'
  | 'matthew'
  | 'rosa'
  | 'ledger'
  | 'maisie'
  | 'joanne'
  | 'hank'
  | 'dewey'
  | 'priya'
  | 'cole'
  | 'mabel'
  | 'vince'
  | 'lucia'
  | 'webbs'
  | 'ada'
  | 'lee'
  | 'biscuit'
  | 'townsfolk'
  | 'fisherman';

/** Feeling keys: named NPCs plus two groups. */
export type FeelId =
  | 'rosa'
  | 'webbs'
  | 'lucia'
  | 'fishermen'
  | 'kids'
  | 'maisie'
  | 'joanne'
  | 'gus'
  | 'matthew'
  | 'nora'
  | 'mabel'
  | 'hank'
  | 'priya'
  | 'toby'
  | 'dunbar'
  | 'pike'
  | 'calvin'
  | 'ada';

export type LocId =
  | 'home'
  | 'dock'
  | 'diner'
  | 'church'
  | 'bank'
  | 'sheriff'
  | 'fishMarket'
  | 'secondhand'
  | 'pawn'
  | 'pharmacy'
  | 'calvinCabin'
  | 'gusHouse'
  | 'edithHouse'
  | 'board'
  | 'lighthouse'
  | 'dunes';

export type GroundId = 'oyster' | 'sandbar' | 'wreck' | 'river' | 'channel' | 'gusSpot' | 'theSpot';

export type Tide = '밀물' | '썰물';
export type Moon = '초승' | '상현' | '보름' | '하현';
export type Weather = '맑음' | '흐림' | '비' | '바람' | '폭풍';

export type Mood = 'neutral' | 'happy' | 'sad' | 'angry' | 'worried' | 'smile' | 'quiet';

export type ShrimpSize = 'small' | 'medium' | 'large';

export interface Point {
  x: number;
  y: number;
}
