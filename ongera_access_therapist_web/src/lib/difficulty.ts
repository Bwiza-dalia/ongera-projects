export const DIFFICULTY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

const LEVEL_TO_NUMBER: Record<DifficultyLevel, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

const NUMBER_TO_LEVEL: Record<number, DifficultyLevel> = {
  1: 'BEGINNER',
  2: 'INTERMEDIATE',
  3: 'ADVANCED',
};

export function levelLabel(level: DifficultyLevel | string) {
  const normalized = normalizeDifficultyLevel(level);
  if (!normalized) return String(level);
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

export function normalizeDifficultyLevel(value: string | number | undefined): DifficultyLevel | null {
  if (value == null) return null;
  if (typeof value === 'number') return NUMBER_TO_LEVEL[value] ?? null;
  const upper = String(value).trim().toUpperCase();
  if (upper === 'BEGINNER' || upper === 'INTERMEDIATE' || upper === 'ADVANCED') {
    return upper;
  }
  const asNum = Number(upper);
  return NUMBER_TO_LEVEL[asNum] ?? null;
}

export function levelToDifficultyNumber(level: string): number {
  const trimmed = level.trim().toLowerCase();
  const legacy: Record<string, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };
  if (legacy[trimmed] != null) return legacy[trimmed];

  const asNum = Number(trimmed);
  if (asNum >= 1 && asNum <= 3) return asNum;

  const normalized = normalizeDifficultyLevel(level);
  return normalized ? LEVEL_TO_NUMBER[normalized] : 1;
}

export function difficultyNumberToLevel(value: number | string | undefined): DifficultyLevel {
  const num = typeof value === 'number' ? value : Number(value);
  return NUMBER_TO_LEVEL[num] ?? 'BEGINNER';
}

export function readQuestionCount(
  counts: Record<string, number> | null | undefined,
  level: DifficultyLevel,
): number {
  const normalized = normalizeQuestionCounts(counts);
  const num = LEVEL_TO_NUMBER[level];
  return normalized[String(num)] ?? 0;
}

export function normalizeQuestionCounts(
  counts: Record<string, number> | null | undefined,
): Record<string, number> {
  if (!counts) return {};

  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(counts)) {
    if (typeof value !== 'number' || Number.isNaN(value)) continue;
    const num = levelToDifficultyNumber(key);
    normalized[String(num)] = (normalized[String(num)] ?? 0) + value;
  }
  return normalized;
}

export function totalQuestionCount(counts: Record<string, number> | null | undefined): number {
  return Object.values(normalizeQuestionCounts(counts)).reduce((sum, count) => sum + count, 0);
}
