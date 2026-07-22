import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/alerts/ConfirmDialog';
import { QuestionDetailCard } from '../components/catalog/QuestionDetailCard';
import { QuestionPreviewModal } from '../components/catalog/QuestionPreviewModal';
import {
  DIFFICULTY_LEVELS,
  firstLevelWithQuestions,
  levelLabel,
  readQuestionCount,
  totalQuestionCount,
} from '../lib/difficulty';
import { useAuth } from '../context/AuthContext';
import {
  createQuestion,
  deleteExercise,
  deleteQuestion,
  distractorFieldLabel,
  getExercise,
  listQuestions,
  listVocabulary,
  type DifficultyLevel,
} from '../services/catalogService';
import type { ApiExerciseDetail, ApiQuestion, ApiVocabularyItem } from '../types/api';
import '../styles/admin-page.css';
import './CatalogExercisePage.css';

type PageMode = 'browse' | 'create';
type WorkflowStep = 'level' | 'vocabulary' | 'questions';

const VOCAB_PAGE_SIZE = 12;

function parseMode(raw: string | null): PageMode | null {
  if (raw === 'browse' || raw === 'create') return raw;
  return null;
}

export function CatalogExercisePage() {
  const { moduleId, exerciseId } = useParams<{ moduleId: string; exerciseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [exercise, setExercise] = useState<ApiExerciseDetail | null>(null);
  const [pageMode, setPageMode] = useState<PageMode>('create');
  const [modeReady, setModeReady] = useState(false);
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
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] = useState<ApiQuestion | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [confirmDeleteExercise, setConfirmDeleteExercise] = useState(false);
  const [deletingExercise, setDeletingExercise] = useState(false);

  const setMode = useCallback(
    (mode: PageMode, replace = false) => {
      setPageMode(mode);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', mode);
          return next;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  const refreshExercise = useCallback(async () => {
    if (!token || !exerciseId) return null;
    const data = await getExercise(token, exerciseId);
    setExercise(data);
    return data;
  }, [token, exerciseId]);

  const loadExercise = useCallback(async () => {
    if (!token || !exerciseId) return;
    setLoading(true);
    setError('');
    setModeReady(false);
    try {
      const data = await getExercise(token, exerciseId);
      setExercise(data);

      let counts = data.question_counts ?? {};
      let hasQuestions = totalQuestionCount(counts) > 0;

      // Some exercise payloads omit question_counts even when questions exist.
      if (!hasQuestions) {
        const perLevel = await Promise.all(
          DIFFICULTY_LEVELS.map(async (level) => {
            try {
              const items = await listQuestions(token, exerciseId, level);
              return [level, items.length] as const;
            } catch {
              return [level, 0] as const;
            }
          }),
        );
        counts = Object.fromEntries(
          perLevel.map(([level, count]) => [String(level), count]),
        );
        hasQuestions = totalQuestionCount(counts) > 0;
        setExercise({ ...data, question_counts: counts });
      }

      const requested = parseMode(searchParams.get('mode'));
      const nextMode: PageMode = requested ?? (hasQuestions ? 'browse' : 'create');

      setPageMode(nextMode);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', nextMode);
          return next;
        },
        { replace: true },
      );

      if (nextMode === 'browse') {
        const startLevel = firstLevelWithQuestions(counts) ?? 1;
        setSelectedLevel(startLevel);
        setWorkflowStep('level');
      } else {
        setSelectedLevel(null);
        setWorkflowStep('level');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercise');
    } finally {
      setLoading(false);
      setModeReady(true);
    }
    // Resolve mode once per exercise open (URL + question counts), not on every refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams read intentionally once per exerciseId
  }, [token, exerciseId, setSearchParams]);

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
    if (pageMode === 'browse' && selectedLevel) {
      loadVocabulary();
      loadQuestions();
      return;
    }
    if (pageMode === 'create' && (workflowStep === 'vocabulary' || workflowStep === 'questions')) {
      loadVocabulary();
    }
  }, [loadVocabulary, loadQuestions, pageMode, selectedLevel, workflowStep]);

  useEffect(() => {
    if (pageMode === 'create' && workflowStep === 'questions') {
      loadQuestions();
    }
  }, [loadQuestions, pageMode, workflowStep]);

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
  const totalQuestions = totalQuestionCount(counts);

  function questionCountForLevel(level: DifficultyLevel) {
    if (selectedLevel === level) {
      return Math.max(questions.length, readQuestionCount(counts, level));
    }
    return readQuestionCount(counts, level);
  }

  function startCreateFlow() {
    setSuccess('');
    setError('');
    setSelectedVocabIds([]);
    setVocabSearch('');
    setTargetItemId('');
    setDistractorIds([]);
    setSelectedLevel(null);
    setWorkflowStep('level');
    setMode('create');
  }

  function selectBrowseLevel(level: DifficultyLevel) {
    setSelectedLevel(level);
    setSuccess('');
    setError('');
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
      await Promise.all([refreshExercise(), loadQuestions()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteQuestion() {
    if (!token || !confirmDeleteQuestion) return;
    setDeletingQuestionId(confirmDeleteQuestion.id);
    setError('');
    setSuccess('');
    try {
      await deleteQuestion(token, confirmDeleteQuestion.id);
      setSuccess('Question deleted.');
      setConfirmDeleteQuestion(null);
      if (previewQuestion?.id === confirmDeleteQuestion.id) {
        setPreviewQuestion(null);
      }
      await Promise.all([refreshExercise(), loadQuestions()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setDeletingQuestionId(null);
    }
  }

  async function handleDeleteExercise() {
    if (!token || !exerciseId || !moduleId) return;
    setDeletingExercise(true);
    setError('');
    setSuccess('');
    try {
      await deleteExercise(token, exerciseId);
      navigate(`/modules/${moduleId}`, {
        replace: true,
        state: { success: 'Exercise deleted.' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exercise');
      setDeletingExercise(false);
    }
  }

  if (!moduleId || !exerciseId) {
    return <p className="admin-page__error">Missing exercise ID.</p>;
  }

  const questionsHeadingId = 'exercise-questions-heading';
  const levelsLabelId = 'exercise-levels-label';

  return (
    <div className="admin-page exercise-page">
      <Link to={`/modules/${moduleId}`} className="admin-page__back exercise-page__back">
        ← Back to exercises
      </Link>

      <header className="exercise-page__hero">
        <div className="exercise-page__hero-text">
          {exercise?.type?.trim() ? (
            <p className="exercise-page__eyebrow">{exercise.type}</p>
          ) : null}
          <h1>{exercise?.name ?? (loading ? 'Loading exercise…' : 'Exercise')}</h1>
          {exercise?.description?.trim() ? (
            <p className="exercise-page__desc">{exercise.description}</p>
          ) : null}
        </div>

        {modeReady && (
          <div className="exercise-page__hero-actions">
            {totalQuestions > 0 && (
              <div className="exercise-page__mode" role="group" aria-label="Exercise mode">
                <button
                  type="button"
                  className={
                    pageMode === 'browse'
                      ? 'exercise-page__mode-btn exercise-page__mode-btn--active'
                      : 'exercise-page__mode-btn'
                  }
                  aria-pressed={pageMode === 'browse'}
                  onClick={() => {
                    const startLevel = firstLevelWithQuestions(counts) ?? selectedLevel ?? 1;
                    setSelectedLevel(startLevel);
                    setWorkflowStep('level');
                    setMode('browse');
                  }}
                >
                  View questions
                </button>
                <button
                  type="button"
                  className={
                    pageMode === 'create'
                      ? 'exercise-page__mode-btn exercise-page__mode-btn--active'
                      : 'exercise-page__mode-btn'
                  }
                  aria-pressed={pageMode === 'create'}
                  onClick={startCreateFlow}
                >
                  Create questions
                </button>
              </div>
            )}
            {pageMode === 'browse' && totalQuestions === 0 && (
              <button type="button" className="admin-page__cta" onClick={startCreateFlow}>
                + Create questions
              </button>
            )}
          </div>
        )}
      </header>

      {pageMode === 'create' && (
        <nav className="exercise-page__steps" aria-label="Question builder steps">
          <button
            type="button"
            className={
              workflowStep === 'level'
                ? 'exercise-page__step exercise-page__step--active'
                : 'exercise-page__step exercise-page__step--done'
            }
            aria-current={workflowStep === 'level' ? 'step' : undefined}
            onClick={goBackToLevel}
          >
            <span className="exercise-page__step-num" aria-hidden="true">
              1
            </span>
            Choose level
          </button>
          <span className="exercise-page__step-divider" aria-hidden="true" />
          <button
            type="button"
            className={
              workflowStep === 'vocabulary'
                ? 'exercise-page__step exercise-page__step--active'
                : workflowStep === 'questions'
                  ? 'exercise-page__step exercise-page__step--done'
                  : 'exercise-page__step'
            }
            aria-current={workflowStep === 'vocabulary' ? 'step' : undefined}
            onClick={() => {
              if (selectedLevel) setWorkflowStep('vocabulary');
            }}
            disabled={!selectedLevel}
          >
            <span className="exercise-page__step-num" aria-hidden="true">
              2
            </span>
            Select vocabulary
          </button>
          <span className="exercise-page__step-divider" aria-hidden="true" />
          <button
            type="button"
            className={
              workflowStep === 'questions'
                ? 'exercise-page__step exercise-page__step--active'
                : 'exercise-page__step'
            }
            aria-current={workflowStep === 'questions' ? 'step' : undefined}
            onClick={() => {
              if (selectedVocabIds.length >= minVocabForQuestions) setWorkflowStep('questions');
            }}
            disabled={selectedVocabIds.length < minVocabForQuestions}
          >
            <span className="exercise-page__step-num" aria-hidden="true">
              3
            </span>
            Build questions
          </button>
        </nav>
      )}

      <div className="exercise-page__status" aria-live="polite" aria-atomic="true">
        {error && (
          <p className="admin-page__error" role="alert">
            {error}
          </p>
        )}
        {success && <p className="admin-page__success">{success}</p>}
      </div>

      {pageMode === 'browse' && (
        <>
          <section className="exercise-page__panel" aria-labelledby={levelsLabelId}>
            <h2 id={levelsLabelId}>Choose a level</h2>
            <p className="exercise-page__panel-hint">
              Filter questions by difficulty. Counts update as you add or remove questions.
            </p>
            <div
              className="exercise-page__levels"
              role="radiogroup"
              aria-labelledby={levelsLabelId}
            >
              {DIFFICULTY_LEVELS.map((level) => {
                const count = questionCountForLevel(level);
                const active = selectedLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={
                      active
                        ? 'exercise-page__level exercise-page__level--active'
                        : 'exercise-page__level'
                    }
                    onClick={() => selectBrowseLevel(level)}
                  >
                    <span className="exercise-page__level-label">Level {level}</span>
                    <span className="exercise-page__level-count">{count}</span>
                    <span className="exercise-page__level-meta">
                      {count === 1 ? 'question' : 'questions'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedLevel && (
            <section className="exercise-page__panel" aria-labelledby={questionsHeadingId}>
              <div className="exercise-page__panel-header">
                <div>
                  <h2 id={questionsHeadingId}>
                    Questions · Level {levelLabel(selectedLevel)}
                  </h2>
                  <p className="exercise-page__panel-hint">
                    {loadingQuestions || loadingVocabulary
                      ? 'Loading questions…'
                      : `${questions.length} ${questions.length === 1 ? 'question' : 'questions'} at this level.`}
                  </p>
                </div>
              </div>

              {loadingQuestions || loadingVocabulary ? (
                <p className="exercise-page__loading" role="status">
                  Loading questions…
                </p>
              ) : questions.length === 0 ? (
                <div className="exercise-page__empty">
                  <p>No questions at Level {levelLabel(selectedLevel)} yet.</p>
                  <button
                    type="button"
                    className="admin-page__btn admin-page__btn--primary"
                    onClick={startCreateFlow}
                  >
                    + Create questions
                  </button>
                </div>
              ) : (
                <ul className="exercise-page__list">
                  {questions.map((q, index) => (
                    <QuestionDetailCard
                      key={q.id}
                      question={q}
                      vocabulary={vocabulary}
                      index={index + 1}
                      onPreview={setPreviewQuestion}
                      onDelete={setConfirmDeleteQuestion}
                      deleting={deletingQuestionId === q.id}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      {pageMode === 'create' && workflowStep === 'level' && (
        <section className="exercise-page__panel" aria-labelledby={levelsLabelId}>
          <h2 id={levelsLabelId}>Choose a level</h2>
          <p className="exercise-page__panel-hint">
            Each level uses words tagged at that difficulty. Add words in{' '}
            <Link to="/modules/vocabulary">Vocabulary</Link> first.
          </p>
          <div className="exercise-page__levels">
            {DIFFICULTY_LEVELS.map((level) => {
              const count = questionCountForLevel(level);
              return (
                <button
                  key={level}
                  type="button"
                  className="exercise-page__level"
                  onClick={() => selectLevel(level)}
                  aria-label={`Choose Level ${level}, currently ${count} ${count === 1 ? 'question' : 'questions'}`}
                >
                  <span className="exercise-page__level-label">Level {level}</span>
                  <span className="exercise-page__level-count">{count}</span>
                  <span className="exercise-page__level-meta">
                    {count === 1 ? 'question' : 'questions'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {pageMode === 'create' && workflowStep === 'vocabulary' && selectedLevel && (
        <section className="exercise-page__panel">
          <div className="exercise-page__panel-header">
            <div>
              <h2>Select words · Level {levelLabel(selectedLevel)}</h2>
              <p className="exercise-page__panel-hint">
                Select at least {minVocabForQuestions} words (1 correct answer +{' '}
                {requiredDistractors} wrong{' '}
                {requiredDistractors === 1 ? 'answer' : 'answers'}).
              </p>
            </div>
            <Link to="/modules/vocabulary" className="admin-page__btn">
              Manage words
            </Link>
          </div>

          {loadingVocabulary ? (
            <p className="exercise-page__loading" role="status">
              Loading words…
            </p>
          ) : vocabulary.length === 0 ? (
            <div className="exercise-page__empty">
              <p>
                No Level {levelLabel(selectedLevel)} words yet.
              </p>
              <Link to="/modules/vocabulary" className="admin-page__btn admin-page__btn--primary">
                Add words
              </Link>
            </div>
          ) : (
            <>
              <div className="admin-page__vocab-toolbar">
                <label className="admin-page__sr-only" htmlFor="exercise-vocab-search">
                  Search vocabulary words
                </label>
                <input
                  id="exercise-vocab-search"
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

              <p className="admin-page__selection-summary" role="status" aria-live="polite">
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
                        aria-label={`${item.word}${item.english_translation ? `, ${item.english_translation}` : ''}${selected ? ', selected' : ''}`}
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
                <p className="exercise-page__loading" role="status">
                  No words match your search.
                </p>
              )}

              {pageCount > 1 && (
                <div className="admin-page__pagination" role="navigation" aria-label="Vocabulary pages">
                  <button
                    type="button"
                    className="admin-page__btn"
                    onClick={() => setVocabPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    ← Previous
                  </button>
                  <span className="admin-page__pagination-info">
                    Page {currentPage} of {pageCount}
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

              <div className="exercise-page__panel-footer">
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

      {pageMode === 'create' && workflowStep === 'questions' && selectedLevel && (
        <>
          <section className="exercise-page__panel">
            <div className="exercise-page__panel-header">
              <div>
                <h2>Build questions · Level {levelLabel(selectedLevel)}</h2>
                <p className="exercise-page__panel-hint">
                  Pick 1 correct answer and {requiredDistractors} wrong{' '}
                  {requiredDistractors === 1 ? 'answer' : 'answers'} (shown as{' '}
                  {distractorFieldLabel(distractorField).toLowerCase()}). Each save creates one
                  question.
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

              <fieldset className="admin-page__field">
                <legend className="admin-page__label">
                  Wrong answers — pick {requiredDistractors}
                  {distractorIds.length > 0 ? ` (${distractorIds.length}/${requiredDistractors})` : ''}
                </legend>
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
              </fieldset>

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

          <section className="exercise-page__panel" aria-labelledby={questionsHeadingId}>
            <h2 id={questionsHeadingId}>
              Questions · Level {levelLabel(selectedLevel)}
            </h2>
            <p className="exercise-page__panel-hint">
              {loadingQuestions
                ? 'Loading questions…'
                : `${questions.length} ${questions.length === 1 ? 'question' : 'questions'} so far.`}
            </p>
            {loadingQuestions ? (
              <p className="exercise-page__loading" role="status">
                Loading…
              </p>
            ) : questions.length === 0 ? (
              <div className="exercise-page__empty">
                <p>No questions yet. Add one using the form above.</p>
              </div>
            ) : (
              <ul className="exercise-page__list">
                {questions.map((q, index) => (
                  <QuestionDetailCard
                    key={q.id}
                    question={q}
                    vocabulary={vocabulary}
                    index={index + 1}
                    onPreview={setPreviewQuestion}
                    onDelete={setConfirmDeleteQuestion}
                    deleting={deletingQuestionId === q.id}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {loading && (
        <p className="exercise-page__loading" role="status">
          Loading exercise…
        </p>
      )}

      {modeReady && exercise && (
        <section
          className="exercise-page__panel exercise-page__panel--danger"
          aria-labelledby="exercise-danger-heading"
        >
          <h2 id="exercise-danger-heading">Exercise</h2>
          <p className="exercise-page__panel-hint">
            Delete this exercise only if it is not referenced by sessions or progress.
          </p>
          <button
            type="button"
            className="admin-page__btn admin-page__btn--danger"
            onClick={() => setConfirmDeleteExercise(true)}
            disabled={deletingExercise}
          >
            Delete exercise
          </button>
        </section>
      )}

      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          vocabulary={vocabulary}
          onClose={() => setPreviewQuestion(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteQuestion)}
        title="Delete question?"
        message="Delete this question? This only works if it is not referenced by stored session answers."
        confirmLabel="Delete"
        danger
        busy={Boolean(deletingQuestionId)}
        onConfirm={handleDeleteQuestion}
        onCancel={() => !deletingQuestionId && setConfirmDeleteQuestion(null)}
      />

      <ConfirmDialog
        open={confirmDeleteExercise}
        title="Delete exercise?"
        message={`Delete “${exercise?.name ?? 'this exercise'}”? This only works if it is not referenced by sessions or progress.`}
        confirmLabel="Delete"
        danger
        busy={deletingExercise}
        onConfirm={handleDeleteExercise}
        onCancel={() => !deletingExercise && setConfirmDeleteExercise(false)}
      />
    </div>
  );
}
