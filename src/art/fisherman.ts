import Phaser from 'phaser';

export type Pose = 'idle' | 'windup' | 'throw' | 'pull' | 'cheer' | 'tired';

export interface FishermanLook {
  robe: number;
  robeDark: number;
  sash: number;
  skin: number;
  hair: number;
  scarf: number;
}

export const LOOKS: FishermanLook[] = [
  // Pedro — mais velho, barba branca, azul
  { robe: 0x3f6fa8, robeDark: 0x2c4f7c, sash: 0xd8c08a, skin: 0xd9a06b, hair: 0xf1e8d6, scarf: 0xe7dcc0 },
  // Tiago — barba escura, terracota
  { robe: 0x9a5b3f, robeDark: 0x6f3f2b, sash: 0xe0cfae, skin: 0xc98a5a, hair: 0x3a2a1e, scarf: 0xd9c9a3 },
  // João — mais jovem, verde
  { robe: 0x4f7d5a, robeDark: 0x375a40, sash: 0xe6d9b8, skin: 0xe0b083, hair: 0x5a3f2a, scarf: 0xf0e6cf },
];

export class Fisherman {
  readonly container: Phaser.GameObjects.Container;
  private g: Phaser.GameObjects.Graphics;
  private look: FishermanLook;
  private pose: Pose = 'idle';
  private t = 0;
  private kick = 0;
  private baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, look: FishermanLook) {
    this.look = look;
    this.baseY = y;
    this.container = scene.add.container(x, y);
    this.g = scene.add.graphics();
    this.container.add(this.g);
    this.draw();
  }

  setPose(p: Pose): void {
    if (this.pose === p) return;
    this.pose = p;
    this.kick = 0;
    this.draw();
  }

  getPose(): Pose {
    return this.pose;
  }

  pull(): void {
    this.kick = 1;
  }

  update(dt: number): void {
    this.t += dt;
    this.kick *= Math.pow(0.015, dt);
    this.draw();
  }

  private arm(g: Phaser.GameObjects.Graphics, sx: number, sy: number, deg: number, len: number, color: number): void {
    g.save();
    g.translateCanvas(sx, sy);
    g.rotateCanvas(Phaser.Math.DegToRad(deg));
    g.fillStyle(color, 1);
    g.fillRoundedRect(-7.5, -4, 15, len, 7.5);
    g.fillStyle(this.look.skin, 1);
    g.fillCircle(0, len, 8);
    g.restore();
  }

  private draw(): void {
    const g = this.g;
    const L = this.look;
    g.clear();

    const t = this.t;
    const pose = this.pose;

    // animação base
    let bob = Math.sin(t * 1.9) * 2;
    let lean = 0;
    let armL = 16;
    let armR = -16;
    let headY = 0;
    let jump = 0;

    switch (pose) {
      case 'idle':
        armL = 16 + Math.sin(t * 1.7) * 4;
        armR = -16 - Math.sin(t * 1.7 + 1) * 4;
        break;
      case 'windup':
        lean = -0.06;
        armR = -152 + Math.sin(t * 18) * 3;
        armL = 30;
        break;
      case 'throw':
        lean = 0.1;
        armR = -52;
        armL = 62;
        break;
      case 'pull': {
        const up = 104 + this.kick * 46;
        armL = up;
        armR = -up;
        lean = -0.03 * this.kick;
        bob = Math.sin(t * 9) * 1.5 * this.kick;
        break;
      }
      case 'cheer':
        jump = Math.abs(Math.sin(t * 6.5)) * 16;
        armL = 158 + Math.sin(t * 8) * 8;
        armR = -158 - Math.sin(t * 8 + 1) * 8;
        headY = -2;
        break;
      case 'tired':
        lean = 0.09;
        bob = 6;
        armL = 78;
        armR = -78;
        headY = 9;
        break;
    }

    this.container.y = this.baseY - jump;
    this.container.rotation = lean;

    const cx = 0;

    // sombra
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, 3, 74, 15);

    // pernas
    g.fillStyle(0x2a2118, 1);
    g.fillRoundedRect(cx - 20, -30, 16, 30, 6);
    g.fillRoundedRect(cx + 4, -30, 16, 30, 6);

    // túnica
    g.fillStyle(L.robeDark, 1);
    g.fillPoints(
      [
        { x: cx - 34, y: -116 + bob },
        { x: cx + 34, y: -116 + bob },
        { x: cx + 48, y: -22 + bob },
        { x: cx + 34, y: -16 + bob },
        { x: cx - 34, y: -16 + bob },
        { x: cx - 48, y: -22 + bob },
      ],
      true,
    );
    g.fillStyle(L.robe, 1);
    g.fillPoints(
      [
        { x: cx - 32, y: -114 + bob },
        { x: cx + 32, y: -114 + bob },
        { x: cx + 44, y: -26 + bob },
        { x: cx - 44, y: -26 + bob },
      ],
      true,
    );

    // caimento / dobras
    g.lineStyle(2, L.robeDark, 0.55);
    g.lineBetween(cx - 14, -100 + bob, cx - 20, -30 + bob);
    g.lineBetween(cx + 14, -100 + bob, cx + 20, -30 + bob);

    // faixa
    g.fillStyle(L.sash, 1);
    g.fillRoundedRect(cx - 36, -76 + bob, 72, 11, 5);

    // braços (atrás do corpo seria ideal, mas na frente lê melhor)
    this.arm(g, cx - 30, -106 + bob, armL, 50, L.robe);
    this.arm(g, cx + 30, -106 + bob, armR, 50, L.robe);

    // pescoço
    g.fillStyle(L.skin, 1);
    g.fillRoundedRect(cx - 7, -130 + bob, 14, 16, 6);

    // cabeça
    const hy = -148 + bob + headY;
    g.fillStyle(L.skin, 1);
    g.fillCircle(cx, hy, 24);

    // barba
    g.fillStyle(L.hair, 1);
    g.fillEllipse(cx, hy + 14, 34, 26);
    g.fillStyle(L.skin, 1);
    g.fillEllipse(cx, hy + 2, 26, 16);

    // olhos
    if (pose === 'tired') {
      g.lineStyle(2.5, 0x2a1d14, 1);
      g.lineBetween(cx - 12, hy - 2, cx - 4, hy - 2);
      g.lineBetween(cx + 4, hy - 2, cx + 12, hy - 2);
    } else {
      g.fillStyle(0x241a12, 1);
      g.fillCircle(cx - 8, hy - 3, 3);
      g.fillCircle(cx + 8, hy - 3, 3);
    }

    // turbante / pano na cabeça
    g.fillStyle(L.scarf, 1);
    g.fillEllipse(cx, hy - 14, 54, 30);
    g.fillStyle(L.robeDark, 0.9);
    g.fillRoundedRect(cx - 27, hy - 18, 54, 9, 4);

    // gotas de suor quando exausto
    if (pose === 'tired') {
      g.fillStyle(0xbfe8f5, 0.9);
      g.fillCircle(cx - 30, hy - 6, 4);
      g.fillCircle(cx + 30, hy - 2, 3.4);
      g.fillCircle(cx + 24, hy + 8, 2.6);
    }
  }
}
