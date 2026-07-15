import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApiQuestion, ApiVocabularyItem } from '../../types/api';
import {
  questionVocabularyLookup,
  resolveDistractorIds,
  resolveQuestionDistractors,
  resolveQuestionTarget,
} from '../../lib/questionVocabulary';
import { useAuth } from '../../context/AuthContext';
import { getVocabularyItem } from '../../services/catalogService';

/** Deterministic shuffle so the option order is stable while the modal is open. */
function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    const j = hash % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function OptionCard({
  item,
  isTarget,
  selected,
  revealed,
  onSelect,
}: {
  item: ApiVocabularyItem;
  isTarget: boolean;
  selected: boolean;
  revealed: boolean;
  onSelect: () => void;
}) {
  const stateClass = revealed
    ? isTarget
      ? 'question-preview__option--correct'
      : selected
        ? 'question-preview__option--wrong'
        : ''
    : selected
      ? 'question-preview__option--selected'
      : '';

  return (
    <button
      type="button"
      className={`question-preview__option ${stateClass}`}
      onClick={onSelect}
    >
      <div className="question-preview__option-image">
        {item.image_url ? (
          <img src={item.image_url} alt={item.english_translation ?? item.word} loading="lazy" />
        ) : (
          <span className="question-preview__option-noimage">No image</span>
        )}
      </div>
      {revealed && isTarget && <span className="question-preview__option-tag">✓ Correct</span>}
      {revealed && !isTarget && selected && (
        <span className="question-preview__option-tag question-preview__option-tag--wrong">
          Chosen
        </span>
      )}
    </button>
  );
}

export function QuestionPreviewModal({
  question,
  vocabulary,
  onClose,
}: {
  question: ApiQuestion;
  vocabulary: ApiVocabularyItem[];
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [fetchedItems, setFetchedItems] = useState<ApiVocabularyItem[]>([]);

  const combinedVocabulary = useMemo(
    () => [...vocabulary, ...fetchedItems],
    [vocabulary, fetchedItems],
  );

  const lookup = useMemo(
    () => questionVocabularyLookup(question, combinedVocabulary),
    [question, combinedVocabulary],
  );
  const target = useMemo(() => resolveQuestionTarget(question, lookup), [question, lookup]);
  const distractors = useMemo(
    () => resolveQuestionDistractors(question, lookup),
    [question, lookup],
  );

  // Fetch any distractor/target items that aren't already in the loaded vocabulary.
  useEffect(() => {
    if (!token) return;
    const needed = new Set<string>(resolveDistractorIds(question));
    if (question.target_item_id && !question.target_item) needed.add(question.target_item_id);

    const missing = [...needed].filter((id) => !lookup.has(id));
    if (missing.length === 0) return;

    let active = true;
    Promise.all(missing.map((id) => getVocabularyItem(token, id).catch(() => null))).then(
      (items) => {
        if (!active) return;
        const resolved = items.filter((i): i is ApiVocabularyItem => Boolean(i));
        if (resolved.length > 0) setFetchedItems((prev) => [...prev, ...resolved]);
      },
    );
    return () => {
      active = false;
    };
  }, [token, question, lookup]);

  const options = useMemo(() => {
    const all = target ? [target, ...distractors] : distractors;
    return shuffleWithSeed(all, question.id);
  }, [target, distractors, question.id]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSelect(id: string) {
    if (revealed) return;
    setSelectedId(id);
    setRevealed(true);
  }

  function reset() {
    setSelectedId(null);
    setRevealed(false);
  }

  function playAudio() {
    audioRef.current?.play().catch(() => {
      /* autoplay/permission ignored */
    });
  }

  return (
    <div
      className="question-preview__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Patient preview"
      onClick={onClose}
    >
      <div className="question-preview" onClick={(e) => e.stopPropagation()}>
        <header className="question-preview__bar">
          <div>
            <p className="question-preview__bar-eyebrow">Patient preview</p>
            <p className="question-preview__bar-title">How the patient sees this question</p>
          </div>
          <button
            type="button"
            className="question-preview__close"
            onClick={onClose}
            aria-label="Close preview"
          >
            ×
          </button>
        </header>

        <div className="question-preview__screen">
          <div className="question-preview__prompt">
            <div className="question-preview__avatar" aria-hidden="true">
              🧑🏾‍🌾
            </div>
            <div className="question-preview__bubble">
              <p className="question-preview__bubble-text">Ni iki? (What is this?)</p>
              {target?.audio_model_url ? (
                <>
                  <button type="button" className="question-preview__listen" onClick={playAudio}>
                    🔊 Listen
                  </button>
                  <audio ref={audioRef} src={target.audio_model_url} preload="none" />
                </>
              ) : (
                <p className="question-preview__no-audio">No audio on target word</p>
              )}
            </div>
          </div>

          <p className="question-preview__instruction">
            Tap the picture that matches the word.
          </p>

          {options.length === 0 ? (
            <p className="question-preview__empty">
              No target or distractors resolved for this question.
            </p>
          ) : (
            <div className="question-preview__options">
              {options.map((item) => (
                <OptionCard
                  key={item.id}
                  item={item}
                  isTarget={item.id === target?.id}
                  selected={selectedId === item.id}
                  revealed={revealed}
                  onSelect={() => handleSelect(item.id)}
                />
              ))}
            </div>
          )}

          {revealed && target && (
            <div className="question-preview__answer">
              <p className="question-preview__answer-label">Correct answer</p>
              <p className="question-preview__answer-word">
                {target.word}
                {target.english_translation ? ` — ${target.english_translation}` : ''}
              </p>
              <button type="button" className="question-preview__reset" onClick={reset}>
                Try again
              </button>
            </div>
          )}
        </div>

        <footer className="question-preview__footer">
          <span className="question-preview__footer-note">
            Preview only. Patients see options in random order.
          </span>
        </footer>
      </div>
    </div>
  );
}
