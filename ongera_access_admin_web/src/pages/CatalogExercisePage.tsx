import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DIFFICULTY_LEVELS, levelLabel, levelToDifficultyNumber, readQuestionCount } from '../lib/difficulty';
import { questionAnswerLabel, questionPreview } from '../lib/questionUtils';
import { useAuth } from '../context/AuthContext';
import {
  createQuestion,
  createVocabularyItem,
  getExercise,
  listQuestions,
  listVocabulary,
  type DifficultyLevel,
} from '../services/catalogService';
import type { ApiExerciseDetail, ApiQuestion, ApiVocabularyItem } from '../types/api';
import '../styles/admin-page.css';

export function CatalogExercisePage() {
  const { moduleId, exerciseId } = useParams<{ moduleId: string; exerciseId: string }>();
  const { token } = useAuth();
  const [exercise, setExercise] = useState<ApiExerciseDetail | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(null);
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [vocabulary, setVocabulary] = useState<ApiVocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [targetItemId, setTargetItemId] = useState('');
  const [distractorIds, setDistractorIds] = useState<string[]>([]);
  const [quickWord, setQuickWord] = useState('');
  const [quickEnglish, setQuickEnglish] = useState('');
  const [addingVocab, setAddingVocab] = useState(false);

  const loadExercise = useCallback(async () => {
    if (!token || !exerciseId) return;
    setLoading(true);
    setError('');
    try {
      setExercise(await getExercise(token, exerciseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercise');
    } finally {
      setLoading(false);
    }
  }, [token, exerciseId]);

  const loadVocabulary = useCallback(async () => {
    if (!token || !selectedLevel) {
      setVocabulary([]);
      return;
    }
    try {
      setVocabulary(await listVocabulary(token, levelToDifficultyNumber(selectedLevel)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary');
      setVocabulary([]);
    }
  }, [token, selectedLevel]);

  const loadQuestions = useCallback(async () => {
    if (!token || !exerciseId || !selectedLevel) {
      setQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    try {
      setQuestions(await listQuestions(token, exerciseId, selectedLevel));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }, [token, exerciseId, selectedLevel]);

  useEffect(() => {
    loadExercise();
  }, [loadExercise]);

  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const vocabOptions = useMemo(
    () => vocabulary.filter((item) => item.id !== targetItemId),
    [vocabulary, targetItemId],
  );

  function selectLevel(level: DifficultyLevel) {
    setSelectedLevel(level);
    setSuccess('');
    setError('');
    setTargetItemId('');
    setDistractorIds([]);
  }

  function toggleDistractor(id: string) {
    setDistractorIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  }

  async function handleQuickAddVocab(e: FormEvent) {
    e.preventDefault();
    if (!token || !selectedLevel) return;
    setAddingVocab(true);
    setError('');
    setSuccess('');
    try {
      const created = await createVocabularyItem(token, {
        word: quickWord.trim(),
        english_translation: quickEnglish.trim(),
        difficulty_level: levelToDifficultyNumber(selectedLevel),
      });
      setQuickWord('');
      setQuickEnglish('');
      setSuccess(`Added "${created.word}" to ${levelLabel(selectedLevel)} vocabulary.`);
      await loadVocabulary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vocabulary');
    } finally {
      setAddingVocab(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !exerciseId || !selectedLevel) return;
    if (!targetItemId) {
      setError('Select a target vocabulary item.');
      return;
    }
    if (distractorIds.length === 0) {
      setError(
        vocabOptions.length === 0
          ? 'Add at least one more word at this level — the target cannot be its own distractor.'
          : 'Select at least one distractor.',
      );
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await createQuestion(token, exerciseId, {
        difficulty_level: levelToDifficultyNumber(selectedLevel),
        target_item_id: targetItemId,
        distractor_item_ids: distractorIds,
      });

      setSuccess(`Question added to ${levelLabel(selectedLevel)}.`);
      setTargetItemId('');
      setDistractorIds([]);
      await Promise.all([loadExercise(), loadQuestions()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  }

  if (!moduleId || !exerciseId) {
    return <p className="admin-page__error">Missing exercise ID.</p>;
  }

  const counts = exercise?.question_counts ?? {};

  return (
    <div className="admin-page">
      <Link to={`/catalog/${moduleId}`} className="admin-page__back">
        ← Back to module
      </Link>

      <header className="admin-page__hero">
        <h1>{exercise?.name ?? 'Exercise'}</h1>
        <p>{exercise?.description ?? 'Build questions from vocabulary items.'}</p>
        <p className="admin-page__hint">
          <Link to="/catalog/vocabulary">Manage vocabulary library</Link>
        </p>
      </header>

      <section className="admin-page__panel">
        <h2>Choose level</h2>
        <div className="admin-page__grid admin-page__grid--levels">
          {DIFFICULTY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={
                selectedLevel === level
                  ? 'admin-page__stat admin-page__stat--selectable admin-page__stat--active'
                  : 'admin-page__stat admin-page__stat--selectable'
              }
              onClick={() => selectLevel(level)}
            >
              <p className="admin-page__stat-label">{level}</p>
              <p className="admin-page__stat-value">{readQuestionCount(counts, level)}</p>
              <p className="admin-page__stat-meta">questions</p>
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      {selectedLevel && (
        <>
          <section className="admin-page__panel">
            <h2>Add question — {levelLabel(selectedLevel)}</h2>
            {vocabulary.length === 0 ? (
              <div className="admin-page__empty-card">
                <p>No vocabulary at {levelLabel(selectedLevel)} yet.</p>
                <p className="admin-page__hint">
                  Add a word below, or{' '}
                  <Link to="/catalog/vocabulary">open the full vocabulary library</Link> to bulk
                  import JSON.
                </p>
                <form className="admin-page__quick-form" onSubmit={handleQuickAddVocab}>
                  <div className="admin-page__grid admin-page__grid--2">
                    <input
                      className="admin-page__input"
                      placeholder="Word (e.g. Inka)"
                      value={quickWord}
                      onChange={(e) => setQuickWord(e.target.value)}
                      required
                      disabled={addingVocab}
                    />
                    <input
                      className="admin-page__input"
                      placeholder="English (e.g. Cow)"
                      value={quickEnglish}
                      onChange={(e) => setQuickEnglish(e.target.value)}
                      required
                      disabled={addingVocab}
                    />
                  </div>
                  <button
                    type="submit"
                    className="admin-page__btn admin-page__btn--primary"
                    disabled={addingVocab}
                  >
                    {addingVocab ? 'Adding…' : 'Add word & continue'}
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleCreate}>
                <p className="admin-page__hint">
                  {vocabulary.length} word{vocabulary.length === 1 ? '' : 's'} at{' '}
                  {levelLabel(selectedLevel)}. A question needs one <strong>target</strong> and at
                  least one <strong>distractor</strong> (different words).
                </p>
                <div className="admin-page__field">
                  <label className="admin-page__label" htmlFor="q-target">
                    Target word
                  </label>
                  <select
                    id="q-target"
                    className="admin-page__select"
                    value={targetItemId}
                    onChange={(e) => {
                      setTargetItemId(e.target.value);
                      setDistractorIds((prev) => prev.filter((id) => id !== e.target.value));
                    }}
                    disabled={submitting}
                    required
                  >
                    <option value="">Select target…</option>
                    {vocabulary.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.word} — {item.english_translation}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-page__field">
                  <p className="admin-page__label">Distractors</p>
                  {vocabOptions.length === 0 ? (
                    <div className="admin-page__empty-card admin-page__empty-card--inline">
                      <p>
                        No other words at this level yet. Add distractor options below (e.g.{' '}
                        <em>Ibirayi — Irish potatoes</em>, <em>Umuceri — Rice</em>).
                      </p>
                      <div className="admin-page__quick-form">
                        <div className="admin-page__grid admin-page__grid--2">
                          <input
                            className="admin-page__input"
                            placeholder="Distractor word"
                            value={quickWord}
                            onChange={(e) => setQuickWord(e.target.value)}
                            disabled={addingVocab}
                          />
                          <input
                            className="admin-page__input"
                            placeholder="English translation"
                            value={quickEnglish}
                            onChange={(e) => setQuickEnglish(e.target.value)}
                            disabled={addingVocab}
                          />
                        </div>
                        <button
                          type="button"
                          className="admin-page__btn admin-page__btn--primary"
                          disabled={addingVocab || !quickWord.trim() || !quickEnglish.trim()}
                          onClick={(e) => {
                            e.preventDefault();
                            void handleQuickAddVocab(e);
                          }}
                        >
                          {addingVocab ? 'Adding…' : 'Add distractor word'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ul className="admin-page__checklist">
                      {vocabOptions.map((item) => (
                        <li key={item.id}>
                          <label className="admin-page__check">
                            <input
                              type="checkbox"
                              checked={distractorIds.includes(item.id)}
                              onChange={() => toggleDistractor(item.id)}
                              disabled={submitting}
                            />
                            <span>
                              {item.word} — {item.english_translation}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {vocabOptions.length > 0 && vocabulary.length < 3 && (
                  <div className="admin-page__field">
                    <p className="admin-page__hint">Add more words for richer questions (optional)</p>
                    <div className="admin-page__grid admin-page__grid--2">
                      <input
                        className="admin-page__input"
                        placeholder="Another word"
                        value={quickWord}
                        onChange={(e) => setQuickWord(e.target.value)}
                        disabled={addingVocab}
                      />
                      <input
                        className="admin-page__input"
                        placeholder="English"
                        value={quickEnglish}
                        onChange={(e) => setQuickEnglish(e.target.value)}
                        disabled={addingVocab}
                      />
                    </div>
                    <button
                      type="button"
                      className="admin-page__btn"
                      disabled={addingVocab || !quickWord.trim() || !quickEnglish.trim()}
                      onClick={(e) => {
                        e.preventDefault();
                        void handleQuickAddVocab(e);
                      }}
                    >
                      {addingVocab ? 'Adding…' : 'Add word'}
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="admin-page__btn admin-page__btn--primary"
                  disabled={submitting || vocabOptions.length === 0}
                >
                  {submitting ? 'Adding…' : `Add to ${levelLabel(selectedLevel)}`}
                </button>
              </form>
            )}
          </section>

          <section className="admin-page__panel">
            <h2>
              {levelLabel(selectedLevel)} questions ({readQuestionCount(counts, selectedLevel)})
            </h2>
            {loadingQuestions ? (
              <p className="admin-page__empty">Loading questions…</p>
            ) : questions.length === 0 ? (
              <p className="admin-page__empty">No questions at this level yet.</p>
            ) : (
              <ul className="admin-page__question-list">
                {questions.map((q) => (
                  <li key={q.id} className="admin-page__question-item">
                    <p className="admin-page__question-text">{questionPreview(q)}</p>
                    {questionAnswerLabel(q) && (
                      <p className="admin-page__question-answer">Answer: {questionAnswerLabel(q)}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {loading && <p className="admin-page__empty">Loading exercise…</p>}
    </div>
  );
}
