import { BANDS, SPECIES, SpeciesKey } from './config';

/**
 * Ajustes do jogo editáveis pelo painel (#/admin).
 * Ficam salvos no navegador do totem e valem a partir da próxima partida.
 */
export interface GameSettings {
  /** tempo para puxar a tarrafa (s) */
  pullSeconds: number;
  /** quanto cada aperto levanta a rede (0..1 do percurso) */
  pressGain: number;
  /** peso da rede: quanto ela afunda sozinha por segundo */
  sinkPerSec: number;
  /** janela do combo (ms): apertos mais rápidos mantêm a sequência */
  comboWindowMs: number;
  /** ganho extra de fisgada por nível de combo */
  comboStep: number;
  /** teto do combo */
  comboMax: number;
  /** bônus por segundo restante ao alcançar a zona de bênção */
  speedBonusPerSec: number;
  /** bônus fixo ao alcançar a zona de bênção */
  bonusPoints: number;
  /** quantos peixes cabem na tarrafa */
  netCapacity: number;
  /** pontos de cada espécie */
  points: Record<SpeciesKey, number>;
  /** apertos necessários para fisgar 1 peixe em cada nível */
  pressCost: [number, number, number, number];
}

export const DEFAULTS: GameSettings = {
  pullSeconds: 15,
  pressGain: 0.017,
  sinkPerSec: 0.018,
  comboWindowMs: 200,
  comboStep: 0.12,
  comboMax: 8,
  speedBonusPerSec: 40,
  bonusPoints: 500,
  netCapacity: 12,
  points: { sardinha: 10, tainha: 25, dourado: 50, pintado: 100 },
  pressCost: [6, 8, 10, 12],
};

const KEY = 'pdh.settings.v1';

let cache: GameSettings | null = null;

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function loadSettings(): GameSettings {
  let raw: Record<string, unknown> | null = null;
  try {
    raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Record<string, unknown> | null;
  } catch {
    raw = null;
  }

  const s: GameSettings = {
    ...DEFAULTS,
    points: { ...DEFAULTS.points },
    pressCost: [...DEFAULTS.pressCost] as [number, number, number, number],
  };

  if (raw && typeof raw === 'object') {
    s.pullSeconds = clampNum(raw.pullSeconds, 5, 60, DEFAULTS.pullSeconds);
    s.pressGain = clampNum(raw.pressGain, 0.002, 0.2, DEFAULTS.pressGain);
    s.sinkPerSec = clampNum(raw.sinkPerSec, 0, 0.2, DEFAULTS.sinkPerSec);
    s.comboWindowMs = clampNum(raw.comboWindowMs, 0, 1000, DEFAULTS.comboWindowMs);
    s.comboStep = clampNum(raw.comboStep, 0, 1, DEFAULTS.comboStep);
    s.comboMax = clampNum(raw.comboMax, 0, 50, DEFAULTS.comboMax);
    s.speedBonusPerSec = clampNum(raw.speedBonusPerSec, 0, 1000, DEFAULTS.speedBonusPerSec);
    s.bonusPoints = clampNum(raw.bonusPoints, 0, 100000, DEFAULTS.bonusPoints);
    s.netCapacity = clampNum(raw.netCapacity, 1, 30, DEFAULTS.netCapacity);

    const pts = raw.points as Record<string, unknown> | undefined;
    if (pts && typeof pts === 'object') {
      (Object.keys(DEFAULTS.points) as SpeciesKey[]).forEach((k) => {
        s.points[k] = Math.round(clampNum(pts[k], 0, 100000, DEFAULTS.points[k]));
      });
    }

    const costs = raw.pressCost as unknown[] | undefined;
    if (Array.isArray(costs)) {
      for (let i = 0; i < 4; i++) {
        s.pressCost[i] = Math.round(clampNum(costs[i], 1, 100, DEFAULTS.pressCost[i]));
      }
    }
  }

  cache = s;
  applySettings(s);
  return s;
}

/** Ajustes ativos (aplica os valores em SPECIES/BANDS). */
export function getSettings(): GameSettings {
  return cache ?? loadSettings();
}

export function saveSettings(s: GameSettings): void {
  cache = s;
  applySettings(s);
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sem storage: vale só nesta sessão */
  }
}

export function resetSettings(): GameSettings {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
  return loadSettings();
}

export function hasCustomSettings(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

function applySettings(s: GameSettings): void {
  (Object.keys(s.points) as SpeciesKey[]).forEach((k) => {
    SPECIES[k].points = s.points[k];
  });
  BANDS.forEach((b, i) => {
    b.pressCost = s.pressCost[i];
  });
}

// se o painel for salvo em outra aba, a próxima partida já usa os novos valores
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) cache = null;
  });
}
