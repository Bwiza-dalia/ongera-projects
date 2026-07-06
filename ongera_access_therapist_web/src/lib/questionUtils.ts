import type { ApiQuestion } from '../types/api';

export function questionPreview(question: ApiQuestion): string {
  if (question.target_item?.word) {
    const distractors = question.distractors?.map((item) => item.word).filter(Boolean);
    if (distractors?.length) {
      return `${question.target_item.word} · distractors: ${distractors.join(', ')}`;
    }
    return question.target_item.word;
  }

  if (question.target_item_id) {
    return `Target item ${question.target_item_id.slice(0, 8)}…`;
  }

  const content = question.content;
  if (content?.cues?.[0]) return content.cues[0];
  if (content?.answer) return content.answer;
  if (content?.options?.[0]?.text) return content.options[0].text;
  return 'Question';
}

export function questionAnswerLabel(question: ApiQuestion): string | null {
  if (question.target_item?.english_translation) {
    return question.target_item.english_translation;
  }
  if (question.target_item?.word) return question.target_item.word;
  return question.content?.answer ?? null;
}
