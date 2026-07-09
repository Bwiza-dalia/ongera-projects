import type { ApiQuestion, ApiVocabularyItem } from '../../types/api';
import {
  resolveQuestionDistractors,
  resolveQuestionTarget,
  questionVocabularyLookup,
} from '../../lib/questionVocabulary';

function VocabMediaPreview({ item }: { item: ApiVocabularyItem }) {
  const hasImage = Boolean(item.image_url);
  const hasAudio = Boolean(item.audio_model_url);

  if (!hasImage && !hasAudio) {
    return <p className="question-vocab-item__empty-media">No image or audio</p>;
  }

  return (
    <div className="question-vocab-item__media">
      {hasImage && (
        <a href={item.image_url} target="_blank" rel="noreferrer" className="question-vocab-item__image-link">
          <img
            src={item.image_url}
            alt={item.english_translation ?? item.word}
            className="question-vocab-item__image"
            loading="lazy"
          />
        </a>
      )}
      {hasAudio && (
        <audio controls preload="none" src={item.audio_model_url} className="question-vocab-item__audio">
          Your browser does not support audio playback.
        </audio>
      )}
    </div>
  );
}

function VocabItemDetail({
  item,
  role,
}: {
  item: ApiVocabularyItem;
  role: 'target' | 'distractor';
}) {
  return (
    <article className={`question-vocab-item question-vocab-item--${role}`}>
      <div className="question-vocab-item__header">
        <span className="question-vocab-item__badge">
          {role === 'target' ? 'Target' : 'Distractor'}
        </span>
        <div className="question-vocab-item__text">
          <p className="question-vocab-item__word">{item.word}</p>
          {item.english_translation && (
            <p className="question-vocab-item__english">{item.english_translation}</p>
          )}
        </div>
      </div>
      <VocabMediaPreview item={item} />
    </article>
  );
}

export function QuestionDetailCard({
  question,
  vocabulary,
  onPreview,
}: {
  question: ApiQuestion;
  vocabulary: ApiVocabularyItem[];
  onPreview?: (question: ApiQuestion) => void;
}) {
  const lookup = questionVocabularyLookup(question, vocabulary);
  const target = resolveQuestionTarget(question, lookup);
  const distractors = resolveQuestionDistractors(question, lookup);
  const level = question.difficulty_level ?? '—';

  return (
    <li className="admin-page__question-detail">
      <header className="admin-page__question-detail-header">
        <span className="admin-page__badge">Level {level}</span>
        <div className="admin-page__question-detail-header-right">
          {question.created_at && (
            <time className="admin-page__question-detail-date" dateTime={question.created_at}>
              {new Date(question.created_at).toLocaleString()}
            </time>
          )}
          {onPreview && (
            <button
              type="button"
              className="admin-page__btn admin-page__btn--small"
              onClick={() => onPreview(question)}
            >
              Preview
            </button>
          )}
        </div>
      </header>

      {target ? (
        <VocabItemDetail item={target} role="target" />
      ) : (
        <p className="admin-page__hint">Target item not found.</p>
      )}

      {distractors.length > 0 && (
        <section className="admin-page__question-distractors">
          <h3 className="admin-page__question-distractors-title">
            Distractors ({distractors.length})
          </h3>
          <div className="admin-page__question-distractors-grid">
            {distractors.map((item) => (
              <VocabItemDetail key={item.id} item={item} role="distractor" />
            ))}
          </div>
        </section>
      )}
    </li>
  );
}
