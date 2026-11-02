/** Sons sintetizados (sem arquivos): WebAudio puro. */
class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  unlock(): void {
    if (!this.ctx) {
      try {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.32;
        this.master.connect(this.ctx.destination);

        const len = Math.floor(this.ctx.sampleRate * 0.8);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      } catch {
        return;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private get ready(): boolean {
    return !!this.ctx && !!this.master && !this.muted;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType = 'sine',
    vol = 0.2,
    slideTo?: number,
    delay = 0,
  ): void {
    if (!this.ready) return;
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master!);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol = 0.2, from = 1200, to = 300, delay = 0): void {
    if (!this.ready || !this.noiseBuf) return;
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, to), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(this.master!);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  click(): void {
    this.tone(680, 0.05, 'square', 0.1);
  }

  pull(level = 0): void {
    this.tone(150 + level * 220, 0.07, 'triangle', 0.12, 90 + level * 120);
    this.noise(0.05, 0.05, 900, 400);
  }

  catchFish(n = 0): void {
    const base = 520 + Math.min(n, 10) * 45;
    this.tone(base, 0.09, 'triangle', 0.16);
    this.tone(base * 1.5, 0.12, 'sine', 0.1, undefined, 0.05);
  }

  splash(): void {
    this.noise(0.5, 0.22, 2200, 180);
    this.tone(120, 0.25, 'sine', 0.08, 60);
  }

  throwNet(): void {
    this.noise(0.32, 0.12, 400, 2400);
    this.tone(220, 0.18, 'sine', 0.06, 520);
  }

  win(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.16, undefined, i * 0.1));
    this.tone(1046.5, 0.6, 'sine', 0.1, undefined, 0.45);
  }

  fail(): void {
    const notes = [392, 329.63, 261.63];
    notes.forEach((f, i) => this.tone(f, 0.34, 'sine', 0.14, undefined, i * 0.16));
  }

  tick(): void {
    this.tone(880, 0.05, 'square', 0.07);
  }

  start(): void {
    this.tone(330, 0.12, 'triangle', 0.12);
    this.tone(494, 0.16, 'triangle', 0.12, undefined, 0.1);
    this.tone(660, 0.24, 'triangle', 0.12, undefined, 0.2);
  }
}

export const sfx = new Sfx();
