import Phaser from 'phaser';

export interface Pt {
  x: number;
  y: number;
}

/** Amostra uma curva quadrática em pontos. */
export function quad(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, steps = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    out.push({
      x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
      y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
    });
  }
  return out;
}

export function ellipsePts(cx: number, cy: number, rx: number, ry: number, from = 0, to = Math.PI * 2, steps = 20): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    out.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return out;
}

export function arcTween(
  scene: Phaser.Scene,
  from: Pt,
  to: Pt,
  height: number,
  duration: number,
  onUpdate: (x: number, y: number, t: number) => void,
  onDone?: () => void,
  ease = 'Sine.easeInOut',
): void {
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration,
    ease,
    onUpdate: (tw) => {
      const t = tw.getValue() ?? 0;
      const x = Phaser.Math.Linear(from.x, to.x, t);
      const y = Phaser.Math.Linear(from.y, to.y, t) - Math.sin(Math.PI * t) * height;
      onUpdate(x, y, t);
    },
    onComplete: () => onDone?.(),
  });
}
