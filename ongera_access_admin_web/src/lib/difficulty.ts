export const DIFFICULTY_LEVELS = [1, 2, 3] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

const LEGACY_NAME_TO_NUMBER: Record<string, DifficultyLevel> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

const NUMBER_TO_LEGACY_NAME: Record<DifficultyLevel, string> = {
  1: 'BEGINNER',
  2: 'INTERMEDIATE',
  3: 'ADVANCED',
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

  const asNum = Number(upper);
  if (asNum >= 1 && asNum <= 3) return asNum as DifficultyLevel;

  return null;
}

export function levelToDifficultyNumber(level: string | number): number {
  return normalizeDifficultyLevel(level) ?? 1;
}

export function readQuestionCount(
  counts: Record<string, number> | null | undefined,
  level: DifficultyLevel,
  fallback = 0,
): number {
  if (!counts) return fallback;

  const legacyName = NUMBER_TO_LEGACY_NAME[level];
  const candidates = [
    counts[String(level)],
    counts[level],
    counts[legacyName],
    counts[legacyName.toLowerCase()],
    counts[`level_${level}`],
  ];

  for (const value of candidates) {
    if (typeof value === 'number') return value;
  }

  return fallback;
}
