import Phaser from 'phaser';
import { sfx } from './audio';
import { installStandby, recordActivity } from './standby';

/**
 * Um único barramento de "apertou o botão".
 * Aceita teclado, gamepad (botoeira arcade USB) e toque/clique na tela.
 */
export const bus = new Phaser.Events.EventEmitter();

let lockUntil = 0;

/** Ignora apertos por N ms (evita o clique que iniciou a partida virar uma puxada). */
export function lockInput(ms = 400): void {
  lockUntil = performance.now() + ms;
}

export function emitPress(source: string): void {
  if (recordActivity()) {
    lockInput(400);
    return;
  }
  if (performance.now() < lockUntil) return;
  bus.emit('press', source);
}

export function onPress(cb: () => void, ctx?: unknown): void {
  bus.on('press', cb, ctx);
}

export function offPress(cb: () => void, ctx?: unknown): void {
  bus.off('press', cb, ctx);
}

function toggleFullscreen(game: Phaser.Game): void {
  if (game.scale.isFullscreen) game.scale.stopFullscreen();
  else game.scale.startFullscreen();
}

export function installInput(game: Phaser.Game): void {
  installStandby(game, () => lockInput(400));

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'f' || e.key === 'F') {
      recordActivity();
      toggleFullscreen(game);
      return;
    }
    sfx.unlock();
    if (recordActivity()) {
      lockInput(400);
      e.stopImmediatePropagation();
      return;
    }
    emitPress('key');
  });

  game.canvas.addEventListener('pointerdown', () => {
    sfx.unlock();
    emitPress('touch');
  });

  game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

