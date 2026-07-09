import type { ApiQuestion, ApiVocabularyItem } from '../types/api';

function isVocabItem(value: unknown): value is ApiVocabularyItem {
  return Boolean(
    value && typeof value === 'object' && 'id' in value && 'word' in (value as object),
  );
}

export function questionVocabularyLookup(
  question: ApiQuestion,
  vocabulary: ApiVocabularyItem[],
): Map<string, ApiVocabularyItem> {
  const map = new Map<string, ApiVocabularyItem>();

  if (question.target_item) {
    map.set(question.target_item.id, question.target_item);
  }

  for (const item of question.distractors ?? []) {
    if (isVocabItem(item)) map.set(item.id, item);
  }

  for (const item of vocabulary) {
    if (!map.has(item.id)) map.set(item.id, item);
  }

  return map;
}

export function resolveQuestionTarget(
  question: ApiQuestion,
  lookup: Map<string, ApiVocabularyItem>,
): ApiVocabularyItem | null {
  if (question.target_item) return question.target_item;
  if (question.target_item_id) return lookup.get(question.target_item_id) ?? null;
  return null;
}

/** Collects distractor IDs regardless of whether the API embeds objects, ID strings, or a separate field. */
export function resolveDistractorIds(question: ApiQuestion): string[] {
  const ids = new Set<string>();

  for (const item of question.distractors ?? []) {
    if (typeof item === 'string') ids.add(item);
    else if (isVocabItem(item)) ids.add(item.id);
  }

  for (const id of question.distractor_item_ids ?? []) {
    if (id) ids.add(id);
  }

  return [...ids];
}

export function resolveQuestionDistractors(
  question: ApiQuestion,
  lookup: Map<string, ApiVocabularyItem>,
): ApiVocabularyItem[] {
  // Prefer fully embedded objects when present.
  const embedded = (question.distractors ?? []).filter(isVocabItem);
  if (embedded.length > 0) return embedded;

  // Otherwise resolve IDs (from `distractors` strings or `distractor_item_ids`) via the lookup.
  return resolveDistractorIds(question)
    .map((id) => lookup.get(id))
    .filter((item): item is ApiVocabularyItem => Boolean(item));
}
