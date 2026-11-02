import Phaser from 'phaser';
import { BANDS, BandDef, SPECIES, SpeciesDef, SpeciesKey, W } from '../config';
import { DEPTH } from '../ui';

/** Gera as texturas dos peixes (virados para a direita). */
export function makeFishTextures(scene: Phaser.Scene): void {
  for (const sp of Object.values(SPECIES)) {
    if (scene.textures.exists(sp.texture)) continue;
    const g = scene.add.graphics();
    const { w, h } = sp;

    // cauda
    g.fillStyle(sp.fin, 1);
    g.fillTriangle(w * 0.24, h * 0.5, w * 0.02, h * 0.18, w * 0.02, h * 0.82);

    // corpo
    g.fillStyle(sp.body, 1);
    g.fillEllipse(w * 0.53, h * 0.5, w * 0.64, h * 0.66);

    // barriga clara
    g.fillStyle(sp.belly, 0.55);
    g.fillEllipse(w * 0.54, h * 0.62, w * 0.5, h * 0.32);

    // dorso
    g.fillStyle(sp.fin, 0.85);
    g.fillTriangle(w * 0.42, h * 0.24, w * 0.68, h * 0.26, w * 0.54, h * 0.02);
    g.fillTriangle(w * 0.5, h * 0.7, w * 0.66, h * 0.72, w * 0.56, h * 0.94);

    // detalhes por espécie
    if (sp.key === 'pintado') {
      g.fillStyle(sp.fin, 0.35);
      for (let i = 0; i < 5; i++) {
        const x = w * (0.3 + i * 0.11);
        g.fillEllipse(x, h * 0.5, w * 0.05, h * 0.5);
      }
    }
    if (sp.key === 'tainha') {
      g.fillStyle(sp.fin, 0.4);
      g.fillEllipse(w * 0.54, h * 0.32, w * 0.52, h * 0.14);
    }
    if (sp.key === 'dourado') {
      g.fillStyle(0xfff3c4, 0.5);
      g.fillEllipse(w * 0.56, h * 0.42, w * 0.34, h * 0.16);
    }

    // olho
    g.fillStyle(0xffffff, 1);
    g.fillCircle(w * 0.79, h * 0.42, Math.max(2.5, h * 0.085));
    g.fillStyle(0x0b1116, 1);
    g.fillCircle(w * 0.795, h * 0.42, Math.max(1.4, h * 0.042));

    // boca
    g.lineStyle(Math.max(1.5, h * 0.03), 0x0b1116, 0.5);
    g.lineBetween(w * 0.855, h * 0.52, w * 0.885, h * 0.56);

    g.generateTexture(sp.texture, w, h);
    g.destroy();
  }
}

/** Peixe que nada de um lado para o outro dentro de uma faixa. */
export class FishSwimmer {
  readonly img: Phaser.GameObjects.Image;
  readonly band: BandDef;
  readonly species: SpeciesDef;
  alive = true;
  private baseY: number;
  private amp: number;
  private phase: number;
  private speed: number;
  private dir: number;

  constructor(scene: Phaser.Scene, species: SpeciesDef, band: BandDef, scale = 1) {
    this.band = band;
    this.species = species;
    this.baseY = Phaser.Math.Between(band.y0 + 55, Math.min(band.y1 - 55, 1790));
    this.amp = Phaser.Math.Between(6, 18);
    this.phase = Math.random() * Math.PI * 2;
    this.speed = Phaser.Math.Between(45, 120) * (1 + band.id * 0.04);
    this.dir = Math.random() < 0.5 ? 1 : -1;

    const x = Phaser.Math.Between(-100, W + 100);
    this.img = scene.add
      .image(x, this.baseY, species.texture)
      .setDepth(DEPTH.fish)
      .setScale(scale * Phaser.Math.FloatBetween(0.85, 1.15));
    this.img.setFlipX(this.dir < 0);
    this.img.setAlpha(0.92);
  }

  update(dt: number, t: number): void {
    if (!this.alive || !this.img.active) return;
    const img = this.img;
    img.x += this.dir * this.speed * dt;
    const half = img.displayWidth * 0.5;
    if (this.dir > 0 && img.x - half > W + 80) img.x = -half - 80;
    if (this.dir < 0 && img.x + half < -80) img.x = W + half + 80;
    img.y = this.baseY + Math.sin(t * 1.7 + this.phase) * this.amp;
    img.rotation = Math.sin(t * 1.2 + this.phase) * 0.05 * this.dir;
  }

  destroy(): void {
    this.alive = false;
    this.img.destroy();
  }
}

export function spawnBandFish(scene: Phaser.Scene, bandId: number, scale = 1): FishSwimmer {
  const band = BANDS.find((b) => b.id === bandId) ?? BANDS[0];
  return new FishSwimmer(scene, SPECIES[band.species as SpeciesKey], band, scale);
}
