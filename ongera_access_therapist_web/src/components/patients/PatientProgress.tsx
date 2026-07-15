import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildPatientInsights } from '../../lib/patientInsights';
import { useExerciseNames } from '../../hooks/useExerciseNames';
import type { Patient, PatientProgressEntry } from '../../types/patients';
import './PatientProgress.css';

type Band = 'strong' | 'ontrack' | 'help' | 'none';

const BAND_LABEL: Record<Band, string> = {
  strong: 'Strong',
  ontrack: 'On track',
  help: 'Needs help',
  none: 'No data',
};

const BAND_COLOR: Record<Band, string> = {
  strong: 'var(--color-mint-dark)',
  ontrack: 'var(--color-warm-amber)',
  help: 'var(--color-error)',
  none: 'var(--color-border-strong)',
};

function entryAccuracy(entry: PatientProgressEntry): number | null {
  if (entry.averageScore != null) return entry.averageScore;
  if (entry.totalQuestions > 0) return (entry.totalCorrect / entry.totalQuestions) * 100;
  return null;
}

function bandFor(accuracy: number | null): Band {
  if (accuracy == null) return 'none';
  if (accuracy >= 75) return 'strong';
  if (accuracy >= 50) return 'ontrack';
  return 'help';
}

function bandPriority(band: Band) {
  if (band === 'help') return 0;
  if (band === 'ontrack') return 1;
  if (band === 'strong') return 2;
  return 3;
}

