import { isApiEnabled } from '../config/api';
import { mockModuleCatalog } from '../data/mockModules';
import { asArray } from '../lib/asArray';
import {
  difficultyNumberToLevel,
  readQuestionCount,
  levelToDifficultyNumber,
  totalQuestionCount,
} from '../lib/difficulty';
import type { PlanDifficulty } from '../types/carePlan';
import { apiFetch } from '../lib/apiClient';
import type { ApiExercise, ApiExerciseDetail, ApiModule, ApiModuleWithExercises, ApiQuestion } from '../types/api';
import type {
  Difficulty,
  ModuleCatalog,
  ModuleExercise,
  ModuleLevel,
  TherapyDomain,
  TherapyDomainId,
  TherapyModule,
} from '../types/modules';

const DOMAIN_META: Record<
  TherapyDomainId,
  { id: TherapyDomainId; name: string; description: string }
> = {
  speech: {
    id: 'speech',
    name: 'Speech & Language',
    description: 'Naming, repetition, and expressive language recovery.',
  },
  cognitive: {
    id: 'cognitive',
    name: 'Cognitive',
    description: 'Memory, attention, and problem-solving exercises.',
  },
  motion: {
    id: 'motion',
    name: 'Motion',
    description: 'Movement, coordination, and motor recovery activities.',
  },
};

const TYPE_ALIASES: Record<string, TherapyDomainId> = {
  SPEECH_AND_LANGUAGE: 'speech',
  SPEECH: 'speech',
  LANGUAGE: 'speech',
  COGNITION: 'cognitive',
  COGNITIVE: 'cognitive',
  MOTION: 'motion',
  MOTOR: 'motion',
};

const DIFFICULTY_ORDER = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

const LEVEL_TO_NUMBER: Record<(typeof DIFFICULTY_ORDER)[number], number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

const DIFFICULTY_MAP: Record<(typeof DIFFICULTY_ORDER)[number], Difficulty> = {
  BEGINNER: 'easy',
  INTERMEDIATE: 'medium',
  ADVANCED: 'hard',
};

function normalizeType(raw: string | undefined) {
  return (raw ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function readModuleType(module: ApiModule) {
  return module.type ?? module.module_type;
}

function resolveDomainId(type: string | undefined): TherapyDomainId {
  const normalized = normalizeType(type);
  if (TYPE_ALIASES[normalized]) return TYPE_ALIASES[normalized];
  if (normalized.includes('SPEECH') || normalized.includes('LANGUAGE')) return 'speech';
  if (normalized.includes('COGNIT')) return 'cognitive';
  if (normalized.includes('MOTION') || normalized.includes('MOTOR')) return 'motion';
  return 'speech';
}

function extractModules(data: unknown): ApiModule[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['modules', 'data', 'items', 'results']) {
      const value = record[key];
      if (Array.isArray(value)) return value as ApiModule[];
    }
  }
  return [];
}

function exerciseCode(name: string, index: number) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || `E${index + 1}`;
}

function levelsFromQuestionCounts(counts: Record<string, number> | null | undefined): ModuleLevel[] {
  return DIFFICULTY_ORDER.map((key) => {
    const number = LEVEL_TO_NUMBER[key];
    return {
      id: String(number),
      difficulty: DIFFICULTY_MAP[key],
      label: String(number),
      questionCount: readQuestionCount(counts, key),
      sessions: [],
    };
  });
}

export function levelToApiDifficulty(levelId: string) {
  return levelToDifficultyNumber(levelId);
}

/** Difficulty levels that have questions for this exercise (falls back to all three). */
export function availablePlanLevels(exercise: ModuleExercise): PlanDifficulty[] {
  const withQuestions = exercise.levels
    .filter((level) => (level.questionCount ?? 0) > 0)
    .map((level) => difficultyNumberToLevel(level.id));

  if (withQuestions.length > 0) return withQuestions;
  return ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
}

export async function listExerciseQuestions(
  token: string,
  exerciseId: string,
  difficulty: string | number,
) {
  if (!isApiEnabled()) return [];

  const difficultyNumber =
    typeof difficulty === 'number' ? difficulty : levelToDifficultyNumber(String(difficulty));

  return asArray(
    await apiFetch<ApiQuestion[]>(
      `/api/v1/exercises/${exerciseId}/questions?difficulty=${difficultyNumber}`,
      { token },
    ),
  );
}

async function fetchQuestionCounts(
  token: string,
  exerciseId: string,
  existing?: Record<string, number> | null,
): Promise<Record<string, number>> {
  if (totalQuestionCount(existing) > 0) {
    return existing ?? {};
  }

  const counts: Record<string, number> = {};
  for (const difficulty of [1, 2, 3]) {
    const questions = await listExerciseQuestions(token, exerciseId, difficulty);
    counts[String(difficulty)] = questions.length;
  }
  return counts;
}

