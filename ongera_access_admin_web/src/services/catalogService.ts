import { extractList } from '../lib/extractList';
import { apiFetch, apiUploadForm } from '../lib/apiClient';
import type { DifficultyLevel } from '../lib/difficulty';
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
  return extractList<ApiModule>(data);
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

export async function uploadVocabularyImage(token: string, file: File) {
  const formData = new FormData();
  formData.append('image', file);
  return apiUploadForm<ApiUploadImageResponse>('/api/v1/vocabulary/image', formData, { token });
}
