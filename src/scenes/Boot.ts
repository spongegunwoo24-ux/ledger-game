import Phaser from 'phaser';
import { generateAllTextures, preloadReplacements } from '../art/manifest';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    preloadReplacements(this);
  }

  create() {
    generateAllTextures(this);
    const params = new URLSearchParams(window.location.search);
    if (params.get('gallery') === '1') this.scene.start('Gallery');
    else this.scene.start('Title');
  }
}
