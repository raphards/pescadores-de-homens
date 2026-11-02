/**
 * Pescadores de Homens — constantes de layout e balanceamento.
 * Tela lógica: 1080 x 1920 (TV 32" na vertical / totem).
 */

export const W = 1080;
export const H = 1920;

/** Altura do céu / linha d'água */
export const SURFACE_Y = 430;
/** Linha do convés do barco */
export const BOAT_Y = 392;

export interface SpeciesDef {
  key: string;
  label: string;
  texture: string;
  points: number;
  w: number;
  h: number;
  body: number;
  fin: number;
  belly: number;
}

export type SpeciesKey = 'sardinha' | 'tainha' | 'dourado' | 'pintado';

export const SPECIES: Record<SpeciesKey, SpeciesDef> = {
  sardinha: {
    key: 'sardinha',
    label: 'Sardinha',
    texture: 'fish-sardinha',
    points: 10,
    w: 86,
    h: 40,
    body: 0x9ad8e8,
    fin: 0x2f7fa0,
    belly: 0xdff4fa,
  },
  tainha: {
    key: 'tainha',
    label: 'Tainha',
    texture: 'fish-tainha',
    points: 25,
    w: 108,
    h: 50,
    body: 0xb9c6c9,
    fin: 0x4a5d68,
    belly: 0xe6eef0,
  },
  dourado: {
    key: 'dourado',
    label: 'Dourado',
    texture: 'fish-dourado',
    points: 50,
    w: 126,
    h: 58,
    body: 0xe8b04a,
    fin: 0x8a5a12,
    belly: 0xf7dfa2,
  },
  pintado: {
    key: 'pintado',
    label: 'Pintado',
    texture: 'fish-pintado',
    points: 100,
    w: 152,
    h: 72,
    body: 0x9a8f78,
    fin: 0x2f2a22,
    belly: 0xc9bfa8,
  },
};

export interface BandDef {
  id: number;
  label: string;
  species: SpeciesKey;
  y0: number;
  y1: number;
  tint: number;
  /** quantos apertos do botão para fisgar 1 peixe nesta faixa */
  pressCost: number;
}

export const BANDS: BandDef[] = [
  { id: 1, label: 'NÍVEL 1', species: 'sardinha', y0: SURFACE_Y, y1: 802, tint: 0x2f7fa6, pressCost: 6 },
  { id: 2, label: 'NÍVEL 2', species: 'tainha', y0: 802, y1: 1175, tint: 0x24678f, pressCost: 8 },
  { id: 3, label: 'NÍVEL 3', species: 'dourado', y0: 1175, y1: 1547, tint: 0x1a4f74, pressCost: 10 },
  { id: 4, label: 'NÍVEL 4', species: 'pintado', y0: 1547, y1: 1920, tint: 0x113a58, pressCost: 12 },
];

/** Janela do combo: apertos mais rápidos que isso mantêm a sequência. */
export const COMBO_WINDOW_MS = 200;
/** Ganho extra de fisgada por nível de combo. */
export const COMBO_STEP = 0.12;
export const COMBO_MAX = 8;
/** Bônus por segundo que sobrou no cronômetro ao alcançar a zona de bênção. */
export const SPEED_BONUS_PER_SEC = 40;

/** Posição da rede (aro/boca) quando está na superfície */
export const NET_SURFACE_Y = 600;
/** Posição da rede no fundo */
export const NET_BOTTOM_Y = 1840;
/** Linha da "zona de bênção" — chegar aqui antes do tempo = bônus + comemoração */
export const BONUS_Y = 800;
export const BONUS_POINTS = 500;
export const FULL_BONUS_POINTS = 800;

/** Tempo de puxada */
export const PULL_SECONDS = 15;
/** Quanto cada toque levanta a rede (0..1) */
export const PRESS_GAIN = 0.017;
/** Peso da rede: afunda sozinha por segundo */
export const SINK_PER_SEC = 0.018;
/** Quantos peixes cabem na tarrafa */
export const NET_CAPACITY = 12;

/** Progresso (0..1) em que a rede entra na zona de bênção */
export const P_BONUS = (NET_BOTTOM_Y - BONUS_Y) / (NET_BOTTOM_Y - NET_SURFACE_Y);

/** Nome máximo */
export const NAME_MAX = 12;

export const STORAGE_KEY = 'pdh.rank.v1';
export const RANK_SIZE = 8;

/** Volta ao standby depois do resultado */
export const RESULT_MS = 9000;
/** Sem interação no nome, volta ao standby */
export const NAME_IDLE_MS = 30000;
