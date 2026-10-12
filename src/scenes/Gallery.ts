import Phaser from 'phaser';
import { CHARACTER_KEYS, charTexKey, portraitKey } from '../art/characters';
import { CURIO_IDS } from '../art/items';
import { addSprite } from '../art/manifest';
import { FONT_UI } from '../art/palette';

/** Art preview (open with ?gallery=1). */
export class GalleryScene extends Phaser.Scene {
  constructor() {
    super('Gallery');
  }

  create() {
    this.cameras.main.setBackgroundColor('#F5E3B3');
    const ids = [...CHARACTER_KEYS];
    ids.forEach((id, i) => {
      const x = 50 + (i % 13) * 94;
      const y = 80 + Math.floor(i / 13) * 150;
      addSprite(this, x, y, charTexKey(id));
      this.add.text(x, y + 70, id, { fontFamily: FONT_UI, fontSize: '13px', color: '#3B3355' }).setOrigin(0.5, 0);
    });
    ['ledger', 'gus', 'calvin', 'eli', 'rosa'].forEach((id, i) => addSprite(this, 60 + i * 70, 400, id === 'ledger' ? 'por_ledger' : portraitKey(id), 0.5));
    addSprite(this, 420, 400, 'ch_ledger');
    addSprite(this, 500, 400, 'ch_ledger_fly');
    addSprite(this, 580, 400, 'ch_ledger_gulp');
    addSprite(this, 660, 400, 'ch_biscuit');
    const items = [
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
    ];
    items.forEach((k, i) => addSprite(this, 40 + (i % 18) * 68, 480 + Math.floor(i / 18) * 60, k));
    ['bin_basket_small', 'bin_basket_medium', 'bin_basket_large', 'bin_bucket', 'bin_barrel', 'bin_crate'].forEach((k, i) =>
      addSprite(this, 60 + i * 100, 660, k),
    );
    addSprite(this, 900, 600, 'boat_marylou', 0.8);
    addSprite(this, 1180, 640, 'boat_calvin', 0.6);
    addSprite(this, 1220, 420, 'sc_lighthouse', 0.6);
    addSprite(this, 760, 400, 'sc_palm', 0.5);
  }
}
