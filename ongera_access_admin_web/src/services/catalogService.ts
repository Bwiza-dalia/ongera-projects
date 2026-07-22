import { asArray } from '../lib/asArray';
import { extractList } from '../lib/extractList';
import { apiFetch, apiUploadForm } from '../lib/apiClient';
import {
  DIFFICULTY_LEVELS,
  totalQuestionCount,
  type DifficultyLevel,
} from '../lib/difficulty';
import {
  groupModulesByDomain,
  toCatalogModuleRow,
  type CatalogModuleRow,
  type TherapyDomainCatalog,
} from '../lib/therapyDomains';
import type {
  ApiExercise,
  ApiExerciseDetail,
  ApiModule,
  ApiModuleWithExercises,
  ApiQuestion,
  ApiUploadImageResponse,
  ApiVocabularyItem,
  CreateExercisePayload,
  CreateModulePayload,
  CreateQuestionPayload,
  CreateVocabularyPayload,
  DistractorField,
} from '../types/api';

export type { DifficultyLevel, DistractorField };

/** Same unwrap order as therapist portal moduleService.extractModules. */
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

/** Human-friendly labels for the answer type patients choose from. */
export const DISTRACTOR_FIELD_OPTIONS: { value: DistractorField; label: string }[] = [
  { value: 'image_url', label: 'Picture' },
  { value: 'word', label: 'Kinyarwanda word' },
  { value: 'english_translation', label: 'English word' },
  { value: 'audio_model_url', label: 'Audio' },
];

export function distractorFieldLabel(field: DistractorField | string): string {
  return DISTRACTOR_FIELD_OPTIONS.find((option) => option.value === field)?.label ?? field;
}

export async function listModules(token: string) {
  const data = await apiFetch<unknown>('/api/v1/modules', { token });
  return extractModules(data);
}

export async function getModule(token: string, moduleId: string) {
  return apiFetch<ApiModuleWithExercises>(`/api/v1/modules/${moduleId}`, { token });
}

async function fetchQuestionTotal(
  token: string,
  exerciseId: string,
  existing?: Record<string, number> | null,
): Promise<number> {
  const fromCounts = totalQuestionCount(existing);
  if (fromCounts > 0) return fromCounts;

  const perLevel = await Promise.all(
    DIFFICULTY_LEVELS.map(async (level) => {
      try {
        const questions = await listQuestions(token, exerciseId, level);
        return questions.length;
      } catch {
        return 0;
      }
    }),
  );
  return perLevel.reduce((sum, n) => sum + n, 0);
}

/**
 * Therapist-style module load: GET /modules/:id, attach exercises, enrich question totals.
 */
export async function getModuleWithExercises(
  token: string,
  moduleId: string,
): Promise<CatalogModuleRow> {
  const detail = await getModule(token, moduleId);
  const row = toCatalogModuleRow(detail, detail);
  const exercises = asArray(detail.exercises);

  const exerciseQuestionTotals: Record<string, number> = {};
  await Promise.all(
    exercises.map(async (exercise) => {
      try {
        const exerciseDetail = await getExercise(token, exercise.id);
        exerciseQuestionTotals[exercise.id] = await fetchQuestionTotal(
          token,
          exercise.id,
          exerciseDetail.question_counts,
        );
      } catch {
        exerciseQuestionTotals[exercise.id] = 0;
      }
    }),
  );

  return {
    ...row,
    exercises,
    exerciseCount: exercises.length,
    exerciseQuestionTotals,
  };
}

async function enrichModuleSummaries(token: string, modules: ApiModule[]): Promise<CatalogModuleRow[]> {
  return Promise.all(
    modules.map(async (summary) => {
      try {
        const detail = await getModule(token, summary.id);
        return toCatalogModuleRow(summary, detail);
      } catch {
        return toCatalogModuleRow(summary);
      }
    }),
  );
}

/** Therapist `getModuleCatalog`: list modules → enrich exercises → group into 3 domains. */
export async function getModuleCatalog(token: string): Promise<TherapyDomainCatalog[]> {
  const listed = await listModules(token);
  const modules = listed.length > 0 ? await enrichModuleSummaries(token, listed) : [];
  return groupModulesByDomain(modules);
}

/** Therapist `enrichDomainModules`: re-fetch each module and enrich exercise question totals. */
export async function enrichDomainModules(
  token: string,
  modules: CatalogModuleRow[],
): Promise<CatalogModuleRow[]> {
  return Promise.all(modules.map((mod) => getModuleWithExercises(token, mod.id)));
}

export async function createModule(token: string, payload: CreateModulePayload) {
  return apiFetch<ApiModule>('/api/v1/modules', {
    method: 'POST',
    token,
    json: payload,
  });
}

export async function createExercise(
  token: string,
  moduleId: string,
  payload: CreateExercisePayload,
) {
  return apiFetch<ApiExercise>(`/api/v1/modules/${moduleId}/exercises`, {
    method: 'POST',
    token,
    json: payload,
  });
}

export async function deleteExercise(token: string, exerciseId: string) {
  return apiFetch<void>(`/api/v1/exercises/${exerciseId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getExercise(token: string, exerciseId: string) {
  return apiFetch<ApiExerciseDetail>(`/api/v1/exercises/${exerciseId}`, { token });
}

export async function listQuestions(
  token: string,
  exerciseId: string,
  difficulty: DifficultyLevel,
) {
  const data = await apiFetch<unknown>(
    `/api/v1/exercises/${exerciseId}/questions?difficulty=${difficulty}`,
    { token },
  );
  return extractList<ApiQuestion>(data);
}

export async function getQuestion(token: string, questionId: string) {
  return apiFetch<ApiQuestion>(`/api/v1/questions/${questionId}`, { token });
}

export async function createQuestion(
  token: string,
  exerciseId: string,
  payload: CreateQuestionPayload,
) {
  return apiFetch<ApiQuestion>(`/api/v1/exercises/${exerciseId}/questions`, {
    method: 'POST',
    token,
    json: payload,
  });
}

export async function deleteQuestion(token: string, questionId: string) {
  return apiFetch<void>(`/api/v1/questions/${questionId}`, {
    method: 'DELETE',
    token,
  });
}

export async function listVocabulary(token: string, difficulty?: DifficultyLevel) {
  const query = difficulty != null ? `?difficulty=${difficulty}` : '';
  const data = await apiFetch<unknown>(`/api/v1/vocabulary${query}`, { token });
  return extractList<ApiVocabularyItem>(data);
}

export async function getVocabularyItem(token: string, vocabularyId: string) {
  return apiFetch<ApiVocabularyItem>(`/api/v1/vocabulary/${vocabularyId}`, { token });
}

export async function createVocabularyItem(token: string, payload: CreateVocabularyPayload) {
  return apiFetch<ApiVocabularyItem>('/api/v1/vocabulary', {
    method: 'POST',
    token,
    json: payload,
  });
}

export async function uploadVocabularyImage(token: string, file: File) {
  const formData = new FormData();
  formData.append('image', file);
  return apiUploadForm<ApiUploadImageResponse>('/api/v1/vocabulary/image', formData, { token });
}
