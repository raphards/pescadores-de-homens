import { RANK_SIZE, STORAGE_KEY } from './config';

export interface RankEntry {
  name: string;
  score: number;
  plays: number;
  last: number;
}

export interface AddScoreResult {
  entry: RankEntry;
  total: number;
  position: number;
  isNew: boolean;
  isRecord: boolean;
  previousBest: number;
}

export function normalizeName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, 12);
}

export function loadRank(): RankEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.name === 'string' && typeof e.score === 'number')
      .map((e) => ({
        name: normalizeName(e.name),
        score: Math.max(0, Math.round(e.score)),
        plays: Math.max(1, Math.round(e.plays ?? 1)),
        last: Number(e.last) || 0,
      }))
      .sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

function saveRank(list: RankEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* modo privado / sem storage: segue sem persistir */
  }
}

export function findEntry(name: string): RankEntry | undefined {
  const n = normalizeName(name);
  return loadRank().find((e) => e.name === n);
}

export function addScore(name: string, points: number): AddScoreResult {
  const n = normalizeName(name);
  const list = loadRank();
  const existing = list.find((e) => e.name === n);
  const previousBest = existing ? existing.score : 0;
  const isNew = !existing;

  let entry: RankEntry;
  if (existing) {
    existing.score += Math.max(0, Math.round(points));
    existing.plays += 1;
    existing.last = Date.now();
    entry = existing;
  } else {
    entry = {
      name: n,
      score: Math.max(0, Math.round(points)),
      plays: 1,
      last: Date.now(),
    };
    list.push(entry);
  }

  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 50);
  saveRank(trimmed);

  const position = trimmed.findIndex((e) => e.name === n) + 1;
  return {
    entry,
    total: entry.score,
    position,
    isNew,
    isRecord: existing ? entry.score > previousBest : true,
    previousBest,
  };
}

export function topRank(n = RANK_SIZE): RankEntry[] {
  return loadRank().slice(0, n);
}

export function clearRank(): void {
  saveRank([]);
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}
