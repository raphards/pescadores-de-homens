import { P_BONUS } from './config';
import { clearRank, fmt, topRank } from './rank';
import { DEFAULTS, GameSettings, getSettings, resetSettings, saveSettings } from './settings';

const CSS = `
  * { box-sizing: border-box; }
  html.admin-root, html.admin-root body { height: auto !important; overflow: auto !important; }
  html.admin-root body { display: block !important; }
  html.admin-root #app { display: block !important; height: auto !important; width: 100% !important; }
  body.admin-body {
    margin: 0; padding: 0; background: #050a12; color: #e8f1f8;
    font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 28px 20px 80px; }
  header.top {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    flex-wrap: wrap; margin-bottom: 26px;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .logo {
    font-family: Impact, "Arial Black", sans-serif; font-size: 30px; color: #f4c96b;
    border: 2px solid rgba(244,201,107,.5); border-radius: 12px; padding: 6px 14px 2px;
    transform: rotate(-3deg); letter-spacing: 1px; text-shadow: 0 2px 0 #1b1008;
  }
  h1 { font-family: Georgia, serif; font-size: 26px; margin: 0; color: #f7ecd6; letter-spacing: .3px; }
  .sub { margin: 2px 0 0; font-size: 13px; color: #8fa8bc; letter-spacing: .4px; text-transform: uppercase; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
  .card {
    background: linear-gradient(180deg, #0b1c2b, #081522); border: 1px solid #1c3a52;
    border-radius: 16px; padding: 18px 18px 8px;
  }
  .card h2 {
    font-family: Georgia, serif; font-size: 17px; margin: 0 0 14px; color: #f4c96b;
    display: flex; align-items: center; gap: 8px;
  }
  .card h2 .tag { font-family: inherit; font-size: 11px; color: #7f9bb0; border: 1px solid #24455f; border-radius: 20px; padding: 2px 8px; }
  .card.wide { grid-column: 1 / -1; }
  .field { display: block; margin-bottom: 16px; }
  .field .lbl { display: flex; justify-content: space-between; font-size: 13px; color: #b9cfdf; margin-bottom: 6px; }
  .field .lbl em { color: #6f8ba1; font-style: normal; font-size: 11px; }
  .field input {
    width: 100%; background: #06111c; border: 1px solid #24455f; color: #f7ecd6;
    border-radius: 10px; padding: 11px 12px; font-size: 17px; font-family: inherit;
    outline: none; transition: border-color .15s, box-shadow .15s;
  }
  .field input:focus { border-color: #f4c96b; box-shadow: 0 0 0 3px rgba(244,201,107,.12); }
  .field small { display: block; margin-top: 5px; font-size: 11.5px; color: #6f8ba1; line-height: 1.35; }
  .row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  @media (max-width: 640px) { .row { grid-template-columns: repeat(2, 1fr); } }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .preview {
    margin-top: 16px; border: 1px dashed #2a4d68; border-radius: 14px; padding: 14px 18px;
    background: rgba(12,38,55,.45); font-size: 13.5px; color: #b9cfdf; line-height: 1.6;
  }
  .preview b { color: #f4c96b; }
  .preview .bad { color: #ff8b7a; }
  footer.bar {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    margin-top: 22px; padding-top: 18px; border-top: 1px solid #14293b;
  }
  .btn {
    appearance: none; border: 1px solid #2a4d68; background: #0d2233; color: #dceaf5;
    padding: 11px 18px; border-radius: 10px; font-size: 14px; font-family: inherit;
    cursor: pointer; text-decoration: none; display: inline-block; transition: all .15s;
  }
  .btn:hover { border-color: #f4c96b; color: #f4c96b; }
  .btn.primary { background: #f4c96b; border-color: #f4c96b; color: #1a1206; font-weight: bold; }
  .btn.primary:hover { background: #ffd98a; color: #1a1206; }
  .btn.danger { margin-left: auto; border-color: #5b2a2a; color: #ff8b7a; }
  .btn.danger:hover { border-color: #ff8b7a; }
  .toast { font-size: 13px; color: #8ce0a4; opacity: 0; transition: opacity .25s; }
  .toast.show { opacity: 1; }
  .rank-mini { font-size: 13px; color: #9fb6c9; line-height: 1.8; }
  .rank-mini b { color: #f4c96b; }
  .hint { font-size: 12px; color: #5f7b90; margin-top: 26px; line-height: 1.6; }
  code { background: #0b1c2b; border: 1px solid #1c3a52; border-radius: 6px; padding: 1px 6px; color: #f4c96b; }
`;