function mapExercise(exercise: ApiExercise, index: number): ModuleExercise {
  return {
    id: exercise.id,
    code: exerciseCode(exercise.name, index),
    name: exercise.name,
    description: exercise.description ?? 'No description yet.',
    levels: [],
  };
}

function mapModule(module: ApiModule, exercises: ApiExercise[] = []): TherapyModule {
  return {
    id: module.id,
    name: module.name,
    domain: resolveDomainId(readModuleType(module)),
    description: module.description ?? 'No description yet.',
    clinicalTarget: module.description ?? 'See module description.',
    exercises: exercises.map(mapExercise),
  };
}

function groupModulesIntoCatalog(modules: TherapyModule[]): ModuleCatalog {
  const grouped = new Map<TherapyDomainId, TherapyModule[]>();

  for (const mod of modules) {
    const list = grouped.get(mod.domain) ?? [];
    list.push(mod);
    grouped.set(mod.domain, list);
  }

  const domains: TherapyDomain[] = Object.values(DOMAIN_META).map((meta) => ({
    id: meta.id,
    name: meta.name,
    description: meta.description,
    modules: grouped.get(meta.id) ?? [],
  }));

  return { domains };
}

async function fetchModules(token: string) {
  return apiFetch<unknown>('/api/v1/modules', { token });
}

async function fetchModuleWithExercises(token: string, moduleId: string) {
  return apiFetch<ApiModuleWithExercises>(`/api/v1/modules/${moduleId}`, { token });
}

async function fetchExerciseDetail(token: string, exerciseId: string) {
  return apiFetch<ApiExerciseDetail>(`/api/v1/exercises/${exerciseId}`, { token });
}

async function enrichModuleSummaries(token: string, modules: ApiModule[]): Promise<TherapyModule[]> {
  return Promise.all(
    modules.map(async (summary) => {
      try {
        const detail = await fetchModuleWithExercises(token, summary.id);
        return mapModule({ ...summary, ...detail }, asArray(detail.exercises));
      } catch {
        return mapModule(summary);
      }
    }),
  );
}

export async function getModuleCatalog(token: string): Promise<ModuleCatalog> {
  if (!isApiEnabled()) {
    return mockModuleCatalog;
  }

  const listed = extractModules(await fetchModules(token));
  const modules = listed.length > 0 ? await enrichModuleSummaries(token, listed) : [];
  return groupModulesIntoCatalog(modules);
}

export async function getModule(token: string, moduleId: string): Promise<TherapyModule> {
  if (!isApiEnabled()) {
    for (const domain of mockModuleCatalog.domains) {
      const mod = domain.modules.find((m) => m.id === moduleId);
      if (mod) return mod;
    }
    throw new Error('Module not found');
  }

  const data = await fetchModuleWithExercises(token, moduleId);
  const exercises = asArray(data.exercises);
  const mod = mapModule(data, exercises);

  const enrichedExercises = await Promise.all(
    mod.exercises.map((exercise) => getExercise(token, exercise.id, exercise)),
  );

  return { ...mod, exercises: enrichedExercises };
}

export async function getExercise(
  token: string,
  exerciseId: string,
  fallback?: ModuleExercise,
): Promise<ModuleExercise> {
  if (!isApiEnabled()) {
    if (fallback) return fallback;
    throw new Error('Exercise not found');
  }

  const detail = await fetchExerciseDetail(token, exerciseId);
  const questionCounts = await fetchQuestionCounts(token, exerciseId, detail.question_counts);
  const levels = levelsFromQuestionCounts(questionCounts);

  return {
    id: detail.id,
    code: fallback?.code ?? exerciseCode(detail.name, 0),
    name: detail.name,
    description: detail.description ?? fallback?.description ?? 'No description yet.',
    mechanic: fallback?.mechanic,
    levels: levels.length > 0 ? levels : fallback?.levels ?? [],
  };
}

export async function enrichDomainModules(
  token: string,
  modules: TherapyModule[],
): Promise<TherapyModule[]> {
  if (!isApiEnabled()) return modules;

  return Promise.all(modules.map((mod) => getModule(token, mod.id)));
}

export function catalogTotals(catalog: ModuleCatalog) {
  const modules = catalog.domains.reduce((n, d) => n + d.modules.length, 0);
  const exercises = catalog.domains.reduce(
    (n, d) => n + d.modules.reduce((m, mod) => m + mod.exercises.length, 0),
    0,
  );
  return { modules, exercises };
}
