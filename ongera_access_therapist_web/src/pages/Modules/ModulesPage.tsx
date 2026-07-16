import { useEffect, useMemo, useState } from 'react';
import {
  useDomainModules,
  useExerciseDetail,
  useExerciseQuestions,
  useModuleCatalog,
} from '../../hooks/useModules';
import speechTherapyImg from '../../assets/speechtherapy.png';
import cognitiveTherapyImg from '../../assets/cognitivetherapy.png';
import motionTherapyImg from '../../assets/motiontherapy.png';
import { levelToDifficultyNumber } from '../../lib/difficulty';
import { questionAnswerLabel, questionPreview } from '../../lib/questionUtils';
import type {
  ModuleExercise,
  ModuleLevel,
  TherapyDomain,
  TherapyDomainId,
  TherapyModule,
} from '../../types/modules';
import './ModulesPage.css';

function displayLevel(level: ModuleLevel) {
  return String(levelToDifficultyNumber(level.id));
}

const DOMAIN_CARD: Record<
  TherapyDomainId,
  { category: string; tone: string; image: string; imageAlt: string }
> = {
  speech: {
    category: 'Speech therapy',
    tone: 'mint',
    image: speechTherapyImg,
    imageAlt: 'Speech therapy session with anatomical model',
  },
  cognitive: {
    category: 'Cognitive therapy',
    tone: 'blue',
    image: cognitiveTherapyImg,
    imageAlt: 'Cognitive therapy session with note-taking',
  },
  motion: {
    category: 'Motion therapy',
    tone: 'amber',
    image: motionTherapyImg,
    imageAlt: 'Motion therapy session measuring joint range',
  },
};

