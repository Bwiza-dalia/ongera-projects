import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useExerciseNames } from '../../hooks/useExerciseNames';
import { chartTickStyle, chartTooltipStyle } from '../../styles/chartTypography';
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
  // Prefer question totals from the progress API; fall back to average_score.
  if (entry.totalQuestions > 0) return (entry.totalCorrect / entry.totalQuestions) * 100;
  if (entry.averageScore != null) return entry.averageScore;
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

export type ProgressSection = 'kpis' | 'chart' | 'sessions' | 'exercises';

const ALL_SECTIONS: ProgressSection[] = ['kpis', 'chart', 'sessions', 'exercises'];

export function PatientProgress({
  patient,
  sections = ALL_SECTIONS,
  embedded = false,
}: {
  patient: Patient;
  sections?: ProgressSection[];
  /** Flatten section chrome when nested inside another card. */
  embedded?: boolean;
}) {
  const show = (section: ProgressSection) => sections.includes(section);
  const sectionClass = embedded
    ? 'patients-page__section patients-page__section--plain'
    : 'patients-page__section';

  const { names, isLoading: namesLoading } = useExerciseNames();
  const entries = useMemo(() => patient.progressEntries ?? [], [patient.progressEntries]);

  const nameFor = (exerciseId: string) =>
    names.get(exerciseId)?.name ?? 'Exercise';
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

  const exerciseTrendData = useMemo(
    () =>
      entries
        .map((entry) => {
          const accuracy = entryAccuracy(entry);
          return {
            code: codeFor(entry.exerciseId),
            name: nameFor(entry.exerciseId),
            accuracy: accuracy != null ? Math.round(accuracy) : null,
            sessions: entry.totalSessions > 0 ? entry.totalSessions : null,
            hints: entry.hintsUsed > 0 ? entry.hintsUsed : null,
          };
        })
        .filter((d) => d.accuracy != null || d.sessions != null || d.hints != null),
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
    if (!show('kpis') && !show('sessions') && !show('exercises')) {
      return null;
    }
    return (
      <section className={sectionClass} aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="patients-page__section-title">
          Progress
        </h2>
        <div className="pp-empty">
          <p className="pp-empty__title">No activity recorded yet</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {show('kpis') && (
        <section className={sectionClass} aria-labelledby="progress-heading">
          <div className="pp-head">
            <h2 id="progress-heading" className="patients-page__section-title pp-head__title">
              Progress
            </h2>
            <span className={`pp-band pp-band--${overallBand}`}>{BAND_LABEL[overallBand]}</span>
          </div>

          <dl className="pp-kpis">
            <div className="pp-kpi">
              <dt>Accuracy</dt>
              <dd className={`pp-kpi__value pp-kpi__value--${overallBand}`}>
                {summary.overallAccuracy != null ? `${summary.overallAccuracy}%` : '—'}
              </dd>
            </div>
            <div className="pp-kpi">
              <dt>Questions</dt>
              <dd className="pp-kpi__value">
                {summary.totalQuestions > 0 ? summary.totalQuestions.toLocaleString() : '—'}
              </dd>
            </div>
            <div className="pp-kpi">
              <dt>Sessions</dt>
              <dd className="pp-kpi__value">{patient.totalSessions}</dd>
            </div>
            <div className="pp-kpi">
              <dt>Hints</dt>
              <dd className="pp-kpi__value">{patient.totalHintsUsed}</dd>
            </div>
            <div className="pp-kpi">
              <dt>Best streak</dt>
              <dd className="pp-kpi__value">{summary.bestStreak > 0 ? summary.bestStreak : '—'}</dd>
            </div>
          </dl>
        </section>
      )}

      {show('chart') && exerciseTrendData.length > 0 && (
        <section className={`${sectionClass} pp-chart-panel`} aria-labelledby="exercise-trend-heading">
          <h2 id="exercise-trend-heading" className="patients-page__section-title">
            Progress by exercise
          </h2>
          <div className="pp-chart pp-chart--wide">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={exerciseTrendData}
                margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-divider)" vertical={false} />
                <XAxis
                  dataKey="code"
                  tick={chartTickStyle}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-divider)' }}
                />
                <YAxis
                  yAxisId="percent"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={chartTickStyle}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                  width={48}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  allowDecimals={false}
                  tick={chartTickStyle}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value, name) => {
                    if (value == null) return ['—', String(name)];
                    if (name === 'Accuracy') return [`${value}%`, 'Accuracy'];
                    return [value, String(name)];
                  }}
                  labelFormatter={(_label, payload) =>
                    payload && payload.length ? payload[0].payload.name : ''
                  }
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}
                />
                <Line
                  yAxisId="percent"
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy"
                  stroke="var(--color-mint-dark)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'var(--color-mint-dark)', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="sessions"
                  name="Sessions"
                  stroke="var(--color-therapy-blue)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'var(--color-therapy-blue)', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="hints"
                  name="Hints"
                  stroke="var(--color-warm-amber)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'var(--color-warm-amber)', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {show('sessions') && recentSessions.length > 0 && (
        <section className={sectionClass} aria-labelledby="recent-sessions-heading">
          <h2 id="recent-sessions-heading" className="patients-page__section-title">
            Recent sessions
          </h2>
          <div className="patients-page__table-wrap patients-page__table-wrap--nested">
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

      {show('exercises') && sortedEntries.length > 0 && (
        <section className={sectionClass} aria-labelledby="exercises-heading">
          <div className="pp-head">
            <h2 id="exercises-heading" className="patients-page__section-title pp-head__title">
              Exercises
            </h2>
            {namesLoading && <span className="pp-loading">Loading names…</span>}
          </div>
          <div className="patients-page__table-wrap patients-page__table-wrap--nested">
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
                        <span className={`pp-band pp-band--${band}`}>{BAND_LABEL[band]}</span>
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
