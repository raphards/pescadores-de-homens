import Phaser from 'phaser';
import { BOAT_Y, H, SURFACE_Y, W } from '../config';
import { DEPTH } from '../ui';
import { quad } from './draw';
import { Fisherman, LOOKS } from './fisherman';

/** Fundo fixo: céu, sol, ilhas, mar, raios e fundo do mar. */
function drawBackdrop(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(DEPTH.sea);

  // céu
  g.fillGradientStyle(0x0a1030, 0x0a1030, 0xe98a52, 0xf2a962, 1);
  g.fillRect(0, 0, W, SURFACE_Y + 4);

  // sol
  g.fillStyle(0xffc27a, 0.1);
  g.fillCircle(742, 236, 210);
  g.fillStyle(0xffc27a, 0.16);
  g.fillCircle(742, 236, 150);
  g.fillStyle(0xffd9a0, 0.95);
  g.fillCircle(742, 236, 92);

  // nuvens
  const clouds: Array<[number, number, number]> = [
    [190, 120, 1.1],
    [420, 78, 0.8],
    [860, 132, 0.9],
    [300, 210, 0.6],
  ];
  g.fillStyle(0xffe6c8, 0.1);
  for (const [cx, cy, s] of clouds) {
    g.fillEllipse(cx, cy, 220 * s, 46 * s);
    g.fillEllipse(cx + 60 * s, cy - 14 * s, 130 * s, 38 * s);
  }

  // ilhas no horizonte
  g.fillStyle(0x231a34, 0.85);
  g.fillPoints(
    [
      { x: -20, y: SURFACE_Y + 2 },
      { x: 60, y: SURFACE_Y - 58 },
      { x: 150, y: SURFACE_Y - 18 },
      { x: 240, y: SURFACE_Y - 44 },
      { x: 330, y: SURFACE_Y + 2 },
    ],
    true,
  );
  g.fillPoints(
    [
      { x: 760, y: SURFACE_Y + 2 },
      { x: 850, y: SURFACE_Y - 30 },
      { x: 940, y: SURFACE_Y - 62 },
      { x: 1040, y: SURFACE_Y - 12 },
      { x: 1100, y: SURFACE_Y + 2 },
    ],
    true,
  );

  // mar
  g.fillGradientStyle(0x2f86ad, 0x2f86ad, 0x04121f, 0x04121f, 1);
  g.fillRect(0, SURFACE_Y, W, H - SURFACE_Y);

  // brilho do sol na água (coluna suave)
  for (let i = 0; i < 10; i++) {
    const y = SURFACE_Y + 34 + i * 58;
    g.fillStyle(0xffd9a0, 0.055 * (1 - i / 10));
    g.fillEllipse(742 + Math.sin(i * 0.9) * 22, y, 300 - i * 10, 76);
  }

  // raios de luz
  g.fillStyle(0xbfe8f5, 0.022);
  g.fillPoints(
    [
      { x: 470, y: SURFACE_Y },
      { x: 556, y: SURFACE_Y },
      { x: 760, y: 1480 },
      { x: 548, y: 1480 },
    ],
    true,
  );
  g.fillStyle(0xbfe8f5, 0.016);
  g.fillPoints(
    [
      { x: 700, y: SURFACE_Y },
      { x: 760, y: SURFACE_Y },
      { x: 980, y: 1330 },
      { x: 870, y: 1330 },
    ],
    true,
  );

  // fundo do mar
  const floor = quad(0, 1882, 540, 1836, W, 1886, 18);
  const floorPoly = [{ x: 0, y: H }, ...floor, { x: W, y: H }];
  g.fillStyle(0x0a2434, 1);
  g.fillPoints(floorPoly, true);
  g.fillStyle(0x123449, 1);
  g.fillPoints(quad(0, 1888, 540, 1852, W, 1892, 18).map((p) => ({ x: p.x, y: p.y })), false);

  // pedras
  g.fillStyle(0x0c2c3f, 1);
  g.fillEllipse(120, 1888, 160, 60);
  g.fillEllipse(940, 1892, 200, 70);
  g.fillEllipse(540, 1900, 240, 50);

  // algas
  const weed = (x: number, h: number, sway: number) => {
    g.lineStyle(9, 0x1b5a4a, 0.9);
    g.beginPath();
    g.moveTo(x, 1890);
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      g.lineTo(x + Math.sin(t * 3 + sway) * 26, 1890 - h * t);
    }
    g.strokePath();
  };
  weed(64, 190, 0.2);
  weed(96, 130, 1.4);
  weed(1000, 210, 0.8);
  weed(1032, 150, 2.1);
}

/** Ondas animadas na linha d'água. */
export class Waves {
  private g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(DEPTH.waves);
  }

  update(t: number): void {
    const g = this.g;
    g.clear();
    for (let k = 0; k < 3; k++) {
      g.lineStyle(3.2 - k * 0.7, 0xcdeefb, 0.3 - k * 0.07);
      g.beginPath();
      for (let x = -20; x <= W + 20; x += 20) {
        const y = SURFACE_Y + 4 + k * 16 + Math.sin(x * 0.011 + t * (1.5 + k * 0.2) + k * 1.7) * (5 - k);
        if (x === -20) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }
  }
}

export interface OceanOpts {
  boatY?: number;
  showBoat?: boolean;
}

