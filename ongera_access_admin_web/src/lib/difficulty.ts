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
  const normalized = normalizeDifficultyLevel(level);
  return normalized ? LEVEL_TO_NUMBER[normalized] : 1;
}

export function readQuestionCount(
  counts: Record<string, number> | null | undefined,
  level: DifficultyLevel,
): number {
  if (!counts) return 0;
  const num = LEVEL_TO_NUMBER[level];
  return counts[level] ?? counts[String(num)] ?? counts[level.toLowerCase()] ?? 0;
}
