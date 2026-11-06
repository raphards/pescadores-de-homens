import Phaser from 'phaser';
import { BANDS, W } from '../config';
import { arcTween } from '../art/draw';
import { splash } from '../art/effects';
import { FishSwimmer, spawnBandFish } from '../art/fish';
import { Ocean } from '../art/ocean';
import { sfx } from '../audio';
import { lockInput, offPress, onPress } from '../input';
import { fmt, topRank } from '../rank';
import { isStandbyActive } from '../standby';
import { C, DEPTH, FONT_TITLE, FONT_UI } from '../ui';

export default class AttractScene extends Phaser.Scene {
  private ocean!: Ocean;
  private fish: FishSwimmer[] = [];
  private leaving = false;
  private cta!: Phaser.GameObjects.Container;

  constructor() {
    super('Attract');
  }

  create(): void {
    this.leaving = false;
    lockInput(250);
    this.cameras.main.fadeIn(350, 4, 8, 16);

    this.ocean = new Ocean(this);

    for (const band of BANDS) {
      for (let i = 0; i < 3; i++) {
        this.fish.push(spawnBandFish(this, band.id, 1.05));
      }
    }

    this.buildTitle();
    this.buildRank();
    this.buildCta();

    this.time.addEvent({ delay: 6800, loop: true, callback: () => this.ambientCast() });
    this.time.delayedCall(1400, () => this.ambientCast());

    onPress(this.start);
    this.events.once('shutdown', () => offPress(this.start));
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 60) / 1000;
    this.ocean.update(dt);
    const t = this.ocean.time;
    for (const f of this.fish) f.update(dt, t);
    if (this.cta) {
      this.cta.y = Math.sin(t * 2.1) * 5;
    }
  }

  private buildTitle(): void {
    const shade = this.add.graphics().setDepth(DEPTH.hud);
    shade.fillGradientStyle(0x02060c, 0x02060c, 0x02060c, 0x02060c, 0.5, 0.5, 0, 0);
    shade.fillRect(0, 0, W, 240);

    this.add
      .text(W / 2, 52, 'PESCADORES DE HOMENS', {
        fontFamily: FONT_TITLE,
        fontSize: '60px',
        fontStyle: 'bold',
        color: C.gold,
        stroke: '#1a0f05',
        strokeThickness: 10,
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.hud)
      .setShadow(0, 6, '#000000', 16, true, true);

    this.add
      .text(W / 2, 126, '«Não temas; desde agora serás pescador de homens.»  Lucas 5:10', {
        fontFamily: FONT_TITLE,
        fontSize: '23px',
        fontStyle: 'italic',
        color: '#f0d3ab',
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.hud)
      .setAlpha(0.9);
  }

  private buildRank(): void {
    const px = 70;
    const py = 986;
    const pw = 940;
    const ph = 744;

    const g = this.add.graphics().setDepth(DEPTH.hud);
    g.fillStyle(0x05131f, 0.88);
    g.fillRoundedRect(px, py, pw, ph, 26);
    g.lineStyle(3, 0xf4c96b, 0.45);
    g.strokeRoundedRect(px, py, pw, ph, 26);
    g.lineStyle(1.5, 0xf4c96b, 0.14);
    g.strokeRoundedRect(px + 9, py + 9, pw - 18, ph - 18, 20);

    this.add
      .text(W / 2, py + 34, 'RANK DOS PESCADORES', {
        fontFamily: FONT_TITLE,
        fontSize: '36px',
        fontStyle: 'bold',
        color: C.gold,
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.hud);

    this.add
      .text(px + 56, py + 104, 'POS', { fontFamily: FONT_UI, fontSize: '19px', color: C.muted })
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.hud)
      .setAlpha(0.75);
    this.add
      .text(px + 126, py + 104, 'PESCADOR', { fontFamily: FONT_UI, fontSize: '19px', color: C.muted })
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.hud)
      .setAlpha(0.75);
    this.add
      .text(px + pw - 56, py + 104, 'PONTOS', { fontFamily: FONT_UI, fontSize: '19px', color: C.muted })
      .setOrigin(1, 0.5)
      .setDepth(DEPTH.hud)
      .setAlpha(0.75);

    const rows = topRank(8);
    if (rows.length === 0) {
      this.add
        .text(W / 2, py + 360, 'Ninguém pescou ainda.\n\nSeja o primeiro a lançar a tarrafa!', {
          fontFamily: FONT_TITLE,
          fontSize: '34px',
          color: C.cream,
          align: 'center',
          lineSpacing: 12,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.hud)
        .setAlpha(0.85);
    } else {
      const startY = py + 158;
      rows.forEach((entry, i) => {
        const y = startY + i * 70;
        if (i % 2 === 0) {
          g.fillStyle(0x0c2637, 0.75);
          g.fillRoundedRect(px + 20, y - 30, pw - 40, 60, 12);
        }
        const medalColor = i === 0 ? C.gold : i === 1 ? '#cfd8e3' : i === 2 ? '#d09a63' : C.muted;
        this.add
          .text(px + 58, y, `${i + 1}º`, {
            fontFamily: FONT_UI,
            fontSize: i < 3 ? '30px' : '26px',
            fontStyle: 'bold',
            color: medalColor,
          })
          .setOrigin(0.5)
          .setDepth(DEPTH.hud);
        this.add
          .text(px + 108, y, entry.name, {
            fontFamily: FONT_UI,
            fontSize: '30px',
            fontStyle: i < 3 ? 'bold' : 'normal',
            color: i < 3 ? C.cream : '#c7d6e2',
          })
          .setOrigin(0, 0.5)
          .setDepth(DEPTH.hud);
        this.add
          .text(px + pw - 56, y, fmt(entry.score), {
            fontFamily: FONT_UI,
            fontSize: '30px',
            fontStyle: 'bold',
            color: medalColor,
          })
          .setOrigin(1, 0.5)
          .setDepth(DEPTH.hud);
      });
    }

    this.add
      .text(W / 2, py + ph - 34, 'Os pontos somam a cada partida', {
        fontFamily: FONT_UI,
        fontSize: '20px',
        color: C.muted,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.hud)
      .setAlpha(0.7);
  }

  private buildCta(): void {
    this.cta = this.add.container(0, 0).setDepth(DEPTH.hud);
    const x = 140;
    const y = 1756;
    const w = 800;
    const h = 118;

    const g = this.add.graphics();
    g.fillStyle(0xf4c96b, 0.1);
    g.fillRoundedRect(x, y, w, h, 59);
    g.lineStyle(3.5, 0xf4c96b, 0.8);
    g.strokeRoundedRect(x, y, w, h, 59);
    this.cta.add(g);

    this.cta.add(
      this.add
        .text(W / 2, y + 28, 'TOQUE PARA PESCAR', {
          fontFamily: FONT_UI,
          fontSize: '42px',
          fontStyle: 'bold',
          color: C.gold,
        })
        .setOrigin(0.5, 0),
    );
    this.cta.add(
      this.add
        .text(W / 2, y + 80, 'ou aperte o botão', {
          fontFamily: FONT_UI,
          fontSize: '21px',
          color: C.cream,
        })
        .setOrigin(0.5, 0)
        .setAlpha(0.75),
    );

    this.tweens.add({
      targets: this.cta,
      alpha: { from: 1, to: 0.62 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private ambientCast(): void {
    if (!this.scene.isActive() || this.leaving || isStandbyActive()) return;
    const f = Phaser.Utils.Array.GetRandom(this.ocean.fishermen);
    f.setPose('windup');
    this.time.delayedCall(420, () => {
      if (!this.scene.isActive() || isStandbyActive()) return;
      f.setPose('throw');
      sfx.throwNet();
      const ball = this.add.circle(540, 292, 13, 0xdcc79c).setDepth(DEPTH.effects);
      arcTween(
        this,
        { x: 540, y: 292 },
        { x: 610 + Phaser.Math.Between(-60, 80), y: 476 },
        150,
        520,
        (x, y) => ball.setPosition(x, y),
        () => {
          if (!isStandbyActive()) {
            splash(this, ball.x, ball.y);
            sfx.splash();
          }
          ball.destroy();
        },
        'Sine.easeIn',
      );
      this.time.delayedCall(900, () => f.setPose('idle'));
    });
  }

  private start = (): void => {
    if (this.leaving) return;
    this.leaving = true;
    sfx.start();
    this.cameras.main.fadeOut(260, 4, 8, 16);
    this.time.delayedCall(270, () => this.scene.start('Name'));
  };
}
