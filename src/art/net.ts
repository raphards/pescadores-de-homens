import Phaser from 'phaser';
import { NET_BOTTOM_Y, SpeciesDef } from '../config';
import { DEPTH } from '../ui';
import { Pt, quad } from './draw';

const RIM_W = 150;
const RIM_H = 46;
const BELL_H = 132;

export function drawRope(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  sway = 0,
): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const sag = Math.min(90, len * 0.16);
  const pts = quad(x0, y0, (x0 + x1) / 2 + sway, (y0 + y1) / 2 + sag, x1, y1, 18);
  g.lineStyle(8, 0x120b06, 0.45);
  g.strokePoints(pts, false, false);
  g.lineStyle(4.5, 0xdcc79c, 0.95);
  g.strokePoints(pts, false, false);
}

interface StuckFish {
  img: Phaser.GameObjects.Image;
  phase: number;
}

/** Tarrafa desenhada em código, com peixes presos na malha. */
export class CastNet {
  readonly container: Phaser.GameObjects.Container;
  private g: Phaser.GameObjects.Graphics;
  private fishGroup: Phaser.GameObjects.Container;
  private stuck: StuckFish[] = [];
  x = 540;
  y = NET_BOTTOM_Y;
  sc = 0.55;

  constructor(scene: Phaser.Scene, x = 540, y = NET_BOTTOM_Y) {
    this.container = scene.add.container(x, y).setDepth(DEPTH.net);
    this.fishGroup = scene.add.container(0, 0);
    this.g = scene.add.graphics();
    this.container.add([this.fishGroup, this.g]);
    this.setPos(x, y);
    this.draw(1, 0);
  }

  setPos(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.container.setPosition(x, y);
  }

  setScale(s: number): void {
    this.sc = s;
    this.container.setScale(s);
  }

  draw(open: number, wob: number): void {
    const g = this.g;
    g.clear();

    if (open < 0.06) {
      // bolinha da tarrafa fechada (arremesso)
      g.fillStyle(0x8a6b3f, 1);
      g.fillCircle(0, 0, 26);
      g.fillStyle(0xdcc79c, 1);
      g.fillCircle(0, -4, 20);
      g.lineStyle(3, 0x8a6b3f, 0.9);
      g.strokeCircle(0, 0, 26);
      return;
    }

    const rimH = RIM_H * open;
    const knotY = -BELL_H * open;
    const w = RIM_W * (0.92 + 0.08 * open);

    const wobble = (i: number) => Math.sin(wob + i * 0.7) * 3;

    // ---- silhueta do sino ----
    const shape: Pt[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      shape.push({ x: -w * Math.sin((t * Math.PI) / 2) + wobble(i), y: knotY * (1 - t) });
    }
    for (let i = 1; i <= 14; i++) {
      const a = (Math.PI * i) / 14;
      shape.push({ x: -w * Math.cos(a) + wobble(i), y: rimH * Math.sin(a) });
    }
    for (let i = 10; i >= 0; i--) {
      const t = i / 10;
      shape.push({ x: w * Math.sin((t * Math.PI) / 2) + wobble(i), y: knotY * (1 - t) });
    }

    g.fillStyle(0xdcc79c, 0.13);
    g.fillPoints(shape, true);

    // ---- malha vertical ----
    g.lineStyle(1.6, 0xe6d3ab, 0.5);
    for (let i = 1; i < 7; i++) {
      const rx = -w + (2 * w * i) / 7;
      const ry = rimH * Math.sin((Math.PI * i) / 7);
      const mid = quad(0, knotY, rx * 0.55, knotY * 0.35, rx, ry, 10);
      g.strokePoints(mid, false, false);
    }

    // ---- malha horizontal ----
    for (let k = 1; k <= 3; k++) {
      const f = k / 4;
      const y = knotY * (1 - f);
      const rx = w * f;
      const ry = rimH * f * 0.55;
      const pts: Pt[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = (Math.PI * i) / 12;
        pts.push({ x: -rx * Math.cos(a), y: y + ry * Math.sin(a) });
      }
      g.lineStyle(1.4, 0xe6d3ab, 0.42);
      g.strokePoints(pts, false, false);
    }

    // ---- aro com chumbos ----
    g.lineStyle(7, 0x8a6b3f, 1);
    g.strokeEllipse(0, 0, w * 2, rimH * 2);
    g.fillStyle(0x5c452a, 1);
    for (let i = 0; i <= 12; i++) {
      const a = (Math.PI * i) / 12;
      g.fillCircle(-w * Math.cos(a), rimH * Math.sin(a), 4.2);
    }

    // ---- nó do topo ----
    g.fillStyle(0xdcc79c, 1);
    g.fillCircle(0, knotY, 8);
    g.fillStyle(0x8a6b3f, 1);
    g.fillCircle(0, knotY, 4);
  }

  addFish(sp: SpeciesDef): void {
    const scene = this.container.scene;
    const scale = Phaser.Math.Clamp(58 / sp.w, 0.3, 0.72);
    const img = scene.add
      .image(Phaser.Math.Between(-78, 78), Phaser.Math.Between(-96, 8), sp.texture)
      .setScale(scale)
      .setAlpha(0.97)
      .setFlipX(Math.random() < 0.5);
    this.fishGroup.add(img);
    this.stuck.push({ img, phase: Math.random() * Math.PI * 2 });
    // pequeno "pulo" ao entrar na rede
    scene.tweens.add({
      targets: img,
      scaleX: scale * 1.15,
      scaleY: scale * 1.15,
      duration: 120,
      yoyo: true,
    });
  }

  update(t: number): void {
    for (const f of this.stuck) {
      if (!f.img.active) continue;
      f.img.rotation = Math.sin(t * 6 + f.phase) * 0.22;
    }
  }

  get fishCount(): number {
    return this.stuck.length;
  }

  clearFish(): void {
    for (const f of this.stuck) f.img.destroy();
    this.stuck = [];
  }
}
