import Phaser from 'phaser';
import { sfx } from '../audio';
import { emitPress } from '../input';

/** Cena invisível: lê gamepads (botoeiras arcade USB) e converte em "apertou o botão". */
export default class InputScene extends Phaser.Scene {
  private prev: boolean[] = [];

  constructor() {
    super({ key: 'Input', active: false });
  }

  update(): void {
    const nav = navigator as Navigator & { getGamepads?: () => Array<Gamepad | null> };
    if (!nav.getGamepads) return;
    const pads = nav.getGamepads();
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      if (!pad) {
        this.prev[i] = false;
        continue;
      }
      let pressed = false;
      for (const b of pad.buttons) {
        if (b.pressed) {
          pressed = true;
          break;
        }
      }
      if (!pressed) {
        for (const a of pad.axes) {
          if (Math.abs(a) > 0.7) {
            pressed = true;
            break;
          }
        }
      }
      if (pressed && !this.prev[i]) {
        sfx.unlock();
        emitPress('pad');
      }
      this.prev[i] = pressed;
    }
  }
}
