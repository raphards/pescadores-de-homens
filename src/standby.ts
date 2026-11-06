import Phaser from 'phaser';
import { sfx } from './audio';
import { STANDBY_IDLE_MS } from './config';

const VIDEO_SRC = '/VID-20261103-WA0032.mp4';

let active = false;
let lastActivity = performance.now();
let overlayEl: HTMLDivElement | null = null;
let videoEl: HTMLVideoElement | null = null;
let onWakeCallback: (() => void) | null = null;

export function isStandbyActive(): boolean {
  return active;
}

/**
 * Registra interação do usuário.
 * Retorna `true` se o sistema estava em standby e acabou de sair dele.
 */
export function recordActivity(): boolean {
  lastActivity = performance.now();
  if (active) {
    exitStandby();
    return true;
  }
  return false;
}

function enterStandby(game: Phaser.Game): void {
  if (active || !overlayEl || !videoEl) return;
  active = true;

  if (!game.scene.isActive('Attract')) {
    game.scene.stop('Name');
    game.scene.stop('Game');
    game.scene.start('Attract');
  }

  overlayEl.style.display = 'flex';
  videoEl.currentTime = 0;
  videoEl.loop = true;
  videoEl.muted = false;

  const playPromise = videoEl.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      if (!videoEl || !active) return;
      videoEl.muted = true;
      videoEl.play().catch(() => {
        // Ignora erro caso o navegador ainda bloqueie reprodução
      });
    });
  }
}

export function exitStandby(): void {
  if (!active) return;
  active = false;
  lastActivity = performance.now();

  if (videoEl) {
    videoEl.pause();
  }
  if (overlayEl) {
    overlayEl.style.display = 'none';
  }
  if (onWakeCallback) {
    onWakeCallback();
  }
}

export function installStandby(game: Phaser.Game, onWake?: () => void): void {
  onWakeCallback = onWake ?? null;
  lastActivity = performance.now();

  const overlay = document.createElement('div');
  overlay.id = 'standby-video-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#04060d',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9999',
    cursor: 'pointer',
    touchAction: 'none',
  } satisfies Partial<CSSStyleDeclaration>);

  const video = document.createElement('video');
  video.src = VIDEO_SRC;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  Object.assign(video.style, {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    pointerEvents: 'none',
  } satisfies Partial<CSSStyleDeclaration>);

  overlay.appendChild(video);
  document.body.appendChild(overlay);

  overlayEl = overlay;
  videoEl = video;

  overlay.addEventListener('contextmenu', (e) => e.preventDefault());

  const onPointerOrTouch = (e: Event): void => {
    sfx.unlock();
    if (recordActivity()) {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
    }
  };

  window.addEventListener('pointerdown', onPointerOrTouch, { capture: true });
  window.addEventListener('touchstart', onPointerOrTouch, { capture: true, passive: false });

  window.setInterval(() => {
    if (!active && performance.now() - lastActivity >= STANDBY_IDLE_MS) {
      enterStandby(game);
    }
  }, 200);
}
