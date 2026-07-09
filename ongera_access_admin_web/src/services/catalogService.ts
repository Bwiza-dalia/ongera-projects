import { asArray, extractList } from '../lib/extractList';
import { apiFetch } from '../lib/apiClient';
import type { DifficultyLevel } from '../lib/difficulty';
import type {
  ApiExercise,
  ApiExerciseDetail,
  ApiModule,
  ApiModuleWithExercises,
  ApiQuestion,
  ApiVocabularyItem,
  CreateExercisePayload,
  CreateModulePayload,
  CreateQuestionPayload,
  CreateVocabularyPayload,
  DistractorField,
} from '../types/api';

export type { DifficultyLevel, DistractorField };

export async function listModules(token: string) {
  return asArray(await apiFetch<ApiModule[]>('/api/v1/modules', { token }));
}

export async function getModule(token: string, moduleId: string) {
  return apiFetch<ApiModuleWithExercises>(`/api/v1/modules/${moduleId}`, { token });
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
