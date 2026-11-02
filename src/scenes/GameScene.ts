import Phaser from 'phaser';
import { arcTween } from '../art/draw';
import { confetti, floatText, ringPulse, sparkle, splash } from '../art/effects';
import { FishSwimmer, spawnBandFish } from '../art/fish';
import { CastNet, drawRope } from '../art/net';
import { Ocean } from '../art/ocean';
import { sfx } from '../audio';
import {
  BANDS,
  BONUS_Y,
  BOAT_Y,
  H,
  NET_BOTTOM_Y,
  NET_SURFACE_Y,
  P_BONUS,
  RESULT_MS,
  SPECIES,
  SURFACE_Y,
  W,
} from '../config';
import { lockInput, offPress, onPress } from '../input';
import { addScore, fmt } from '../rank';
import { GameSettings, getSettings } from '../settings';
import { C, DEPTH, FONT_TITLE, FONT_UI } from '../ui';

type Phase = 'cast' | 'pull' | 'success' | 'fail' | 'result';

export default class GameScene extends Phaser.Scene {
  private playerName = 'PESCADOR';
  private cfg!: GameSettings;

  private ocean!: Ocean;
  private net!: CastNet;
  private ropeG!: Phaser.GameObjects.Graphics;
  private fish: FishSwimmer[] = [];

  private phase: Phase = 'cast';
  private p = 0;
  private dispP = 0;
  private timeLeft = 15;
  private points = 0;
  private count = 0;
  private catchProgress = 0;
  private combo = 0;
  private speedBonus = 0;
  private lastPress = -99999;
  private kick = 0;
  private lastSecond = 99;

  private scoreText!: Phaser.GameObjects.Text;
  private fishText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private timerFill!: Phaser.GameObjects.Graphics;
  private forceFill!: Phaser.GameObjects.Graphics;
  private comboText!: Phaser.GameObjects.Text;
  private instruction!: Phaser.GameObjects.Text;

  private resultOpen = false;
  private gone = false;

  constructor() {
    super('Game');
  }

  init(data: { name?: string }): void {
    this.playerName = (data?.name ?? 'PESCADOR').toUpperCase().slice(0, 12);
  }

  create(): void {
    this.phase = 'cast';
    this.cfg = getSettings();
    this.p = 0;
    this.dispP = 0;
    this.timeLeft = this.cfg.pullSeconds;
    this.points = 0;
    this.count = 0;
    this.catchProgress = 0;
    this.combo = 0;
    this.speedBonus = 0;
    this.lastPress = -99999;
    this.kick = 0;
    this.lastSecond = 99;
    this.resultOpen = false;
    this.gone = false;
    this.fish = [];

    lockInput(600);
    this.cameras.main.fadeIn(280, 4, 8, 16);

    this.ocean = new Ocean(this);
    this.buildWaterBands();
    this.buildBonusZone();
    this.spawnFish();
    this.net = new CastNet(this);
    this.ropeG = this.add.graphics().setDepth(DEPTH.rope);
    this.buildHud();
    this.startCast();

    onPress(this.onButton);
    this.events.once('shutdown', () => offPress(this.onButton));
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 60) / 1000;
    this.ocean.update(dt);
    const t = this.ocean.time;
    for (const f of this.fish) f.update(dt, t);
    this.net.update(t);
    this.kick *= Math.pow(0.012, dt);

