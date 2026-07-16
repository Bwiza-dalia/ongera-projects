export const DIFFICULTY_LEVELS = [1, 2, 3] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

const LEGACY_NAME_TO_NUMBER: Record<string, DifficultyLevel> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

export function levelLabel(level: DifficultyLevel | string | number) {
  const normalized = normalizeDifficultyLevel(level);
  return normalized != null ? String(normalized) : String(level);
}

export function normalizeDifficultyLevel(
  value: string | number | undefined,
): DifficultyLevel | null {
  if (value == null) return null;
  if (typeof value === 'number' && value >= 1 && value <= 3) {
    return value as DifficultyLevel;
  }

  const upper = String(value).trim().toUpperCase();
  const fromLegacy = LEGACY_NAME_TO_NUMBER[upper];
  if (fromLegacy) return fromLegacy;

  const levelMatch = upper.match(/^LEVEL[_\s-]?([1-3])$/);
  if (levelMatch) return Number(levelMatch[1]) as DifficultyLevel;

  const asNum = Number(upper);
  if (asNum >= 1 && asNum <= 3) return asNum as DifficultyLevel;

  return null;
}

export function levelToDifficultyNumber(level: string | number): number {
  return normalizeDifficultyLevel(level) ?? 1;
}

/** Normalize API count maps that may use 1/2/3, BEGINNER, or level_1 keys. */
export function normalizeQuestionCounts(
  counts: Record<string, number> | null | undefined,
): Record<string, number> {
  if (!counts) return {};

  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(counts)) {
    if (typeof value !== 'number' || Number.isNaN(value)) continue;
    const level = normalizeDifficultyLevel(key);
    if (level == null) continue;
    normalized[String(level)] = (normalized[String(level)] ?? 0) + value;
  }
  return normalized;
}

export function readQuestionCount(
  counts: Record<string, number> | null | undefined,
  level: DifficultyLevel,
  fallback = 0,
): number {
  const normalized = normalizeQuestionCounts(counts);
  return normalized[String(level)] ?? fallback;
}

export function totalQuestionCount(counts: Record<string, number> | null | undefined): number {
  return Object.values(normalizeQuestionCounts(counts)).reduce((sum, count) => sum + count, 0);
}

/** First difficulty level that has questions, or null if none. */
export function firstLevelWithQuestions(
  counts: Record<string, number> | null | undefined,
): DifficultyLevel | null {
  for (const level of DIFFICULTY_LEVELS) {
    if (readQuestionCount(counts, level) > 0) return level;
  }
  return null;
}
