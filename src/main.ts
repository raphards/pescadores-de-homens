import Phaser from 'phaser';
import { renderAdmin } from './admin';
import { H, W } from './config';
import { installInput } from './input';
import AttractScene from './scenes/AttractScene';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import InputScene from './scenes/InputScene';
import NameScene from './scenes/NameScene';

const root = document.getElementById('app');
if (!root) throw new Error('elemento #app não encontrado');

/** Rota do painel de ajustes: aceita tanto /admin quanto #/admin */
function currentRoute(): string {
  const hash = location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash === 'admin') return 'admin';
  const path = location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (path === 'admin') return 'admin';
  return '';
}

function startGame(): void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'app',
    width: W,
    height: H,
    backgroundColor: '#04060d',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, InputScene, AttractScene, NameScene, GameScene],
    render: { antialias: true, roundPixels: false },
    audio: { noAudio: true },
  });

  installInput(game);
  (window as unknown as { game: Phaser.Game }).game = game;
}

if (currentRoute() === 'admin') {
  renderAdmin(root);
} else {
  startGame();
}

window.addEventListener('hashchange', () => location.reload());
window.addEventListener('popstate', () => location.reload());