    if (this.phase === 'pull') {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      this.p = Math.max(0, this.p - this.cfg.sinkPerSec * dt);
      this.dispP = Phaser.Math.Linear(this.dispP, this.p, 1 - Math.pow(0.0009, dt));
      this.updateNet(t);
      this.updateHud();
      if (this.time.now - this.lastPress > this.cfg.comboWindowMs * 2) this.combo = 0;
      const sec = Math.ceil(this.timeLeft);
      if (sec !== this.lastSecond) {
        this.lastSecond = sec;
        if (sec <= 5 && sec > 0) sfx.tick();
      }
      if (this.timeLeft <= 0) this.finish(false);
    } else if (this.phase === 'success' || this.phase === 'fail') {
      // a rede continua sendo desenhada pelos tweens
    }
  }

  // ---------------------------------------------------------------- montagem

  private spawnFish(): void {
    for (const band of BANDS) {
      for (let i = 0; i < 5; i++) this.fish.push(spawnBandFish(this, band.id, 1.15));
    }
  }

  private buildWaterBands(): void {
    const g = this.add.graphics().setDepth(DEPTH.bands);
    for (const b of BANDS) {
      g.fillStyle(b.tint, 0.1);
      g.fillRect(0, b.y0, W, b.y1 - b.y0);
      g.lineStyle(2, 0x9fd8e8, 0.12);
      g.lineBetween(0, b.y0, W, b.y0);
      g.fillStyle(0x04121f, 0.42);
      g.fillRoundedRect(14, b.y0 + 14, 196, 66, 14);
    }

    for (const b of BANDS) {
      const sp = SPECIES[b.species];
      this.add
        .text(34, b.y0 + 24, `NÍVEL ${b.id}`, {
          fontFamily: FONT_UI,
          fontSize: '22px',
          fontStyle: 'bold',
          color: C.gold,
        })
        .setDepth(DEPTH.bands)
        .setAlpha(0.85);
      this.add
        .text(34, b.y0 + 52, `${sp.label} · ${sp.points} pts`, {
          fontFamily: FONT_UI,
          fontSize: '18px',
          color: '#cfe3ef',
        })
        .setDepth(DEPTH.bands)
        .setAlpha(0.7);
    }
  }

  private buildBonusZone(): void {
    const g = this.add.graphics().setDepth(DEPTH.bonus);
    g.fillStyle(0xf4c96b, 0.07);
    g.fillRect(0, BONUS_Y - 60, W, 60);
    g.lineStyle(3, 0xf4c96b, 0.5);
    for (let x = 0; x < W; x += 44) g.lineBetween(x, BONUS_Y, x + 24, BONUS_Y);

    const label = this.add
      .text(W - 26, BONUS_Y - 40, `ZONA DE BÊNÇÃO  +${fmt(this.cfg.bonusPoints)}`, {
        fontFamily: FONT_UI,
        fontSize: '24px',
        fontStyle: 'bold',
        color: C.gold,
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH.bonus)
      .setAlpha(0.85);

    this.tweens.add({
      targets: [g, label],
      alpha: { from: 1, to: 0.55 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private buildHud(): void {
    this.add
      .text(46, 26, 'PONTOS', {
        fontFamily: FONT_UI,
        fontSize: '22px',
        fontStyle: 'bold',
        color: C.muted,
      })
      .setDepth(DEPTH.hud);

    this.scoreText = this.add
      .text(46, 52, '0', {
        fontFamily: FONT_UI,
        fontSize: '54px',
        fontStyle: 'bold',
        color: C.cream,
      })
      .setDepth(DEPTH.hud);

    this.fishText = this.add
      .text(W - 46, 58, `PEIXES 0/${this.cfg.netCapacity}`, {
        fontFamily: FONT_UI,
        fontSize: '26px',
        fontStyle: 'bold',
        color: C.muted,
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH.hud);

    this.timerText = this.add
      .text(W / 2, 24, `${this.cfg.pullSeconds}`, {
        fontFamily: FONT_UI,
        fontSize: '42px',
        fontStyle: 'bold',
        color: C.gold,
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.hud)
      .setVisible(false);

    this.comboText = this.add
      .text(W / 2, 126, '', {
        fontFamily: FONT_UI,
        fontSize: '28px',
        fontStyle: 'bold',
        color: C.gold,
        stroke: '#04121f',
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.hud)
      .setVisible(false);

    const tg = this.add.graphics().setDepth(DEPTH.hud);
    tg.fillStyle(0x06131f, 0.8);
    tg.fillRoundedRect(300, 96, 480, 20, 10);
    tg.lineStyle(2, 0x3f7ba3, 0.7);
    tg.strokeRoundedRect(300, 96, 480, 20, 10);

    this.timerFill = this.add.graphics().setDepth(DEPTH.hud);
    this.forceFill = this.add.graphics().setDepth(DEPTH.hud);

    // barra inferior
    this.add.rectangle(W / 2, 1869, W, 102, 0x03101c, 0.72).setDepth(DEPTH.hud);
    this.instruction = this.add
      .text(W / 2, 1834, 'LANÇANDO A TARRAFA...', {
        fontFamily: FONT_UI,
        fontSize: '40px',
        fontStyle: 'bold',
        color: C.gold,
        stroke: '#04121f',
        strokeThickness: 8,
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.hud);
  }

  // ---------------------------------------------------------------- arremesso

  private startCast(): void {
    this.phase = 'cast';
    const f = this.ocean.fishermen[1];
    this.time.delayedCall(200, () => f.setPose('windup'));
    this.time.delayedCall(760, () => {
      f.setPose('throw');
      sfx.throwNet();
      this.net.setPos(540, 290);
      this.net.setScale(0.4);
      this.net.draw(0, 0);
      this.ropeG.clear();

      arcTween(
        this,
        { x: 540, y: 290 },
        { x: 560, y: SURFACE_Y + 52 },
        150,
        640,
        (x, y, tt) => {
          this.net.setPos(x, y);
          this.net.setScale(0.4 + tt * 0.5);
          this.net.draw(tt * 0.35, tt * 8);
          this.ropeG.clear();
          drawRope(this.ropeG, 540, 292, x, y - 16, tt * 12);
        },
        () => {
          splash(this, 560, SURFACE_Y + 52, true);
          sfx.splash();
          this.sinkNet();
        },
        'Sine.easeIn',
      );
    });
  }

  private sinkNet(): void {
    const fromY = this.net.y;
    const fromX = this.net.x;
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 1500,
      ease: 'Quad.easeIn',
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        const y = Phaser.Math.Linear(fromY, NET_BOTTOM_Y, t);
        const x = Phaser.Math.Linear(fromX, 540, t);
        this.net.setPos(x, y);
        this.net.setScale(Phaser.Math.Linear(0.9, 0.62, t));
        this.net.draw(0.35 + t * 0.65, t * 7);
        this.ropeG.clear();
        drawRope(this.ropeG, 540, 292, x, y - 132 * this.net.sc + 6, t * 10);
      },
      onComplete: () => {
        this.phase = 'pull';
        this.timeLeft = this.cfg.pullSeconds;
        this.lastSecond = this.cfg.pullSeconds;
        this.p = 0;
        this.dispP = 0;
        this.ocean.fishermen[1].setPose('idle');
        this.instruction.setText('MARTELE O BOTÃO!');
        this.timerText.setVisible(true);
        sfx.start();
      },
    });
  }

  // ------------------------------------------------------------------- puxada

  private onButton = (): void => {
    if (this.phase === 'result') {
      this.goAttract();
      return;
    }
    if (this.phase !== 'pull') return;
    const now = this.time.now;
    const gap = now - this.lastPress;
    if (gap < 30) return;
    this.combo = gap <= this.cfg.comboWindowMs ? Math.min(this.combo + 1, this.cfg.comboMax) : 0;
    this.lastPress = now;

    this.p = Math.min(1, this.p + this.cfg.pressGain);
    this.kick = 1;
    for (const f of this.ocean.fishermen) f.pull();
    sfx.pull(this.p);
    ringPulse(this, 540 + Phaser.Math.Between(-90, 90), this.net.y - 50, 0xffe3a8);

    // Cada aperto vale uma fisgada — e o combo de apertos rápidos acelera a rede.
    if (this.count < this.cfg.netCapacity) {
      const idx = this.bandIndexAt(this.net.y);
      if (idx >= 0) {
        const cost = BANDS[idx].pressCost;
        const gain = 1 + this.combo * this.cfg.comboStep;
        this.catchProgress = Math.min(this.catchProgress + gain, cost);
        if (this.catchProgress >= cost) {
          const got = this.catchOne(idx);
          if (got) this.catchProgress = 0;
        }
      }
    }

    if (this.p >= P_BONUS) this.finish(true);
  };

  private updateNet(t: number): void {
    const y = Phaser.Math.Linear(NET_BOTTOM_Y, NET_SURFACE_Y, this.dispP);
    this.net.setPos(540, y);
    this.net.setScale(Phaser.Math.Linear(0.62, 1, Phaser.Math.Clamp(this.dispP, 0, 1.1)));
    this.net.draw(1, t * 0.9);
    this.ropeG.clear();
    drawRope(this.ropeG, 540, 292, 540, y - 132 * this.net.sc + 6, Math.sin(t * 2.2) * 10);
  }

  private bandIndexAt(y: number): number {
    for (let i = 0; i < BANDS.length; i++) {
      if (y >= BANDS[i].y0 && y <= BANDS[i].y1) return i;
    }
    return -1;
  }

  private catchOne(idx: number): boolean {
    const band = BANDS[idx];
    const candidates = this.fish.filter((f) => f.alive && f.band.id === band.id);
    if (!candidates.length) return false;
    const target = Phaser.Utils.Array.GetRandom(candidates) as FishSwimmer;
    target.alive = false;

    const sp = SPECIES[band.species];
    this.points += sp.points;
    this.count += 1;
    sfx.catchFish(this.count);

    const nx = this.net.x + Phaser.Math.Between(-70, 70) * this.net.sc;
    const ny = this.net.y - Phaser.Math.Between(-10, 90) * this.net.sc;

    this.tweens.add({
      targets: target.img,
      x: nx,
      y: ny,
      duration: 240,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.net.addFish(sp);
        target.img.destroy();
        this.fish = this.fish.filter((f) => f !== target);
        floatText(this, nx, ny - 24, `+${sp.points}`, sp.points >= 50 ? '#ffd166' : '#ffffff', 42);
        sparkle(this, nx, ny, 10, sp.points >= 50 ? 0xffd166 : 0xffffff);
        this.respawn(band.id);
        if (this.count >= this.cfg.netCapacity) {
          floatText(this, 540, this.net.y - 170, 'REDE CHEIA!', '#ffd166', 46);
        }
      },
    });
    return true;
  }

  private respawn(bandId: number): void {
    this.time.delayedCall(Phaser.Math.Between(1300, 2800), () => {
      if (!this.scene.isActive()) return;
      this.fish.push(spawnBandFish(this, bandId, 1.15));
    });
  }

  private updateHud(): void {
    this.scoreText.setText(fmt(this.points));
    this.fishText.setText(`PEIXES ${this.count}/${this.cfg.netCapacity}`);

    const ratio = Phaser.Math.Clamp(this.timeLeft / this.cfg.pullSeconds, 0, 1);
    const color = ratio > 0.5 ? 0x8ce0a4 : ratio > 0.25 ? 0xf4c96b : 0xff8b7a;
    this.timerFill.clear();
    if (ratio > 0) {
      this.timerFill.fillStyle(color, 1);
      this.timerFill.fillRoundedRect(302, 98, 476 * ratio, 16, 8);
    }
    this.timerText.setText(`${Math.ceil(this.timeLeft)}`);
    this.timerText.setColor(ratio > 0.25 ? C.gold : C.red);

    if (this.combo >= 2 && this.cfg.comboStep > 0) {
      const mult = 1 + this.combo * this.cfg.comboStep;
      this.comboText.setText(`COMBO x${mult.toFixed(1)}`);
      this.comboText.setVisible(true);
      this.comboText.setAlpha(0.55 + Math.min(1, this.combo / Math.max(1, this.cfg.comboMax)) * 0.45);
    } else {
      this.comboText.setVisible(false);
    }

    this.forceFill.clear();
    if (this.kick > 0.02) {
      this.forceFill.fillStyle(0xffd166, 0.9);
      this.forceFill.fillRoundedRect(300, 1890, 480 * this.kick, 12, 6);
    }
  }

  // ------------------------------------------------------------------ final

  private finish(success: boolean): void {
    if (this.phase !== 'pull') return;
    this.phase = success ? 'success' : 'fail';
    this.combo = 0;
    this.updateHud();
    this.timerText.setVisible(false);
    this.comboText.setVisible(false);
    this.forceFill.clear();

    if (success) {
      this.speedBonus = Math.max(0, Math.round(this.timeLeft * this.cfg.speedBonusPerSec));
      this.instruction.setText('BÔNUS! REDE ABENÇOADA');
      for (const f of this.ocean.fishermen) f.setPose('cheer');
      sfx.win();
      confetti(this, 540, 260, 100);
      sparkle(this, 540, BONUS_Y, 34, 0xffd166);
      floatText(this, 540, BONUS_Y - 120, `+${this.cfg.bonusPoints} DE BÔNUS!`, '#ffd166', 58);
      if (this.speedBonus > 0) {
        floatText(this, 540, BONUS_Y - 60, `RAPIDEZ +${this.speedBonus}`, '#8ce0a4', 40);
      }
      this.tweens.addCounter({
        from: this.dispP,
        to: 1.1,
        duration: 520,
        ease: 'Back.easeOut',
        onUpdate: (tw) => {
          this.dispP = tw.getValue() ?? 0;
          this.updateNet(this.ocean.time);
        },
      });
      this.time.delayedCall(2400, () => this.showResult(true));
    } else {
      this.instruction.setText('A TARRAFA AFUNDOU...');
      for (const f of this.ocean.fishermen) f.setPose('tired');
      sfx.fail();
      floatText(this, 540, this.net.y - 140, 'QUE PENA...', '#ff8b7a', 56);
      const fromY = this.net.y;
      const fromS = this.net.sc;
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 3000,
        ease: 'Sine.easeIn',
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          const y = Phaser.Math.Linear(fromY, NET_BOTTOM_Y, t);
          this.net.setPos(540, y);
          this.net.setScale(Phaser.Math.Linear(fromS, 0.62, t));
          this.net.draw(1, t * 14);
          this.ropeG.clear();
          drawRope(this.ropeG, 540, 292, 540, y - 132 * this.net.sc + 6, t * 20);
        },
        onComplete: () => this.time.delayedCall(420, () => this.showResult(false)),
      });
    }
  }

  private showResult(success: boolean): void {
    if (this.resultOpen) return;
    this.resultOpen = true;
    this.phase = 'result';
    this.instruction.setText('');
    lockInput(900);

    const bonus = success ? this.cfg.bonusPoints : 0;
    const matchPoints = this.points + bonus + (success ? this.speedBonus : 0);
    const res = addScore(this.playerName, matchPoints);

    const ov = this.add.container(0, 0).setDepth(DEPTH.overlay);
    ov.add(this.add.rectangle(W / 2, H / 2, W, H, 0x02060c, 0.74));

    const g = this.add.graphics();
    g.fillStyle(0x04121f, 0.97);
    g.fillRoundedRect(96, 466, 888, 988, 32);
    g.lineStyle(3, success ? 0xf4c96b : 0x6f8fa8, 0.85);
    g.strokeRoundedRect(96, 466, 888, 988, 32);
    g.lineStyle(1.5, 0xf4c96b, 0.15);
    g.strokeRoundedRect(106, 476, 868, 968, 26);
    ov.add(g);

    const add = (y: number, text: string, size: number, color: string, bold = false, italic = false) => {
      const t = this.add
        .text(W / 2, y, text, {
          fontFamily: size >= 40 ? FONT_TITLE : FONT_UI,
          fontSize: `${size}px`,
          fontStyle: `${bold ? 'bold' : ''} ${italic ? 'italic' : ''}`.trim() || 'normal',
          color,
          align: 'center',
        })
        .setOrigin(0.5, 0);
      ov.add(t);
      return t;
    };

    add(512, success ? 'PESCARIA ABENÇOADA!' : 'A TARRAFA AFUNDOU...', 46, success ? C.gold : C.red, true);
    add(580, this.playerName, 28, C.muted);

    add(632, fmt(matchPoints), 104, C.cream, true);
    add(752, 'PONTOS NESTA PARTIDA', 22, C.muted);

    add(806, `Peixes fisgados: ${this.count}`, 30, '#cfe3ef');
    add(848, `Pontos dos peixes: ${fmt(this.points)}`, 30, '#cfe3ef');
    add(890, success ? `Bônus de bênção: +${fmt(this.cfg.bonusPoints)}` : 'Bônus de bênção: não alcançado', 30, success ? C.gold : '#8aa4b8');
    add(932, success ? `Bônus de rapidez: +${fmt(this.speedBonus)}` : 'Bônus de rapidez: —', 30, success ? '#8ce0a4' : '#8aa4b8');

    g.lineStyle(2, 0x2c4a60, 0.9);
    g.lineBetween(200, 988, 880, 988);

    add(1016, 'TOTAL NO RANK', 24, C.muted);
    add(1050, fmt(res.total), 66, C.gold, true);

    let posLabel = '';
    if (res.isNew) posLabel = 'NOVO PESCADOR NO RANK';
    else if (res.position === 1) posLabel = '1º LUGAR — O MELHOR PESCADOR!';
    else posLabel = `${res.position}º LUGAR NO RANK`;
    add(1136, posLabel, 30, '#cfe3ef', true);

    if (res.isRecord && !res.isNew) {
      add(1188, '★ NOVO RECORDE PESSOAL ★', 26, C.gold, true);
    } else if (res.isNew) {
      add(1188, 'Sua primeira pescaria está registrada!', 24, C.muted, false, true);
    }

    const hint = add(1362, 'Toque para continuar', 26, C.muted);
    this.tweens.add({
      targets: hint,
      alpha: { from: 1, to: 0.35 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    sparkle(this, 540, 640, 24, 0xffd166);
    this.time.delayedCall(RESULT_MS, () => this.goAttract());
  }

  private goAttract(): void {
    if (this.gone) return;
    this.gone = true;
    this.cameras.main.fadeOut(300, 4, 8, 16);
    this.time.delayedCall(320, () => this.scene.start('Attract'));
  }
}