export class Ocean {
  readonly scene: Phaser.Scene;
  readonly boat: Phaser.GameObjects.Container;
  readonly fishermen: Fisherman[] = [];
  readonly waves: Waves;
  private boatY: number;
  private t = 0;

  constructor(scene: Phaser.Scene, opts: OceanOpts = {}) {
    this.scene = scene;
    this.boatY = opts.boatY ?? BOAT_Y;
    drawBackdrop(scene);
    this.waves = new Waves(scene);

    this.boat = scene.add.container(540, this.boatY).setDepth(DEPTH.boat);
    if (opts.showBoat !== false) this.buildBoat();

    // bolhas subindo
    scene.add
      .particles(0, 0, 'bubble', {
        x: { min: 0, max: W },
        y: H + 30,
        lifespan: 14000,
        speedY: { min: -34, max: -78 },
        speedX: { min: -12, max: 12 },
        scale: { start: 0.35, end: 0.95 },
        alpha: { start: 0.22, end: 0 },
        frequency: 380,
        quantity: 1,
      })
      .setDepth(DEPTH.bands);
  }

  private buildBoat(): void {
    const scene = this.scene;
    const g = scene.add.graphics();

    // reflexo
    g.fillStyle(0x04121f, 0.4);
    g.fillEllipse(0, 92, 600, 80);

    // casco
    const bottom = quad(-266, 4, 0, 132, 266, 4, 18);
    g.fillStyle(0x2e1c12, 1);
    g.fillPoints([{ x: -266, y: -18 }, ...bottom, { x: 266, y: -18 }], true);

    const bottom2 = quad(-238, 2, 0, 112, 238, 2, 18);
    g.fillStyle(0x40281a, 1);
    g.fillPoints([{ x: -238, y: -18 }, ...bottom2, { x: 238, y: -18 }], true);

    // tábuas
    g.lineStyle(2.5, 0x1b100a, 0.55);
    for (let i = 0; i < 3; i++) {
      const pts = quad(-240, 16 + i * 26, 0, 96 + i * 24, 240, 16 + i * 26, 16);
      g.strokePoints(pts, false, false);
    }

    // borda / convés
    g.fillStyle(0x6b4526, 1);
    g.fillRoundedRect(-286, -30, 572, 26, 12);
    g.fillStyle(0x8a5c33, 1);
    g.fillRoundedRect(-286, -30, 572, 9, 5);
    g.fillStyle(0x241409, 1);
    g.fillRoundedRect(-262, -8, 524, 10, 5);

    // proa
    g.fillStyle(0x5a3620, 1);
    g.fillPoints(
      [
        { x: 262, y: -34 },
        { x: 300, y: -52 },
        { x: 292, y: -6 },
        { x: 258, y: 0 },
      ],
      true,
    );

    // lampião na proa
    g.fillStyle(0x2a1a10, 1);
    g.fillRect(276, -92, 5, 44);
    g.fillStyle(0xffcf7a, 0.25);
    g.fillCircle(278, -100, 30);
    g.fillStyle(0xffe3a8, 1);
    g.fillCircle(278, -100, 11);

    // cordas enroladas
    g.lineStyle(4, 0xc9b083, 0.8);
    g.strokeEllipse(-206, -34, 60, 22);
    g.strokeEllipse(-206, -38, 48, 16);

    this.boat.add(g);

    // ---- logo ONE'C pintado no casco ----
    const font = 'Impact, "Arial Black", "Trebuchet MS", sans-serif';
    const tag = scene.add.graphics();
    tag.lineStyle(8, 0x120a04, 0.55);
    tag.strokePoints(quad(-120, 76, 0, 100, 120, 76, 16), false, false);
    tag.lineStyle(4, 0xf4c96b, 0.85);
    tag.strokePoints(quad(-120, 71, 0, 95, 120, 71, 16), false, false);
    tag.fillStyle(0xf4c96b, 0.5);
    for (const [sx, sy] of [
      [-112, 20],
      [-98, 38],
      [104, 18],
      [116, 32],
      [-90, 60],
      [96, 54],
    ]) {
      tag.fillCircle(sx, sy, 2.8);
    }

    const logoShadow = scene.add
      .text(5, 40, "ONE'C", { fontFamily: font, fontSize: '68px', fontStyle: 'bold', color: '#120a04' })
      .setOrigin(0.5)
      .setRotation(-0.07)
      .setAlpha(0.6);

    const logo = scene.add
      .text(0, 32, "ONE'C", {
        fontFamily: font,
        fontSize: '68px',
        fontStyle: 'bold',
        color: '#f4c96b',
        stroke: '#1b1008',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setRotation(-0.07);
    logo.setShadow(0, 4, '#000000', 8, true, true);

    this.boat.add([tag, logoShadow, logo]);

    const spots: Array<[number, number]> = [
      [-152, -26],
      [0, -30],
      [152, -26],
    ];
    spots.forEach(([x, y], i) => {
      const f = new Fisherman(scene, x, y, LOOKS[i]);
      f.container.setScale(1.25);
      this.boat.add(f.container);
      this.fishermen.push(f);
    });
  }

  update(dt: number, _timeMs?: number): void {
    this.t += dt;
    const t = this.t;
    this.boat.y = this.boatY + Math.sin(t * 0.9) * 6;
    this.boat.rotation = Math.sin(t * 0.62) * 0.012;
    for (const f of this.fishermen) f.update(dt);
    this.waves.update(t);
  }

  get time(): number {
    return this.t;
  }
}
