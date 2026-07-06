import { useEffect, useMemo, useState } from 'react';
import {
  useDomainModules,
  useExerciseDetail,
  useExerciseQuestions,
  useModuleCatalog,
  useModuleDetail,
} from '../../hooks/useModules';
import { catalogTotals } from '../../services/moduleService';
import { questionAnswerLabel, questionPreview } from '../../lib/questionUtils';
import type {
  ModuleExercise,
  ModuleLevel,
  TherapyDomain,
  TherapyDomainId,
  TherapyModule,
} from '../../types/modules';
import './ModulesPage.css';

function moduleStats(mod: TherapyModule) {
  const exercises = mod.exercises.length;
  const levels = mod.exercises.reduce((n, ex) => n + ex.levels.length, 0);
  const questions = mod.exercises.reduce(
    (n, ex) => n + ex.levels.reduce((sum, lvl) => sum + (lvl.questionCount ?? 0), 0),
    0,
  );
  const sessions = Math.max(
    0,
    ...mod.exercises.flatMap((ex) => ex.levels.map((l) => l.sessions.length)),
  );
  return { exercises, levels, questions, sessions };
}

function domainStats(domain: TherapyDomain) {
  const modules = domain.modules.length;
  const exercises = domain.modules.reduce((n, m) => n + m.exercises.length, 0);
  return { modules, exercises };
}

