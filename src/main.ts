import Phaser from 'phaser';
import { SCENES } from './scenes';
import { computeR, H, TEST_MODE, W } from './core/view';
import { ALL_EVENTS } from './data/events';
import { QUESTS } from './data/quests';
import { notebookEntries } from './systems/notebook';
import { installDebug } from './ui/debug';
import { G } from './core/game';
import { GLYPHS } from './generated/glyphs';

async function waitForFonts(): Promise<void> {
  // The game must still render if fonts fail to load: wait at most 2.5 s.
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts) return;
  const loads = ['16px "Gowun Dodum"', '16px "Jua"', '16px "Nanum Pen Script"'].map((f) =>
    fonts.load(f, GLYPHS).catch(() => []),
  );
  await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]);
}

async function start() {
  await waitForFonts();
  document.getElementById('boot-msg')?.remove();
  const r = computeR();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W * r,
    height: H * r,
    backgroundColor: '#6CC4D6',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
    input: { activePointers: 2 },
    // ?test=1: headless play-testing runs at low fps; don't clamp deltas so game time keeps up
    fps: new URLSearchParams(window.location.search).get('test') === '1' ? { smoothStep: false, min: 1 } : undefined,
    scene: SCENES,
  });
  (window as unknown as { __game: Phaser.Game; __G: typeof G }).__game = game;
  (window as unknown as { __G: typeof G }).__G = G;
  installDebug(game);
  if (TEST_MODE) {
    const w = window as unknown as { __nb: () => unknown; __content: unknown; __missing: string[] };
    w.__nb = () => notebookEntries(G.state);
    // content smoke tests: every event and quest step, and any image key that has no texture
    w.__content = { events: ALL_EVENTS.map((e) => ({ id: e.id, trigger: e.trigger })), quests: QUESTS.map((q) => ({ id: q.id, steps: q.steps.map((st) => st.scenes.length) })) };
    w.__missing = [];
    const orig = Phaser.GameObjects.GameObjectFactory.prototype.image;
    Phaser.GameObjects.GameObjectFactory.prototype.image = function (this: Phaser.GameObjects.GameObjectFactory, x: number, y: number, key: string | Phaser.Textures.Texture, frame?: string | number) {
      if (typeof key === 'string' && !this.scene.textures.exists(key) && !w.__missing.includes(key)) w.__missing.push(key);
      return orig.call(this, x, y, key, frame);
    };
  }
  // Late font slices: redraw every Text object once more glyphs arrive.
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  fonts?.addEventListener('loadingdone', () => {
    for (const sc of game.scene.getScenes(true)) {
      sc.children.each((o) => {
        if (o instanceof Phaser.GameObjects.Text) o.updateText();
        if (o instanceof Phaser.GameObjects.Container) {
          o.each((c: Phaser.GameObjects.GameObject) => {
            if (c instanceof Phaser.GameObjects.Text) c.updateText();
          });
        }
      });
    }
  });
}

void start();
