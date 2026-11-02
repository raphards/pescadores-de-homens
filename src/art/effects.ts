import Phaser from 'phaser';
import { DEPTH } from '../ui';
import { FONT_UI } from '../ui';

export function makeParticleTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('spark')) {
    const g = scene.add.graphics();
    for (let i = 6; i >= 1; i--) {
      g.fillStyle(0xffffff, 0.09 * i);
      g.fillCircle(16, 16, 4 + i * 2);
    }
    g.generateTexture('spark', 32, 32);
    g.destroy();
  }

  if (!scene.textures.exists('drop')) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(9, 9, 9);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(9, 9, 5.5);
    g.generateTexture('drop', 18, 18);
    g.destroy();
  }

  if (!scene.textures.exists('confetti')) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 14, 22);
    g.generateTexture('confetti', 14, 22);
    g.destroy();
  }

  if (!scene.textures.exists('bubble')) {
    const g = scene.add.graphics();
    g.lineStyle(3, 0xbfe8f5, 0.55);
    g.strokeCircle(16, 16, 12);
    g.fillStyle(0xbfe8f5, 0.12);
    g.fillCircle(16, 16, 12);
    g.generateTexture('bubble', 32, 32);
    g.destroy();
  }
}

export function splash(scene: Phaser.Scene, x: number, y: number, big = false): void {
  const p = scene.add
    .particles(x, y, 'drop', {
      speed: { min: 120, max: big ? 460 : 320 },
      angle: { min: 200, max: 340 },
      gravityY: 950,
      lifespan: { min: 420, max: 900 },
      scale: { start: big ? 1.5 : 1.05, end: 0.15 },
      alpha: { start: 0.95, end: 0 },
      tint: [0xbfe8f5, 0xffffff, 0x8ed3ea],
      emitting: false,
    })
    .setDepth(DEPTH.effects);
  p.explode(big ? 46 : 26);
  scene.time.delayedCall(1300, () => p.destroy());

  const ring = scene.add
    .ellipse(x, y, 40, 16, 0xcdeefb, 0.6)
    .setDepth(DEPTH.effects)
    .setStrokeStyle(4, 0xffffff, 0.8);
  scene.tweens.add({
    targets: ring,
    scaleX: big ? 6 : 4,
    scaleY: big ? 3 : 2,
    alpha: 0,
    duration: 650,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });
}

export function confetti(scene: Phaser.Scene, x: number, y: number, count = 70): void {
  const p = scene.add
    .particles(x, y, 'confetti', {
      speed: { min: 220, max: 720 },
      angle: { min: 200, max: 340 },
      gravityY: 780,
      lifespan: { min: 1400, max: 2600 },
      rotate: { min: 0, max: 360 },
      scale: { start: 1.1, end: 0.7 },
      alpha: { start: 1, end: 0.2 },
      tint: [0xf4c96b, 0xf7ecd6, 0x8ce0a4, 0x6fb6d8, 0xff8b7a],
      emitting: false,
    })
    .setDepth(DEPTH.effects);
  p.explode(count);
  scene.time.delayedCall(3200, () => p.destroy());
}

export function sparkle(scene: Phaser.Scene, x: number, y: number, count = 14, tint = 0xffe3a8): void {
  const p = scene.add
    .particles(x, y, 'spark', {
      speed: { min: 40, max: 220 },
      lifespan: { min: 300, max: 700 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint,
      emitting: false,
    })
    .setDepth(DEPTH.effects);
  p.explode(count);
  scene.time.delayedCall(1000, () => p.destroy());
}

export function floatText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color = '#ffffff',
  size = 44,
): void {
  const t = scene.add
    .text(x, y, text, {
      fontFamily: FONT_UI,
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      stroke: '#04121f',
      strokeThickness: 8,
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.text);
  scene.tweens.add({
    targets: t,
    y: y - 90,
    alpha: 0,
    scale: 1.15,
    duration: 950,
    ease: 'Cubic.easeOut',
    onComplete: () => t.destroy(),
  });
}

export function ringPulse(scene: Phaser.Scene, x: number, y: number, color = 0xffe3a8): void {
  const r = scene.add.circle(x, y, 26).setStrokeStyle(5, color, 0.9).setDepth(DEPTH.effects);
  scene.tweens.add({
    targets: r,
    scale: 3.4,
    alpha: 0,
    duration: 380,
    ease: 'Cubic.easeOut',
    onComplete: () => r.destroy(),
  });
}
