import Phaser from 'phaser';
import { NAME_IDLE_MS, NAME_MAX, W } from '../config';
import { Ocean } from '../art/ocean';
import { sfx } from '../audio';
import { lockInput } from '../input';
import { findEntry, fmt } from '../rank';
import { C, DEPTH, FONT_TITLE, FONT_UI } from '../ui';

interface KeyDef {
  label: string;
  w?: number;
  action: () => void;
  accent?: boolean;
}

export default class NameScene extends Phaser.Scene {
  private ocean!: Ocean;
  private name = '';
  private nameText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private boxG!: Phaser.GameObjects.Graphics;
  private lastAction = 0;
  private leaving = false;
  private blink = 0;

  constructor() {
    super('Name');
  }

  create(): void {
    this.name = '';
    this.leaving = false;
    this.lastAction = this.time.now;
    lockInput(250);
    this.cameras.main.fadeIn(300, 4, 8, 16);

    this.ocean = new Ocean(this);
    this.add.rectangle(W / 2, 960, W, 1920, 0x02060c, 0.5).setDepth(DEPTH.effects);

    this.buildPanel();
    this.refresh();

    window.addEventListener('keydown', this.onKey);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', this.onKey);
    });
  }

  update(time: number, delta: number): void {
    this.ocean.update(Math.min(delta, 60) / 1000);
    this.blink += delta;
    if (this.boxG) {
      const a = 0.4 + Math.abs(Math.sin(this.blink / 620)) * 0.5;
      this.boxG.setAlpha(a);
    }
    if (!this.leaving && time - this.lastAction > NAME_IDLE_MS) {
      this.back();
    }
  }

  private touch(): void {
    this.lastAction = this.time.now;
  }

  private buildPanel(): void {
    const px = 60;
    const py = 500;
    const pw = W - 120;
    const ph = 920;

    const g = this.add.graphics().setDepth(DEPTH.hud);
    g.fillStyle(0x04121f, 0.93);
    g.fillRoundedRect(px, py, pw, ph, 30);
    g.lineStyle(3, 0xf4c96b, 0.5);
    g.strokeRoundedRect(px, py, pw, ph, 30);

    this.add
      .text(W / 2, py + 46, 'QUEM VAI PESCAR?', {
        fontFamily: FONT_TITLE,
        fontSize: '52px',
        fontStyle: 'bold',
        color: C.gold,
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.hud);

    // caixa do nome
    const bx = 130;
    const by = py + 136;
    const bw = W - 260;
    const bh = 118;
    this.boxG = this.add.graphics().setDepth(DEPTH.hud);
    this.boxG.fillStyle(0x0a2234, 0.95);
    this.boxG.fillRoundedRect(bx, by, bw, bh, 18);
    this.boxG.lineStyle(3, 0xf4c96b, 1);
    this.boxG.strokeRoundedRect(bx, by, bw, bh, 18);

    this.nameText = this.add
      .text(W / 2, by + bh / 2, '', {
        fontFamily: FONT_UI,
        fontSize: '54px',
        fontStyle: 'bold',
        color: C.cream,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.hud);

    this.hintText = this.add
      .text(W / 2, by + bh + 22, '', {
        fontFamily: FONT_UI,
        fontSize: '24px',
        color: C.muted,
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.hud);

    // linhas de teclas
    const rowY = py + 366;
    const mk = (ch: string): KeyDef => ({ label: ch, action: () => this.append(ch) });

    this.layoutRow(rowY, 'ABCDEFGHIJ'.split('').map(mk));
    this.layoutRow(rowY + 104, 'KLMNOPQRST'.split('').map(mk));
    this.layoutRow(rowY + 208, [
      ...'UVWXYZÇ'.split('').map(mk),
      { label: 'ESPAÇO', w: 176, action: () => this.append(' ') },
      { label: 'APAGAR', w: 122, action: () => this.backspace() },
    ]);

    this.addKey(W / 2 - 230, rowY + 330, 460, 92, 'PESCAR!', () => this.confirm(), true);

    this.add
      .text(W / 2, py + ph - 44, 'Toque nas letras para digitar o seu nome', {
        fontFamily: FONT_UI,
        fontSize: '20px',
        color: C.muted,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.hud)
      .setAlpha(0.65);
  }

  private layoutRow(y: number, keys: KeyDef[]): void {
    const gap = 8;
    const total = keys.reduce((s, k) => s + (k.w ?? 88), 0) + gap * (keys.length - 1);
    let x = (W - total) / 2;
    for (const k of keys) {
      const w = k.w ?? 88;
      this.addKey(x, y, w, 88, k.label, k.action, k.accent);
      x += w + gap;
    }
  }

  private addKey(x: number, y: number, w: number, h: number, label: string, action: () => void, accent = false): void {
    const g = this.add.graphics().setDepth(DEPTH.hud);
    g.fillStyle(accent ? 0x1e4c69 : 0x0e2739, 0.98);
    g.fillRoundedRect(x, y, w, h, 14);
    g.lineStyle(2, accent ? 0xf4c96b : 0x3f7ba3, 0.9);
    g.strokeRoundedRect(x, y, w, h, 14);

    const size = label.length > 2 ? 20 : label.length === 2 ? 24 : 40;
    this.add
      .text(x + w / 2, y + h / 2, label, {
        fontFamily: FONT_UI,
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color: accent ? C.gold : C.cream,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.hud);

    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.setDepth(DEPTH.hud);
    zone.on('pointerdown', () => {
      this.touch();
      sfx.click();
      g.setAlpha(0.55);
      this.time.delayedCall(80, () => g.setAlpha(1));
      action();
    });
  }

  private append(ch: string): void {
    if (this.name.length >= NAME_MAX) {
      this.shake();
      return;
    }
    if (ch === ' ' && (this.name.length === 0 || this.name.endsWith(' '))) return;
    this.name += ch;
    this.refresh();
  }

  private backspace(): void {
    this.name = this.name.slice(0, -1);
    this.refresh();
  }

  private refresh(): void {
    const display = this.name.trim();
    this.nameText.setText(display.length ? display : 'SEU NOME');
    this.nameText.setColor(display.length ? C.cream : '#4c6a80');

    const existing = display.length >= 2 ? findEntry(display) : undefined;
    if (existing) {
      this.hintText.setText(`Bem-vindo de volta, ${existing.name}! Você já tem ${fmt(existing.score)} pontos.`);
      this.hintText.setColor(C.gold);
    } else if (display.length >= 2) {
      this.hintText.setText('Novo pescador! Começa do zero.');
      this.hintText.setColor(C.green);
    } else {
      this.hintText.setText(`Digite seu nome (até ${NAME_MAX} letras)`);
      this.hintText.setColor(C.muted);
    }
  }

  private shake(): void {
    this.tweens.add({
      targets: this.nameText,
      x: { from: W / 2 - 14, to: W / 2 },
      duration: 70,
      repeat: 3,
      yoyo: true,
      onComplete: () => this.nameText.setX(W / 2),
    });
  }

  private confirm = (): void => {
    if (this.leaving) return;
    const n = this.name.trim();
    if (n.length < 2) {
      this.shake();
      sfx.fail();
      return;
    }
    this.leaving = true;
    this.lastAction = this.time.now;
    sfx.start();
    this.cameras.main.fadeOut(260, 4, 8, 16);
    this.time.delayedCall(270, () => this.scene.start('Game', { name: n }));
  };

  private back = (): void => {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(220, 4, 8, 16);
    this.time.delayedCall(230, () => this.scene.start('Attract'));
  };

  private onKey = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    this.touch();
    if (e.key === 'Enter') {
      e.preventDefault();
      this.confirm();
      return;
    }
    if (e.key === 'Escape') {
      this.back();
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      this.backspace();
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      this.append(' ');
      return;
    }
    if (/^[a-zA-ZçÇ]$/.test(e.key)) {
      this.append(e.key.toUpperCase());
    }
  };
}
