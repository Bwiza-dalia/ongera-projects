import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QuestionDetailCard } from '../components/catalog/QuestionDetailCard';
import { QuestionPreviewModal } from '../components/catalog/QuestionPreviewModal';
import { DIFFICULTY_LEVELS, levelLabel, readQuestionCount } from '../lib/difficulty';
import { useAuth } from '../context/AuthContext';
import {
  createQuestion,
  distractorFieldLabel,
  getExercise,
  listQuestions,
  listVocabulary,
  type DifficultyLevel,
} from '../services/catalogService';
import type { ApiExerciseDetail, ApiQuestion, ApiVocabularyItem } from '../types/api';
import '../styles/admin-page.css';

type WorkflowStep = 'level' | 'vocabulary' | 'questions';

const VOCAB_PAGE_SIZE = 12;

export function CatalogExercisePage() {
  const { moduleId, exerciseId } = useParams<{ moduleId: string; exerciseId: string }>();
  const { token } = useAuth();
  const [exercise, setExercise] = useState<ApiExerciseDetail | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(null);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('level');
  const [selectedVocabIds, setSelectedVocabIds] = useState<string[]>([]);
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabPage, setVocabPage] = useState(1);
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [vocabulary, setVocabulary] = useState<ApiVocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingVocabulary, setLoadingVocabulary] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [targetItemId, setTargetItemId] = useState('');
  const [distractorIds, setDistractorIds] = useState<string[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<ApiQuestion | null>(null);

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
    setLoadingVocabulary(true);
    try {
      setVocabulary(await listVocabulary(token, selectedLevel));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary');
      setVocabulary([]);
    } finally {
      setLoadingVocabulary(false);
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
    if (workflowStep === 'vocabulary' || workflowStep === 'questions') {
      loadVocabulary();
    }
  }, [loadVocabulary, workflowStep]);

  useEffect(() => {
    if (workflowStep === 'questions') {
      loadQuestions();
    }
  }, [loadQuestions, workflowStep]);

  const selectedVocabulary = useMemo(
    () => vocabulary.filter((item) => selectedVocabIds.includes(item.id)),
    [vocabulary, selectedVocabIds],
  );

  const filteredVocabulary = useMemo(() => {
    const query = vocabSearch.trim().toLowerCase();
    if (!query) return vocabulary;
    return vocabulary.filter(
      (item) =>
        item.word.toLowerCase().includes(query) ||
        (item.english_translation ?? '').toLowerCase().includes(query),
    );
  }, [vocabulary, vocabSearch]);

  const pageCount = Math.max(1, Math.ceil(filteredVocabulary.length / VOCAB_PAGE_SIZE));
  const currentPage = Math.min(vocabPage, pageCount);
  const pagedVocabulary = useMemo(
    () =>
      filteredVocabulary.slice(
        (currentPage - 1) * VOCAB_PAGE_SIZE,
        currentPage * VOCAB_PAGE_SIZE,
      ),
    [filteredVocabulary, currentPage],
  );

  useEffect(() => {
    setVocabPage(1);
  }, [vocabSearch, selectedLevel]);

  const vocabOptions = useMemo(
    () => selectedVocabulary.filter((item) => item.id !== targetItemId),
    [selectedVocabulary, targetItemId],
  );

  const counts = exercise?.question_counts ?? {};
  const requiredDistractors = Math.min(5, Math.max(1, exercise?.distractor_count ?? 1));
  const minVocabForQuestions = requiredDistractors + 1;
  const distractorField = exercise?.distractor_field ?? 'image_url';

  function questionCountForLevel(level: DifficultyLevel) {
    if (selectedLevel === level) {
      return Math.max(questions.length, readQuestionCount(counts, level));
    }
    return readQuestionCount(counts, level);
  }

  function selectLevel(level: DifficultyLevel) {
    setSelectedLevel(level);
    setWorkflowStep('vocabulary');
    setSuccess('');
    setError('');
    setSelectedVocabIds([]);
    setVocabSearch('');
    setTargetItemId('');
    setDistractorIds([]);
  }

  function goBackToLevel() {
    setWorkflowStep('level');
    setSelectedLevel(null);
    setSelectedVocabIds([]);
    setVocabSearch('');
    setTargetItemId('');
    setDistractorIds([]);
    setSuccess('');
    setError('');
  }

  function goBackToVocabulary() {
    setWorkflowStep('vocabulary');
    setTargetItemId('');
    setDistractorIds([]);
    setSuccess('');
    setError('');
  }

  function toggleVocabSelection(id: string) {
    setSelectedVocabIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  }

  function selectAllVisibleVocabulary() {
    setSelectedVocabIds((prev) => {
      const next = new Set(prev);
      for (const item of pagedVocabulary) {
        next.add(item.id);
      }
      return [...next];
    });
  }

  function clearVocabularySelection() {
    setSelectedVocabIds([]);
  }

  function continueToQuestions() {
    if (selectedVocabIds.length < minVocabForQuestions) {
      setError(
        `Select at least ${minVocabForQuestions} words (1 target + ${requiredDistractors} distractor${requiredDistractors === 1 ? '' : 's'}).`,
      );
      return;
    }
    setError('');
    setSuccess('');
    setTargetItemId('');
    setDistractorIds([]);
    setWorkflowStep('questions');
  }

  function toggleDistractor(id: string) {
    setDistractorIds((prev) => {
      if (prev.includes(id)) return prev.filter((itemId) => itemId !== id);
      if (prev.length >= requiredDistractors) return prev;
      return [...prev, id];
    });
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !exerciseId || !selectedLevel) return;
    if (!targetItemId) {
      setError('Select a target vocabulary item.');
      return;
    }
    if (distractorIds.length !== requiredDistractors) {
      setError(
        `Select exactly ${requiredDistractors} distractor${requiredDistractors === 1 ? '' : 's'}.`,
      );
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await createQuestion(token, exerciseId, {
        difficulty_level: selectedLevel,
        target_item_id: targetItemId,
        distractor_item_ids: distractorIds,
      });

      setSuccess('Question added.');
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

  return (
    <div className="admin-page">
      <Link to={`/catalog/${moduleId}`} className="admin-page__back">
        ← Back to module
      </Link>

      <header className="admin-page__hero">
        <h1>{exercise?.name ?? 'Exercise'}</h1>
        <p>Build questions from your words.</p>
      </header>

      <nav className="admin-page__steps" aria-label="Question builder steps">
        <button
          type="button"
          className={
            workflowStep === 'level'
              ? 'admin-page__step admin-page__step--active'
              : 'admin-page__step admin-page__step--done'
          }
          onClick={goBackToLevel}
        >
          <span className="admin-page__step-num">1</span>
          Choose level
        </button>
        <span className="admin-page__step-divider" aria-hidden="true" />
        <button
          type="button"
          className={
            workflowStep === 'vocabulary'
              ? 'admin-page__step admin-page__step--active'
              : workflowStep === 'questions'
                ? 'admin-page__step admin-page__step--done'
                : 'admin-page__step'
          }
          onClick={() => {
            if (selectedLevel) setWorkflowStep('vocabulary');
          }}
          disabled={!selectedLevel}
        >
          <span className="admin-page__step-num">2</span>
          Select vocabulary
        </button>
        <span className="admin-page__step-divider" aria-hidden="true" />
        <button
          type="button"
          className={
            workflowStep === 'questions'
              ? 'admin-page__step admin-page__step--active'
              : 'admin-page__step'
          }
          onClick={() => {
            if (selectedVocabIds.length >= minVocabForQuestions) setWorkflowStep('questions');
          }}
          disabled={selectedVocabIds.length < minVocabForQuestions}
        >
          <span className="admin-page__step-num">3</span>
          Build questions
        </button>
      </nav>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      {workflowStep === 'level' && (
        <section className="admin-page__panel">
          <h2>Choose a level</h2>
          <p className="admin-page__hint">
            Each level uses words tagged at that difficulty. Add words in{' '}
            <Link to="/catalog/vocabulary">Vocabulary</Link> first.
          </p>
          <div className="admin-page__grid admin-page__grid--levels">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className="admin-page__stat admin-page__stat--selectable"
                onClick={() => selectLevel(level)}
              >
                <p className="admin-page__stat-label">Level {level}</p>
                <p className="admin-page__stat-value">{questionCountForLevel(level)}</p>
                <p className="admin-page__stat-meta">questions</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {workflowStep === 'vocabulary' && selectedLevel && (
        <section className="admin-page__panel">
          <div className="admin-page__panel-header">
            <div>
              <h2>Select words · Level {levelLabel(selectedLevel)}</h2>
              <p className="admin-page__hint">
                Pick the words to build questions from. You can reuse them across questions.
              </p>
            </div>
            <Link to="/catalog/vocabulary" className="admin-page__btn">
              Manage words
            </Link>
          </div>

          {loadingVocabulary ? (
            <p className="admin-page__empty">Loading words…</p>
          ) : vocabulary.length === 0 ? (
            <div className="admin-page__empty-card">
              <p>
                No <strong>Level {levelLabel(selectedLevel)}</strong> words yet.
              </p>
              <Link to="/catalog/vocabulary" className="admin-page__btn admin-page__btn--primary">
                Add words
              </Link>
            </div>
          ) : (
            <>
              <div className="admin-page__vocab-toolbar">
                <input
                  className="admin-page__input admin-page__input--search"
                  placeholder="Search words…"
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                />
                <div className="admin-page__actions">
                  <button type="button" className="admin-page__btn" onClick={selectAllVisibleVocabulary}>
                    Select page
                  </button>
                  <button
                    type="button"
                    className="admin-page__btn"
                    onClick={clearVocabularySelection}
                    disabled={selectedVocabIds.length === 0}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <p className="admin-page__selection-summary">
                {selectedVocabIds.length} of {vocabulary.length} selected
                {selectedVocabIds.length < minVocabForQuestions &&
                  ` — need ${minVocabForQuestions}+`}
              </p>

              <ul className="admin-page__vocab-grid">
                {pagedVocabulary.map((item) => {
                  const selected = selectedVocabIds.includes(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={
                          selected
                            ? 'admin-page__vocab-card admin-page__vocab-card--selected'
                            : 'admin-page__vocab-card'
                        }
                        onClick={() => toggleVocabSelection(item.id)}
                        aria-pressed={selected}
                      >
                        {item.image_url ? (
                          <img
                            className="admin-page__vocab-card-thumb"
                            src={item.image_url}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <span className="admin-page__vocab-card-thumb admin-page__vocab-card-thumb--empty">
                            {item.audio_model_url ? '♪' : 'Aa'}
                          </span>
                        )}
                        <span className="admin-page__vocab-card-word">{item.word}</span>
                        <span className="admin-page__vocab-card-english">
                          {item.english_translation ?? '—'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {filteredVocabulary.length === 0 && (
                <p className="admin-page__empty">No words match your search.</p>
              )}

              {pageCount > 1 && (
                <div className="admin-page__pagination">
                  <button
                    type="button"
                    className="admin-page__btn"
                    onClick={() => setVocabPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    ← Prev
                  </button>
                  <span className="admin-page__pagination-info">
                    Page {currentPage} of {pageCount} · showing{' '}
                    {(currentPage - 1) * VOCAB_PAGE_SIZE + 1}–
                    {Math.min(currentPage * VOCAB_PAGE_SIZE, filteredVocabulary.length)} of{' '}
                    {filteredVocabulary.length}
                  </span>
                  <button
                    type="button"
                    className="admin-page__btn"
                    onClick={() => setVocabPage((p) => Math.min(pageCount, p + 1))}
                    disabled={currentPage >= pageCount}
                  >
                    Next →
                  </button>
                </div>
              )}

              <div className="admin-page__panel-footer">
                <button type="button" className="admin-page__btn" onClick={goBackToLevel}>
                  ← Change level
                </button>
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--primary"
                  onClick={continueToQuestions}
                  disabled={selectedVocabIds.length < minVocabForQuestions}
                >
                  Continue ({selectedVocabIds.length})
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {workflowStep === 'questions' && selectedLevel && (
        <>
          <section className="admin-page__panel">
            <div className="admin-page__panel-header">
              <div>
                <h2>Build questions · Level {levelLabel(selectedLevel)}</h2>
                <p className="admin-page__hint">
                  Pick 1 correct answer + {requiredDistractors} wrong{' '}
                  {requiredDistractors === 1 ? 'one' : 'ones'} (shown as{' '}
                  {distractorFieldLabel(distractorField).toLowerCase()}). Each Add makes one question.
                </p>
              </div>
              <button type="button" className="admin-page__btn" onClick={goBackToVocabulary}>
                Change words
              </button>
            </div>

            <form className="admin-page__question-form" onSubmit={handleCreate}>
              <div className="admin-page__field">
                <label className="admin-page__label" htmlFor="q-target">
                  Correct answer
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
                  <option value="">Select…</option>
                  {selectedVocabulary.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.word} — {item.english_translation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-page__field">
                <p className="admin-page__label">
                  Wrong answers — pick {requiredDistractors}
                  {distractorIds.length > 0 && ` (${distractorIds.length}/${requiredDistractors})`}
                </p>
                {!targetItemId ? (
                  <p className="admin-page__hint">Pick the correct answer first.</p>
                ) : vocabOptions.length === 0 ? (
                  <p className="admin-page__hint">
                    No other words selected. Go back and add more.
                  </p>
                ) : (
                  <ul className="admin-page__checklist">
                    {vocabOptions.map((item) => {
                      const checked = distractorIds.includes(item.id);
                      const atLimit = distractorIds.length >= requiredDistractors && !checked;
                      return (
                        <li key={item.id}>
                          <label className="admin-page__check">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDistractor(item.id)}
                              disabled={submitting || atLimit}
                            />
                            <span>
                              {item.word} — {item.english_translation}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <button
                type="submit"
                className="admin-page__btn admin-page__btn--primary"
                disabled={
                  submitting ||
                  !targetItemId ||
                  distractorIds.length !== requiredDistractors
                }
              >
                {submitting ? 'Adding…' : 'Add question'}
              </button>
            </form>
          </section>

          <section className="admin-page__panel">
            <h2>
              Questions · Level {levelLabel(selectedLevel)} ({questions.length})
            </h2>
            {loadingQuestions ? (
              <p className="admin-page__empty">Loading…</p>
            ) : questions.length === 0 ? (
              <p className="admin-page__empty">No questions yet.</p>
            ) : (
              <ul className="admin-page__question-list">
                {questions.map((q) => (
                  <QuestionDetailCard
                    key={q.id}
                    question={q}
                    vocabulary={vocabulary}
                    onPreview={setPreviewQuestion}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {loading && <p className="admin-page__empty">Loading exercise…</p>}

      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          vocabulary={vocabulary}
          onClose={() => setPreviewQuestion(null)}
        />
      )}
    </div>
  );
}
