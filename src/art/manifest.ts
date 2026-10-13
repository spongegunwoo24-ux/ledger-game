import Phaser from 'phaser';
import { CHARACTER_KEYS, charTexKey, generateCharacters, portraitKey } from './characters';
import { CURIO_IDS, generateItems } from './items';
import { generateBoats } from './boats';
import { fishTexKey, generateFish } from './fish';
import { FISH } from '../data/fish';
import { TEX_SCALE } from './pen';

/**
 * Every texture key the game uses. A human can replace any of these with a drawn
 * PNG later: drop the file in /public/art/<key>.png and list the key in
 * `REPLACEMENTS` below — the procedural texture is then skipped.
 * Drawn PNGs should be made at 2× the logical size (TEX_SCALE).
 */
export const TEXTURE_KEYS: string[] = [
  ...CHARACTER_KEYS.map(charTexKey),
  ...CHARACTER_KEYS.map(portraitKey),
  'ch_ledger',
  'ch_ledger_fly',
  'ch_ledger_gulp',
  'por_ledger',
  'ch_biscuit',
  'por_biscuit',
  'it_shrimp_small',
  'it_shrimp_medium',
  'it_shrimp_large',
  'it_crab',
  'it_fish_croaker',
  'it_fish_pinfish',
  'it_fish_mullet',
  'it_turtle',
  'it_trash_can',
  'it_trash_boot',
  'it_trash_weed',
  'it_trash_bag',
  'it_trash_tire',
  ...CURIO_IDS.map((c) => `it_${c}`),
  'it_s_bottle_note',
  'it_s_tobacco_tin',
  'it_s_hank_trap_river',
  'it_s_hank_trap_oyster',
  'bin_basket_small',
  'bin_basket_medium',
  'bin_basket_large',
  'bin_bucket',
  'bin_barrel',
  'bin_crate',
  'bin_icebox',
  'fx_splash',
  'fx_dot',
  'fx_coin',
  'fx_note',
  'fx_heart',
  'fx_sparkle',
  'prop_paintcan',
  'prop_letterbox',
  'prop_logbook',
  'prop_beer',
  'prop_nameplate',
  'prop_parcel',
  'prop_parcels',
  'prop_pharmacy_ledger',
  'prop_daniel_notebook',
  'boat_marylou',
  'boat_calvin',
  'boat_other',
  'sc_gull',
  'sc_palm',
  'sc_buoy',
  'sc_lighthouse',
  ...FISH.map((f) => fishTexKey(f.id)),
  'it_goldshrimp',
  'fx_dark_hole',
];

/** Keys that have a hand-drawn PNG in public/art/. Empty until art arrives. */
export const REPLACEMENTS: string[] = [];

export function preloadReplacements(scene: Phaser.Scene): void {
  for (const key of REPLACEMENTS) scene.load.image(key, `art/${key}.png`);
}

export function generateAllTextures(scene: Phaser.Scene): void {
  const keep = new Map<string, Phaser.Textures.Texture>();
  for (const key of REPLACEMENTS) if (scene.textures.exists(key)) keep.set(key, scene.textures.get(key));
  generateCharacters(scene);
  generateItems(scene);
  generateBoats(scene);
  generateFish(scene);
  // restore replaced textures over the procedural ones
  for (const key of REPLACEMENTS) {
    if (!keep.has(key)) continue;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.load.image(key, `art/${key}.png`);
  }
  if (REPLACEMENTS.length) scene.load.start();
}

/** Adds an image at logical scale 1 (textures are baked at TEX_SCALE). */
export function addSprite(scene: Phaser.Scene, x: number, y: number, key: string, scale = 1): Phaser.GameObjects.Image {
  return scene.add.image(x, y, key).setScale(scale / TEX_SCALE);
}
