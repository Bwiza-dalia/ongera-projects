import { useId } from 'react';
import type { ApiQuestion, ApiVocabularyItem } from '../../types/api';
import {
  resolveQuestionDistractors,
  resolveQuestionTarget,
  questionVocabularyLookup,
} from '../../lib/questionVocabulary';

function formatCreatedAt(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function VocabThumb({
  item,
  size = 'md',
}: {
  item: ApiVocabularyItem;
  size?: 'sm' | 'md';
}) {
  if (item.image_url) {
    return (
      <img
        className={`exercise-q__thumb exercise-q__thumb--${size}`}
        src={item.image_url}
        alt=""
        loading="lazy"
      />
    );
  }

  return (
    <span
      className={`exercise-q__thumb exercise-q__thumb--${size} exercise-q__thumb--empty`}
      aria-hidden="true"
    >
      {item.audio_model_url ? '♪' : 'Aa'}
    </span>
  );
}

export function QuestionDetailCard({
  question,
  vocabulary,
  index,
  onPreview,
  onDelete,
  deleting = false,
}: {
  question: ApiQuestion;
  vocabulary: ApiVocabularyItem[];
  index?: number;
  onPreview?: (question: ApiQuestion) => void;
  onDelete?: (question: ApiQuestion) => void;
  deleting?: boolean;
}) {
  const titleId = useId();
  const lookup = questionVocabularyLookup(question, vocabulary);
  const target = resolveQuestionTarget(question, lookup);
  const distractors = resolveQuestionDistractors(question, lookup);
  const questionLabel = index != null ? `Question ${index}` : 'Question';
  const targetLabel = target
    ? `${target.word}${target.english_translation ? ` (${target.english_translation})` : ''}`
    : 'Unknown target';

  return (
    <li className="exercise-q">
      <article className="exercise-q__card" aria-labelledby={titleId}>
        <header className="exercise-q__header">
          <div className="exercise-q__heading">
            <h3 id={titleId} className="exercise-q__title">
              {questionLabel}
            </h3>
            <p className="exercise-q__summary">
              <span className="admin-page__sr-only">Correct answer: </span>
              {targetLabel}
            </p>
          </div>
          <div className="exercise-q__actions">
            {onPreview && (
              <button
                type="button"
                className="exercise-q__action"
                onClick={() => onPreview(question)}
                disabled={deleting}
                aria-label={`Preview ${questionLabel}`}
              >
                Preview
              </button>
            )}
            {onPreview && onDelete && (
              <span className="exercise-q__sep" aria-hidden="true">
                |
              </span>
            )}
            {onDelete && (
              <button
                type="button"
                className="exercise-q__action exercise-q__action--danger"
                onClick={() => onDelete(question)}
                disabled={deleting}
                aria-label={deleting ? `Deleting ${questionLabel}` : `Delete ${questionLabel}`}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        </header>

        {target ? (
          <div className="exercise-q__target">
            <VocabThumb item={target} size="md" />
            <div className="exercise-q__target-body">
              <p className="exercise-q__role">Correct answer</p>
              <p className="exercise-q__word">{target.word}</p>
              {target.english_translation ? (
                <p className="exercise-q__english">{target.english_translation}</p>
              ) : null}
              {target.audio_model_url ? (
                <audio
                  controls
                  preload="none"
                  src={target.audio_model_url}
                  className="exercise-q__audio"
                >
                  Your browser does not support audio playback.
                </audio>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="exercise-q__missing" role="status">
            Correct answer could not be loaded.
          </p>
        )}

        {distractors.length > 0 && (
          <section className="exercise-q__distractors" aria-label={`Wrong answers for ${questionLabel}`}>
            <h4 className="exercise-q__distractors-title">
              Wrong answers ({distractors.length})
            </h4>
            <ul className="exercise-q__distractor-list">
              {distractors.map((item) => (
                <li key={item.id} className="exercise-q__distractor">
                  <VocabThumb item={item} size="sm" />
                  <div>
                    <p className="exercise-q__distractor-word">{item.word}</p>
                    {item.english_translation ? (
                      <p className="exercise-q__distractor-english">{item.english_translation}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {question.created_at ? (
          <p className="exercise-q__meta">
            <span className="admin-page__sr-only">Created </span>
            <time dateTime={question.created_at}>{formatCreatedAt(question.created_at)}</time>
          </p>
        ) : null}
      </article>
    </li>
  );
}