function field(
  key: string,
  label: string,
  value: number,
  opts: { min?: number; max?: number; step?: number; unit?: string; hint?: string; dot?: string } = {},
): string {
  const { min = 0, max = 100000, step = 1, unit = '', hint = '', dot = '' } = opts;
  return `
    <label class="field">
      <span class="lbl"><span>${dot}${label}</span><em>${unit}</em></span>
      <input type="number" data-key="${key}" value="${value}" min="${min}" max="${max}" step="${step}" />
      ${hint ? `<small>${hint}</small>` : ''}
    </label>`;
}

export function renderAdmin(root: HTMLElement): void {
  const s = getSettings();
  document.documentElement.classList.add('admin-root');
  document.body.classList.add('admin-body');
  document.title = 'Ajustes · Pescadores de Homens';

  const rank = topRank(3);
  const rankHtml = rank.length
    ? rank.map((r, i) => `${i + 1}º <b>${r.name}</b> — ${fmt(r.score)} pts`).join('<br>')
    : 'Rank vazio.';

  root.innerHTML = `
    <style>${CSS}</style>
    <div class="wrap">
      <header class="top">
        <div class="brand">
          <span class="logo">ONE'C</span>
          <div>
            <h1>Pescadores de Homens</h1>
            <p class="sub">Painel de ajustes do totem</p>
          </div>
        </div>
        <a class="btn primary" href="#">▶ Abrir o jogo</a>
      </header>

      <div class="grid">
        <section class="card">
          <h2>Tempo <span class="tag">partida</span></h2>
          ${field('pullSeconds', 'Tempo para puxar a tarrafa', s.pullSeconds, {
            min: 5,
            max: 60,
            unit: 'segundos',
            hint: 'É o tempo total da puxada. Se a tarrafa não chegar na zona de bênção até o fim, a partida falha.',
          })}
        </section>

        <section class="card">
          <h2>Dificuldade do clique</h2>
          ${field('pressGain', 'Força de cada aperto', s.pressGain, {
            min: 0.002,
            max: 0.2,
            step: 0.001,
            unit: '0 a 1',
            hint: 'Quanto a rede sobe a cada toque. Maior = mais fácil (precisa de menos apertos).',
          })}
          ${field('sinkPerSec', 'Peso da rede (afunda)', s.sinkPerSec, {
            min: 0,
            max: 0.2,
            step: 0.001,
            unit: 'por segundo',
            hint: 'Quanto a rede volta a afundar sozinha. Maior = mais difícil (tem que martelar sem parar).',
          })}
        </section>

        <section class="card">
          <h2>Combo <span class="tag">velocidade</span></h2>
          ${field('comboWindowMs', 'Janela do combo', s.comboWindowMs, {
            min: 0,
            max: 1000,
            unit: 'ms',
            hint: 'Apertos mais rápidos que isso mantêm a sequência. Ex.: 200 ms = até 5 toques por segundo.',
          })}
          ${field('comboStep', 'Ganho por nível de combo', s.comboStep, {
            min: 0,
            max: 1,
            step: 0.01,
            unit: 'extra',
            hint: 'Cada nível de combo acelera a fisgada. 0,12 = +12% por nível.',
          })}
          ${field('comboMax', 'Combo máximo', s.comboMax, {
            min: 0,
            max: 50,
            unit: 'níveis',
            hint: 'Teto do combo. Com 8 níveis e 0,12, o pico é 1,96x mais rápido para fisgar.',
          })}
        </section>

        <section class="card">
          <h2>Tarrafa &amp; bônus</h2>
          ${field('netCapacity', 'Peixes que cabem na tarrafa', s.netCapacity, {
            min: 1,
            max: 30,
            unit: 'peixes',
            hint: 'Ao encher, aparece “REDE CHEIA” e não fisga mais.',
          })}
          ${field('bonusPoints', 'Bônus da zona de bênção', s.bonusPoints, {
            min: 0,
            max: 100000,
            unit: 'pontos',
            hint: 'Pontos ganhos ao chegar na faixa dourada antes do tempo acabar.',
          })}
          ${field('speedBonusPerSec', 'Bônus por segundo restante', s.speedBonusPerSec, {
            min: 0,
            max: 1000,
            unit: 'pontos/s',
            hint: 'Recompensa a rapidez: cada segundo que sobrar no cronômetro vale isso.',
          })}
        </section>

        <section class="card wide">
          <h2>Pontos por nível <span class="tag">peixes</span></h2>
          <div class="row">
            ${field('points.sardinha', 'Nível 1 · Sardinha', s.points.sardinha, { dot: '<span class="dot" style="background:#9ad8e8"></span> ' })}
            ${field('points.tainha', 'Nível 2 · Tainha', s.points.tainha, { dot: '<span class="dot" style="background:#b9c6c9"></span> ' })}
            ${field('points.dourado', 'Nível 3 · Dourado', s.points.dourado, { dot: '<span class="dot" style="background:#e8b04a"></span> ' })}
            ${field('points.pintado', 'Nível 4 · Pintado', s.points.pintado, { dot: '<span class="dot" style="background:#9a8f78"></span> ' })}
          </div>
        </section>

        <section class="card wide">
          <h2>Apertos para fisgar 1 peixe <span class="tag">por nível</span></h2>
          <div class="row">
            ${field('pressCost.0', 'Nível 1 · Sardinha', s.pressCost[0], { min: 1, max: 100, unit: 'toques' })}
            ${field('pressCost.1', 'Nível 2 · Tainha', s.pressCost[1], { min: 1, max: 100, unit: 'toques' })}
            ${field('pressCost.2', 'Nível 3 · Dourado', s.pressCost[2], { min: 1, max: 100, unit: 'toques' })}
            ${field('pressCost.3', 'Nível 4 · Pintado', s.pressCost[3], { min: 1, max: 100, unit: 'toques' })}
          </div>
        </section>
      </div>

      <div class="preview" id="preview"></div>

      <footer class="bar">
        <button class="btn primary" id="save">Salvar ajustes</button>
        <button class="btn" id="reset">Restaurar padrão</button>
        <button class="btn danger" id="clearRank">Zerar rank</button>
        <span class="toast" id="toast">Ajustes salvos — valem na próxima partida.</span>
      </footer>

      <p class="hint">
        Rank atual:<br><span class="rank-mini">${rankHtml}</span><br><br>
        Esta página é aberta pela URL <code>#/admin</code>. Os ajustes ficam salvos neste navegador
        (localStorage) e são lidos no início de cada partida — se salvar em outra aba, a próxima
        pescaria já usa os valores novos.
      </p>
    </div>
  `;

  const q = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;

  const readForm = (): GameSettings => {
    const out: GameSettings = {
      ...DEFAULTS,
      points: { ...DEFAULTS.points },
      pressCost: [...DEFAULTS.pressCost] as [number, number, number, number],
    };
    root.querySelectorAll<HTMLInputElement>('input[data-key]').forEach((el) => {
      const key = el.dataset.key ?? '';
      const val = Number(el.value);
      if (!Number.isFinite(val)) return;
      if (key.startsWith('points.')) {
        const k = key.slice(7) as keyof GameSettings['points'];
        out.points[k] = Math.round(val);
      } else if (key.startsWith('pressCost.')) {
        const i = Number(key.slice(10));
        if (i >= 0 && i < 4) out.pressCost[i] = Math.round(val);
      } else {
        (out as unknown as Record<string, number>)[key] = val;
      }
    });
    return out;
  };

  const updatePreview = (): void => {
    const cfg = readForm();
    const presses = P_BONUS / cfg.pressGain;
    const perSec6 = 6 * cfg.pressGain - cfg.sinkPerSec;
    const secs6 = perSec6 > 0 ? P_BONUS / perSec6 : Infinity;
    const ok = secs6 <= cfg.pullSeconds;
    q<HTMLDivElement>('#preview').innerHTML = `
      Com <b>6 toques por segundo</b>: cerca de <b>${Math.ceil(presses)} toques</b> para chegar na zona de bênção
      em <b>${Number.isFinite(secs6) ? secs6.toFixed(1) + 's' : '—'}</b> (tempo total: ${cfg.pullSeconds}s).
      ${ok ? '<span style="color:#8ce0a4">Ritmo possível ✔</span>' : '<span class="bad">Nesse ritmo a tarrafa não chega a tempo — aumente a força do aperto ou o tempo.</span>'}
      <br>Combo no pico: <b>${(1 + cfg.comboStep * cfg.comboMax).toFixed(2)}x</b> mais rápido para fisgar ·
      Tarrafa cheia: <b>${cfg.netCapacity} peixes</b> ·
      Bônus máximo: <b>${fmt(cfg.bonusPoints + Math.round(cfg.pullSeconds * cfg.speedBonusPerSec))}</b> pts.
    `;
  };

  root.querySelectorAll<HTMLInputElement>('input[data-key]').forEach((el) => {
    el.addEventListener('input', updatePreview);
  });
  updatePreview();

  q<HTMLButtonElement>('#save').addEventListener('click', () => {
    saveSettings(readForm());
    const toast = q<HTMLSpanElement>('#toast');
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2600);
    updatePreview();
  });

  q<HTMLButtonElement>('#reset').addEventListener('click', () => {
    resetSettings();
    renderAdmin(root);
  });

  q<HTMLButtonElement>('#clearRank').addEventListener('click', () => {
    if (window.confirm('Apagar o rank de todos os pescadores?')) {
      clearRank();
      renderAdmin(root);
    }
  });
}
