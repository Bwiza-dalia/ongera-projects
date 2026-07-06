import { asArray, extractList } from '../lib/extractList';
import { apiFetch } from '../lib/apiClient';
import { levelToDifficultyNumber, type DifficultyLevel } from '../lib/difficulty';
import type {
  ApiExercise,
  ApiExerciseDetail,
  ApiModule,
  ApiModuleWithExercises,
  ApiQuestion,
  ApiVocabularyItem,
} from '../types/api';

export type ModuleType = 'SPEECH_AND_LANGUAGE' | 'COGNITION' | 'MOTION';
export type { DifficultyLevel };

export async function listModules(token: string) {
  return asArray(await apiFetch<ApiModule[]>('/api/v1/modules', { token }));
}

export async function getModule(token: string, moduleId: string) {
  return apiFetch<ApiModuleWithExercises>(`/api/v1/modules/${moduleId}`, { token });
}

export async function createModule(
  token: string,
  payload: { name: string; type: ModuleType; description?: string },
) {
  return apiFetch<ApiModule>('/api/v1/modules', {
    method: 'POST',
    token,
    json: payload,
  });
}

export async function createExercise(
  token: string,
  moduleId: string,
  payload: {
    name: string;
    description?: string;
    distractor_count: number;
    distractor_field: string;
  },
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
  const difficultyNumber = levelToDifficultyNumber(difficulty);
  return asArray(
    await apiFetch<ApiQuestion[]>(
      `/api/v1/exercises/${exerciseId}/questions?difficulty=${difficultyNumber}`,
      { token },
    ),
  );
}

export async function createQuestion(
  token: string,
  exerciseId: string,
  payload: {
    difficulty_level: number;
    target_item_id: string;
    distractor_item_ids: string[];
  },
) {
  return apiFetch<ApiQuestion>(`/api/v1/exercises/${exerciseId}/questions`, {
    method: 'POST',
    token,
    json: payload,
  });
}

export async function listVocabulary(token: string, difficulty?: number) {
  const query = difficulty ? `?difficulty=${difficulty}` : '';
  const data = await apiFetch<unknown>(`/api/v1/vocabulary${query}`, { token });
  const items = extractList<ApiVocabularyItem>(data);

  if (difficulty != null) {
    return items.filter((item) => (item.difficulty_level ?? 1) === difficulty);
  }

  return items;
}

export async function createVocabularyItem(
  token: string,
  payload: {
    word: string;
    english_translation: string;
    difficulty_level: number;
    semantic_hint?: string;
    phonemic_hint?: string;
    syllable_breakdown?: string;
    audio_model_url?: string;
    image_url?: string;
  },
) {
  return apiFetch<ApiVocabularyItem>('/api/v1/vocabulary', {
    method: 'POST',
    token,
    json: payload,
  });
}