export function ModulesPage() {
  const { catalog, isLoading, error, reload } = useModuleCatalog();
  const [openDomainId, setOpenDomainId] = useState<TherapyDomainId | null>(null);

  const openDomain = openDomainId
    ? catalog.domains.find((d) => d.id === openDomainId) ?? null
    : null;

  if (openDomain) {
    return (
      <DomainExercisesView
        domain={openDomain}
        onBack={() => setOpenDomainId(null)}
      />
    );
  }

  return (
    <div className="modules-page">
      <header className="modules-page__hero">
        <h1 className="app-page-title">Modules</h1>
      </header>

      {error && (
        <div className="modules-page__error" role="alert">
          <p>{error}</p>
          <button type="button" className="modules-page__retry" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="modules-page__empty" role="status">
          Loading modules…
        </p>
      ) : catalog.domains.length === 0 ? (
        <p className="modules-page__empty" role="status">
          No modules available yet.
        </p>
      ) : (
        <div className="modules-page__grid modules-page__grid--domains">
          {catalog.domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onOpen={() => setOpenDomainId(domain.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DomainExercisesView({
  domain,
  onBack,
}: {
  domain: TherapyDomain;
  onBack: () => void;
}) {
  const { modules, isLoading, error } = useDomainModules(domain);

  const exerciseModuleNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const mod of modules) {
      for (const exercise of mod.exercises) {
        names[exercise.id] = mod.name;
      }
    }
    return names;
  }, [modules]);

  const combinedModule = useMemo((): TherapyModule | null => {
    const exercises = modules.flatMap((mod) => mod.exercises);
    if (exercises.length === 0) return null;

    return {
      id: domain.id,
      name: domain.name,
      domain: domain.id,
      description: domain.description,
      clinicalTarget: '',
      exercises,
    };
  }, [domain, modules]);

  if (isLoading) {
    return (
      <div className="modules-page modules-page--detail">
        <button type="button" className="modules-page__back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          All modules
        </button>
        <p className="modules-page__empty" role="status">
          Loading exercises…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modules-page modules-page--detail">
        <button type="button" className="modules-page__back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          All modules
        </button>
        <p className="modules-page__error" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!combinedModule) {
    return (
      <div className="modules-page modules-page--detail">
        <button type="button" className="modules-page__back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          All modules
        </button>
        <header className="modules-page__detail-hero">
          <h1>{domain.name}</h1>
          <p>{domain.description}</p>
        </header>
        <p className="modules-page__empty" role="status">
          No exercises in this domain yet.
        </p>
      </div>
    );
  }

  return (
    <ModuleDetail
      domain={domain}
      mod={combinedModule}
      onBack={onBack}
      exerciseModuleNames={exerciseModuleNames}
    />
  );
}

function DomainCard({
  domain,
  onOpen,
}: {
  domain: TherapyDomain;
  onOpen: () => void;
}) {
  const card = DOMAIN_CARD[domain.id];
  const exerciseCount = domain.modules.reduce((sum, mod) => sum + mod.exercises.length, 0);
  const status = exerciseCount > 0 ? 'Available' : 'Coming soon';

  return (
    <button
      type="button"
      className="modules-page__course"
      onClick={onOpen}
      aria-label={`View details for ${domain.name}`}
    >
      <div className="modules-page__course-media">
        <img src={card.image} alt={card.imageAlt} className="modules-page__course-img" />
      </div>

      <div className="modules-page__course-body">
        <div className="modules-page__course-tags">
          <span className={`modules-page__course-tag modules-page__course-tag--${card.tone}`}>
            {card.category}
          </span>
          <span
            className={
              exerciseCount > 0
                ? 'modules-page__course-tag modules-page__course-tag--status'
                : 'modules-page__course-tag modules-page__course-tag--muted'
            }
          >
            {status}
          </span>
        </div>

        <h2 className="modules-page__course-title">{domain.name}</h2>
        {domain.description ? (
          <p className="modules-page__course-desc">{domain.description}</p>
        ) : null}

        <div className="modules-page__course-meta">
          <span className="modules-page__course-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
              <path d="M10 10l5 3-5 3v-6z" fill="currentColor" />
            </svg>
            {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
          </span>
        </div>

        <span className="modules-page__course-cta">
          View details
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </button>
  );
}

function ModuleDetail({
  domain,
  mod,
  onBack,
  exerciseModuleNames,
}: {
  domain: TherapyDomain;
  mod: TherapyModule;
  onBack: () => void;
  exerciseModuleNames?: Record<string, string>;
}) {
  const [exerciseId, setExerciseId] = useState(mod.exercises[0]?.id ?? '');
  const [levelId, setLevelId] = useState('');
  const [sessionNumber, setSessionNumber] = useState<number | null>(null);

  const baseExercise = mod.exercises.find((e) => e.id === exerciseId) ?? mod.exercises[0] ?? null;
  const { exercise: loadedExercise, isLoading: exerciseLoading } = useExerciseDetail(
    baseExercise?.id ?? null,
    baseExercise,
  );

  const exercise = loadedExercise ?? baseExercise;
  const levels = exercise?.levels ?? [];

  const level =
    levels.find((l) => l.id === levelId) ?? levels[0] ?? null;

  const { questions, isLoading: questionsLoading, error: questionsError } = useExerciseQuestions(
    exercise?.id ?? null,
    level?.id ?? null,
  );

  useEffect(() => {
    if (levels.length > 0) {
      setLevelId((current) =>
        current && levels.some((l) => l.id === current) ? current : levels[0].id,
      );
    } else {
      setLevelId('');
    }
  }, [exercise?.id, levels]);

  const session = level?.sessions.find((s) => s.number === sessionNumber) ?? null;

  const totalQuestions = useMemo(
    () => levels.reduce((sum, lvl) => sum + (lvl.questionCount ?? 0), 0),
    [levels],
  );

  function levelQuestionCount(lvl: ModuleLevel) {
    if (level?.id === lvl.id && !questionsLoading && questions.length > 0) {
      return questions.length;
    }
    return lvl.questionCount ?? 0;
  }

  function exerciseQuestionCount(ex: ModuleExercise) {
    if (exercise?.id === ex.id) {
      if (totalQuestions > 0) return totalQuestions;
      if (!questionsLoading && questions.length > 0) return questions.length;
    }
    return ex.levels.reduce((sum, lvl) => sum + (lvl.questionCount ?? 0), 0);
  }

  function pickExercise(ex: ModuleExercise) {
    setExerciseId(ex.id);
    setLevelId('');
    setSessionNumber(null);
  }

  function pickLevel(lvl: ModuleLevel) {
    setLevelId(lvl.id);
    setSessionNumber(null);
  }

  const moduleExerciseCount = mod.exercises.length;

  return (
    <div className="modules-page modules-page--detail">
      <button type="button" className="modules-page__back" onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        Back to all modules
      </button>

      <header className="modules-page__detail-hero">
        <div className="modules-page__detail-hero-top">
          <span className="modules-page__domain-badge">{domain.name}</span>
          <div className="modules-page__detail-stats">
            <span className="modules-page__detail-stat">
              {moduleExerciseCount} exercise{moduleExerciseCount === 1 ? '' : 's'}
            </span>
            {exercise && levels.length > 0 && (
              <span className="modules-page__detail-stat">
                {totalQuestions} question{totalQuestions === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
        <h1>{mod.name}</h1>
        {mod.subtitle && <p className="modules-page__card-sub">{mod.subtitle}</p>}
        <p className="modules-page__detail-desc">{mod.description}</p>
      </header>

      {mod.exercises.length === 0 ? (
        <p className="modules-page__empty" role="status">
          No exercises in this module yet.
        </p>
      ) : (
        <div className="modules-page__detail-layout">
          <aside className="modules-page__exercise-sidebar" aria-label="Exercises">
            <div className="modules-page__sidebar-head">
              <h2>Exercises</h2>
            </div>
            <ul className="modules-page__exercise-list">
              {mod.exercises.map((ex) => {
                const selected = exercise?.id === ex.id;
                const exQuestions = exerciseQuestionCount(ex);
                return (
                  <li key={ex.id}>
                    <button
                      type="button"
                      className={
                        selected
                          ? 'modules-page__exercise-card modules-page__exercise-card--active'
                          : 'modules-page__exercise-card'
                      }
                      onClick={() => pickExercise(ex)}
                    >
                      <span className="modules-page__exercise-card-code">{ex.code}</span>
                      <span className="modules-page__exercise-card-name">{ex.name}</span>
                      <span className="modules-page__exercise-card-meta">
                        {exerciseModuleNames?.[ex.id] && (
                          <>{exerciseModuleNames[ex.id]} · </>
                        )}
                        {exQuestions > 0
                          ? `${exQuestions} question${exQuestions === 1 ? '' : 's'}`
                          : 'No questions yet'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="modules-page__detail-main">
            {!exercise ? (
              <p className="modules-page__empty modules-page__empty--inline">Select an exercise.</p>
            ) : (
              <>
                <section className="modules-page__exercise-banner">
                  <h2>{exercise.name}</h2>
                  {exerciseLoading && (
                    <span className="modules-page__loading-badge">Updating…</span>
                  )}
                </section>

                {exercise.mechanic && (
                  <p className="modules-page__mechanic-banner">
                    <strong>How it works:</strong> {exercise.mechanic}
                  </p>
                )}

                {levels.length === 0 ? (
                  <p className="modules-page__empty modules-page__empty--inline">
                    No difficulty levels configured for this exercise yet.
                  </p>
                ) : (
                  <>
                    <section className="modules-page__panel modules-page__panel--flush" aria-labelledby="levels-heading">
                      <div className="modules-page__panel-head">
                        <div>
                          <h2 id="levels-heading">Difficulty levels</h2>
                        </div>
                        {level && (
                          <span className="modules-page__level-badge">{displayLevel(level)}</span>
                        )}
                      </div>

                      <div className="modules-page__levels" role="group" aria-label="Difficulty levels">
                        {levels.map((lvl) => {
                          const selected = level?.id === lvl.id;
                          const count = levelQuestionCount(lvl);
                          return (
                            <button
                              key={lvl.id}
                              type="button"
                              aria-pressed={selected}
                              className={
                                selected
                                  ? 'modules-page__level-card modules-page__level-card--active'
                                  : 'modules-page__level-card'
                              }
                              onClick={() => pickLevel(lvl)}
                            >
                              <span className="modules-page__level-label">{displayLevel(lvl)}</span>
                              <span className="modules-page__level-count">{count}</span>
                              <span className="modules-page__level-meta">
                                {count === 1 ? 'question' : 'questions'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {level && level.sessions.length > 0 && (
                      <section className="modules-page__panel" aria-labelledby="sessions-heading">
                        <h2 id="sessions-heading" className="modules-page__panel-title">
                          Sessions — level {displayLevel(level)}
                        </h2>
                        <div className="modules-page__sessions" role="group" aria-label="Sessions">
                          {level.sessions.map((s) => {
                            const selected = sessionNumber === s.number;
                            return (
                              <button
                                key={s.number}
                                type="button"
                                aria-pressed={selected}
                                className={
                                  selected
                                    ? 'modules-page__session-card modules-page__session-card--active'
                                    : 'modules-page__session-card'
                                }
                                onClick={() => setSessionNumber(selected ? null : s.number)}
                              >
                                <span className="modules-page__session-num">Session {s.number}</span>
                                <span className="modules-page__session-name">{s.name}</span>
                                {s.itemCount != null && (
                                  <span className="modules-page__session-items">{s.itemCount} items</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {level && (
                      <section className="modules-page__panel" aria-labelledby="questions-heading">
                        <div className="modules-page__panel-head">
                          <div>
                            <h2 id="questions-heading">Question bank</h2>
                            <p className="modules-page__panel-hint">
                              {levelQuestionCount(level)} question
                              {levelQuestionCount(level) === 1 ? '' : 's'} at level {displayLevel(level)}
                            </p>
                          </div>
                        </div>

                        {questionsError && (
                          <p className="modules-page__error" role="alert">
                            {questionsError}
                          </p>
                        )}

                        {questionsLoading ? (
                          <p className="modules-page__empty modules-page__empty--inline">
                            Loading questions…
                          </p>
                        ) : questions.length === 0 ? (
                          <div className="modules-page__empty-state">
                            <p>No questions at this level yet.</p>
                            <span>Content is added by your platform admin.</span>
                          </div>
                        ) : (
                          <ol className="modules-page__question-list">
                            {questions.map((q, index) => (
                              <li key={q.id} className="modules-page__question-card">
                                <span className="modules-page__question-num">{index + 1}</span>
                                <div className="modules-page__question-body">
                                  <p className="modules-page__question-text">{questionPreview(q)}</p>
                                  {questionAnswerLabel(q) && (
                                    <p className="modules-page__question-answer">
                                      Answer: {questionAnswerLabel(q)}
                                    </p>
                                  )}
                                  {q.distractors && q.distractors.length > 0 && (
                                    <ul className="modules-page__question-options">
                                      {q.distractors.map((item) => (
                                        <li key={item.id}>{item.word}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {q.content?.options && q.content.options.length > 0 && (
                                    <ul className="modules-page__question-options">
                                      {q.content.options.map((opt, i) => (
                                        <li key={i}>{opt.text}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ol>
                        )}
                      </section>
                    )}
                  </>
                )}

                {session && level && (
                  <section
                    className="modules-page__panel modules-page__session-detail"
                    aria-labelledby="session-detail-heading"
                    role="region"
                  >
                    <h2 id="session-detail-heading" className="modules-page__panel-title">
                      Session {session.number}: {session.name}
                    </h2>
                    <dl>
                      <div>
                        <dt>Domain</dt>
                        <dd>{domain.name}</dd>
                      </div>
                      <div>
                        <dt>Exercise</dt>
                        <dd>
                          {exercise.code} — {exercise.name}
                        </dd>
                      </div>
                      <div>
                        <dt>Level</dt>
                        <dd>{displayLevel(level)}</dd>
                      </div>
                      <div>
                        <dt>Session</dt>
                        <dd>
                          {session.number} — {session.name}
                        </dd>
                      </div>
                      {session.itemCount != null && (
                        <div>
                          <dt>Items</dt>
                          <dd>{session.itemCount}</dd>
                        </div>
                      )}
                    </dl>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