export function PatientProgress({ patient }: { patient: Patient }) {
  const { names, isLoading: namesLoading } = useExerciseNames();
  const entries = useMemo(() => patient.progressEntries ?? [], [patient.progressEntries]);

  const nameFor = (exerciseId: string) =>
    names.get(exerciseId)?.name ?? `Exercise ${exerciseId.slice(0, 6)}`;
  const codeFor = (exerciseId: string) =>
    names.get(exerciseId)?.code ?? exerciseId.slice(0, 3).toUpperCase();

  const summary = useMemo(() => {
    const totalQuestions = entries.reduce((sum, e) => sum + e.totalQuestions, 0);
    const totalCorrect = entries.reduce((sum, e) => sum + e.totalCorrect, 0);
    const scored = entries.map(entryAccuracy).filter((v): v is number => v != null);

    let overallAccuracy: number | null = null;
    if (totalQuestions > 0) {
      overallAccuracy = Math.round((totalCorrect / totalQuestions) * 100);
    } else if (scored.length > 0) {
      overallAccuracy = Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
    } else {
      overallAccuracy = patient.accuracy;
    }

    const bestStreak = Math.max(patient.streakDays, 0, ...entries.map((e) => e.streakDays));

    return {
      totalQuestions,
      totalCorrect,
      overallAccuracy,
      bestStreak,
      activeExercises: entries.length,
    };
  }, [entries, patient.accuracy, patient.streakDays]);

  const insights = useMemo(
    () => buildPatientInsights(patient, entries, nameFor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patient, entries, names],
  );

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const bandDiff =
          bandPriority(bandFor(entryAccuracy(a))) - bandPriority(bandFor(entryAccuracy(b)));
        if (bandDiff !== 0) return bandDiff;
        return (entryAccuracy(a) ?? 0) - (entryAccuracy(b) ?? 0);
      }),
    [entries],
  );

  const accuracyChartData = useMemo(
    () =>
      entries
        .map((entry) => {
          const accuracy = entryAccuracy(entry);
          return {
            code: codeFor(entry.exerciseId),
            name: nameFor(entry.exerciseId),
            accuracy: accuracy != null ? Math.round(accuracy) : 0,
            hasData: accuracy != null,
            band: bandFor(accuracy),
          };
        })
        .filter((d) => d.hasData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, names],
  );

  const sessionsChartData = useMemo(
    () =>
      entries
        .filter((entry) => entry.totalSessions > 0)
        .map((entry) => ({
          code: codeFor(entry.exerciseId),
          name: nameFor(entry.exerciseId),
          sessions: entry.totalSessions,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, names],
  );

  const hintsChartData = useMemo(
    () =>
      entries
        .filter((entry) => entry.hintsUsed > 0)
        .map((entry) => ({
          code: codeFor(entry.exerciseId),
          name: nameFor(entry.exerciseId),
          hints: entry.hintsUsed,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, names],
  );

  const recentSessions = useMemo(
    () =>
      [...(patient.sessions ?? [])]
        .sort((a, b) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 8),
    [patient.sessions],
  );

  const overallBand = bandFor(summary.overallAccuracy);
  const hasAnyActivity =
    entries.length > 0 ||
    patient.totalSessions > 0 ||
    patient.accuracy != null ||
    patient.lastSession != null ||
    (patient.sessions?.length ?? 0) > 0;

  if (!hasAnyActivity) {
    return (
      <section className="patients-page__panel" aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="patients-page__panel-title">
          Progress
        </h2>
        <div className="pp-empty">
          <p className="pp-empty__title">No activity recorded yet</p>
          <p className="pp-empty__hint">
            Once {patient.name.split(' ')[0]} starts practising, session accuracy, streaks and
            per-exercise progress will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {insights.length > 0 && (
        <section className="patients-page__panel pp-insights-panel" aria-labelledby="insights-heading">
          <h2 id="insights-heading" className="patients-page__panel-title">
            Clinical insights
          </h2>
          <ul className="pp-insights">
            {insights.map((insight) => (
              <li key={insight.id} className={`pp-insight pp-insight--${insight.tone}`}>
                <p className="pp-insight__title">{insight.title}</p>
                <p className="pp-insight__detail">{insight.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="patients-page__panel" aria-labelledby="progress-heading">
        <div className="pp-head">
          <h2 id="progress-heading" className="patients-page__panel-title pp-head__title">
            Progress overview
          </h2>
          <span className={`pp-badge pp-badge--${overallBand}`}>{BAND_LABEL[overallBand]}</span>
        </div>

        <div className="pp-kpis">
          <div className="pp-kpi">
            <span className="pp-kpi__label">Overall accuracy</span>
            <span className={`pp-kpi__value pp-kpi__value--${overallBand}`}>
              {summary.overallAccuracy != null ? `${summary.overallAccuracy}%` : '—'}
            </span>
            <span className="pp-kpi__meta">across all exercises</span>
          </div>
          <div className="pp-kpi">
            <span className="pp-kpi__label">Questions answered</span>
            <span className="pp-kpi__value">
              {summary.totalQuestions > 0 ? summary.totalQuestions.toLocaleString() : '—'}
            </span>
            <span className="pp-kpi__meta">
              {summary.totalQuestions > 0
                ? `${summary.totalCorrect.toLocaleString()} correct`
                : 'no question data yet'}
            </span>
          </div>
          <div className="pp-kpi">
            <span className="pp-kpi__label">Total sessions</span>
            <span className="pp-kpi__value">{patient.totalSessions}</span>
            <span className="pp-kpi__meta">
              {patient.sessionsThisWeek != null
                ? `${patient.sessionsThisWeek} this week`
                : 'all time'}
            </span>
          </div>
          <div className="pp-kpi">
            <span className="pp-kpi__label">Best streak</span>
            <span className="pp-kpi__value">{summary.bestStreak > 0 ? summary.bestStreak : '—'}</span>
            <span className="pp-kpi__meta">high-score days</span>
          </div>
          <div className="pp-kpi">
            <span className="pp-kpi__label">Hints used</span>
            <span className="pp-kpi__value">{patient.totalHintsUsed}</span>
            <span className="pp-kpi__meta">
              {patient.avgHintsPerSession != null
                ? `${patient.avgHintsPerSession} avg per session`
                : 'across completed sessions'}
            </span>
          </div>
          <div className="pp-kpi">
            <span className="pp-kpi__label">Current level</span>
            <span className="pp-kpi__value pp-kpi__value--sm">{patient.level ?? '—'}</span>
            <span className="pp-kpi__meta">primary exercise</span>
          </div>
          <div className="pp-kpi">
            <span className="pp-kpi__label">Last active</span>
            <span className="pp-kpi__value pp-kpi__value--sm">{patient.lastSession ?? '—'}</span>
            <span className="pp-kpi__meta">most recent session</span>
          </div>
        </div>
      </section>

      {(accuracyChartData.length > 0 || sessionsChartData.length > 0 || hintsChartData.length > 0) && (
        <div className="pp-charts">
          {accuracyChartData.length > 0 && (
            <section className="patients-page__panel" aria-labelledby="accuracy-chart-heading">
              <h2 id="accuracy-chart-heading" className="patients-page__panel-title">
                Accuracy by exercise
              </h2>
              <div className="pp-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={accuracyChartData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-divider)" vertical={false} />
                    <XAxis
                      dataKey="code"
                      tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-divider)' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--color-cloud-gray)' }}
                      formatter={(value) => [`${value}%`, 'Accuracy']}
                      labelFormatter={(_label, payload) =>
                        payload && payload.length ? payload[0].payload.name : ''
                      }
                    />
                    <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} maxBarSize={64} isAnimationActive={false}>
                      {accuracyChartData.map((d) => (
                        <Cell key={d.code} fill={BAND_COLOR[d.band]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="pp-legend" aria-hidden="true">
                <li>
                  <span className="pp-legend__dot" style={{ background: BAND_COLOR.strong }} /> Strong (75%+)
                </li>
                <li>
                  <span className="pp-legend__dot" style={{ background: BAND_COLOR.ontrack }} /> On track (50–74%)
                </li>
                <li>
                  <span className="pp-legend__dot" style={{ background: BAND_COLOR.help }} /> Needs help (&lt;50%)
                </li>
              </ul>
            </section>
          )}

          {sessionsChartData.length > 0 && (
            <section className="patients-page__panel" aria-labelledby="sessions-chart-heading">
              <h2 id="sessions-chart-heading" className="patients-page__panel-title">
                Sessions by exercise
              </h2>
              <div className="pp-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sessionsChartData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-divider)" vertical={false} />
                    <XAxis
                      dataKey="code"
                      tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-divider)' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--color-cloud-gray)' }}
                      formatter={(value) => [value, 'Sessions']}
                      labelFormatter={(_label, payload) =>
                        payload && payload.length ? payload[0].payload.name : ''
                      }
                    />
                    <Bar
                      dataKey="sessions"
                      fill="var(--color-mint-dark)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={64}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
          {hintsChartData.length > 0 && (
            <section className="patients-page__panel" aria-labelledby="hints-chart-heading">
              <h2 id="hints-chart-heading" className="patients-page__panel-title">
                Hints by exercise
              </h2>
              <div className="pp-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={hintsChartData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-divider)" vertical={false} />
                    <XAxis
                      dataKey="code"
                      tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-divider)' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--color-cloud-gray)' }}
                      formatter={(value) => [value, 'Hints']}
                      labelFormatter={(_label, payload) =>
                        payload && payload.length ? payload[0].payload.name : ''
                      }
                    />
                    <Bar
                      dataKey="hints"
                      fill="var(--color-warm-amber)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={64}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>
      )}

      {recentSessions.length > 0 && (
        <section className="patients-page__panel" aria-labelledby="recent-sessions-heading">
          <h2 id="recent-sessions-heading" className="patients-page__panel-title">
            Recent sessions
          </h2>
          <div className="patients-page__table-wrap">
            <table className="patients-page__table pp-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Exercise</th>
                  <th scope="col">Score</th>
                  <th scope="col">Correct</th>
                  <th scope="col">Hints</th>
                  <th scope="col">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.completedLabel ?? '—'}</td>
                    <td className="pp-table__ex-name">{nameFor(session.exerciseId)}</td>
                    <td>{session.score != null ? `${Math.round(session.score)}%` : '—'}</td>
                    <td>
                      {session.totalQuestions > 0
                        ? `${session.questionsCorrect}/${session.totalQuestions}`
                        : '—'}
                    </td>
                    <td>
                      <span className={session.hintsUsed > 0 ? 'pp-hints pp-hints--used' : 'pp-hints'}>
                        {session.hintsUsed}
                      </span>
                    </td>
                    <td>
                      {session.durationSeconds != null
                        ? `${Math.round(session.durationSeconds / 60)} min`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {sortedEntries.length > 0 && (
        <section className="patients-page__panel" aria-labelledby="exercises-heading">
          <div className="pp-head">
            <h2 id="exercises-heading" className="patients-page__panel-title pp-head__title">
              Exercise breakdown
            </h2>
            {namesLoading && <span className="pp-loading">Loading names…</span>}
          </div>
          <div className="patients-page__table-wrap">
            <table className="patients-page__table pp-table">
              <thead>
                <tr>
                  <th scope="col">Exercise</th>
                  <th scope="col">Level</th>
                  <th scope="col">Accuracy</th>
                  <th scope="col">Correct</th>
                  <th scope="col">Sessions</th>
                  <th scope="col">Hints</th>
                  <th scope="col">Streak</th>
                  <th scope="col">Last session</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry) => {
                  const accuracy = entryAccuracy(entry);
                  const band = bandFor(accuracy);
                  return (
                    <tr key={entry.exerciseId}>
                      <td className="pp-table__ex">
                        <span className="pp-table__ex-name">{nameFor(entry.exerciseId)}</span>
                        {names.get(entry.exerciseId)?.moduleName && (
                          <span className="pp-table__ex-module">
                            {names.get(entry.exerciseId)?.moduleName}
                          </span>
                        )}
                      </td>
                      <td>{entry.currentLevel ?? '—'}</td>
                      <td>
                        <div className="pp-bar" aria-hidden="true">
                          <span
                            className="pp-bar__fill"
                            style={{
                              width: `${accuracy != null ? Math.round(accuracy) : 0}%`,
                              background: BAND_COLOR[band],
                            }}
                          />
                        </div>
                        <span className="pp-bar__value">
                          {accuracy != null ? `${Math.round(accuracy)}%` : '—'}
                        </span>
                      </td>
                      <td>
                        {entry.totalQuestions > 0
                          ? `${entry.totalCorrect}/${entry.totalQuestions}`
                          : '—'}
                      </td>
                      <td>{entry.totalSessions}</td>
                      <td>
                        <span className={entry.hintsUsed > 0 ? 'pp-hints pp-hints--used' : 'pp-hints'}>
                          {entry.hintsUsed}
                        </span>
                      </td>
                      <td>{entry.streakDays > 0 ? `${entry.streakDays}` : '—'}</td>
                      <td>{entry.lastSessionLabel ?? '—'}</td>
                      <td>
                        <span className={`pp-badge pp-badge--${band}`}>{BAND_LABEL[band]}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