export function ModulesPage() {
  const { catalog, isLoading, error, reload } = useModuleCatalog();
  const [openDomainId, setOpenDomainId] = useState<TherapyDomainId | null>(null);
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);

  const openDomain = openDomainId
    ? catalog.domains.find((d) => d.id === openDomainId) ?? null
    : null;

  const totals = catalogTotals(catalog);

  if (openModuleId && openDomain) {
    return (
      <ModuleDetailView
        domain={openDomain}
        moduleId={openModuleId}
        onBack={() => setOpenModuleId(null)}
      />
    );
  }

  if (openDomain) {
    return (
      <DomainView
        domain={openDomain}
        onBack={() => setOpenDomainId(null)}
        onOpenModule={(id) => setOpenModuleId(id)}
      />
    );
  }

  return (
    <div className="modules-page">
      <header className="modules-page__hero">
        <h1>Modules</h1>
        <p>
          {isLoading
            ? 'Loading catalog…'
            : `${totals.modules} module${totals.modules === 1 ? '' : 's'} · ${totals.exercises} exercise${totals.exercises === 1 ? '' : 's'}`}
        </p>
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

function DomainCard({
  domain,
  onOpen,
}: {
  domain: TherapyDomain;
  onOpen: () => void;
}) {
  const stats = domainStats(domain);

  return (
    <article className="modules-page__card modules-page__card--domain">
      <span className="modules-page__tag">Therapy domain</span>
      <h2 className="modules-page__card-title">{domain.name}</h2>
      <p className="modules-page__card-desc">{domain.description}</p>

      <div className="modules-page__stat-pills">
        <span className="modules-page__stat-pill">{stats.modules} modules</span>
        <span className="modules-page__stat-pill">{stats.exercises} exercises</span>
      </div>

      {domain.modules.length > 0 && (
        <>
          <p className="modules-page__list-heading" id={`includes-${domain.id}`}>
            Includes
          </p>
          <ul className="modules-page__card-list" aria-labelledby={`includes-${domain.id}`}>
            {domain.modules.map((m) => (
              <li key={m.id}>{m.name}</li>
            ))}
          </ul>
        </>
      )}

      <button
        type="button"
        className="modules-page__open-btn"
        onClick={onOpen}
        aria-label={`Open ${domain.name}`}
      >
        Open {domain.name}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </article>
  );
}

function DomainView({
  domain,
  onBack,
  onOpenModule,
}: {
  domain: TherapyDomain;
  onBack: () => void;
  onOpenModule: (id: string) => void;
}) {
  const { modules, isLoading, error } = useDomainModules(domain);
  const [search, setSearch] = useState('');
  const searchId = `search-${domain.id}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.subtitle?.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q),
    );
  }, [modules, search]);

  return (
    <div className="modules-page">
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

      {error && (
        <p className="modules-page__error" role="alert">
          {error}
        </p>
      )}

      <div className="modules-page__search-wrap">
        <label className="modules-page__search-label" htmlFor={searchId}>
          Search modules
        </label>
        <div className="modules-page__search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            id={searchId}
            type="search"
            placeholder="Name or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <h2 className="modules-page__section-heading">
        {isLoading ? 'Loading…' : `${filtered.length} module${filtered.length === 1 ? '' : 's'}`}
      </h2>

      {!isLoading && filtered.length === 0 ? (
        <p className="modules-page__empty" role="status">
          {modules.length === 0
            ? 'No modules in this domain yet.'
            : 'No modules match your search.'}
        </p>
      ) : (
        <div className="modules-page__grid">
          {filtered.map((mod) => (
            <ChildModuleCard key={mod.id} mod={mod} onOpen={() => onOpenModule(mod.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChildModuleCard({
  mod,
  onOpen,
}: {
  mod: TherapyModule;
  onOpen: () => void;
}) {
  const stats = moduleStats(mod);

  return (
    <article className="modules-page__card modules-page__card--child">
      {mod.subtitle && <span className="modules-page__tag">{mod.subtitle}</span>}
      <h2 className="modules-page__card-title">{mod.name}</h2>
      <p className="modules-page__card-desc">{mod.description}</p>

      <div className="modules-page__stat-pills">
        <span className="modules-page__stat-pill">{stats.exercises} exercises</span>
        {stats.levels > 0 && (
          <span className="modules-page__stat-pill">{stats.levels} levels</span>
        )}
        {stats.sessions > 0 ? (
          <span className="modules-page__stat-pill">{stats.sessions} sessions</span>
        ) : stats.questions > 0 ? (
          <span className="modules-page__stat-pill">{stats.questions} questions</span>
        ) : null}
      </div>

      <button
        type="button"
        className="modules-page__open-btn"
        onClick={onOpen}
        aria-label={`Open ${mod.name}`}
      >
        Open {mod.name}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </article>
  );
}

function ModuleDetailView({
  domain,
  moduleId,
  onBack,
}: {
  domain: TherapyDomain;
  moduleId: string;
  onBack: () => void;
}) {
  const { mod, isLoading, error } = useModuleDetail(moduleId);

  if (isLoading) {
    return (
      <div className="modules-page modules-page--detail">
        <button type="button" className="modules-page__back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          Back to {domain.name}
        </button>
        <p className="modules-page__empty" role="status">
          Loading module…
        </p>
      </div>
    );
  }

  if (error || !mod) {
    return (
      <div className="modules-page modules-page--detail">
        <button type="button" className="modules-page__back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          Back to {domain.name}
        </button>
        <p className="modules-page__error" role="alert">
          {error ?? 'Module not found'}
        </p>
      </div>
    );
  }

  return <ModuleDetail domain={domain} mod={mod} onBack={onBack} />;
}

function ModuleDetail({
  domain,
  mod,
  onBack,
}: {
  domain: TherapyDomain;
  mod: TherapyModule;
  onBack: () => void;
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
        Back to {domain.name}
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
        <div className="modules-page__clinical">
          <span className="modules-page__clinical-label">Clinical target</span>
          <p>{mod.clinicalTarget}</p>
        </div>
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
              <p>Pick one to explore levels and questions</p>
            </div>
            <ul className="modules-page__exercise-list">
              {mod.exercises.map((ex) => {
                const selected = exercise?.id === ex.id;
                const exQuestions = selected
                  ? totalQuestions
                  : ex.levels.reduce((n, l) => n + (l.questionCount ?? 0), 0);
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
                  <div>
                    <p className="modules-page__banner-eyebrow">Selected exercise</p>
                    <h2>{exercise.name}</h2>
                    <p>{exercise.description}</p>
                  </div>
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
                          <p className="modules-page__panel-hint">
                            Choose a level to preview the question bank
                          </p>
                        </div>
                        {level && (
                          <span className="modules-page__level-badge">{level.label}</span>
                        )}
                      </div>

                      <div className="modules-page__levels" role="group" aria-label="Difficulty levels">
                        {levels.map((lvl) => {
                          const selected = level?.id === lvl.id;
                          const count = lvl.questionCount ?? 0;
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
                              <span className="modules-page__level-label">{lvl.label}</span>
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
                          Sessions — {level.label}
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
                              {level.questionCount ?? 0} question
                              {(level.questionCount ?? 0) === 1 ? '' : 's'} at {level.label.toLowerCase()}{' '}
                              level
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
                        <dd>{level.label}</dd>
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
