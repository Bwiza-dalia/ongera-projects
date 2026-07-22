import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PatientProgress } from '../patients/PatientProgress';
import {
  scopePatientToWeek,
  therapyCompletionForWeek,
} from '../../lib/weeklyReports';
import { getCarePlan } from '../../services/carePlanService';
import { chartTickStyle, chartTooltipStyle } from '../../styles/chartTypography';
import type { Patient } from '../../types/patients';
import type { WeekRange, WeeklyReport } from '../../types/reports';
import '../../pages/Patients/PatientsPage.css';
import '../patients/PatientProgress.css';

function statusLabel(status: WeeklyReport['status']) {
  switch (status) {
    case 'reviewed':
      return 'Reviewed';
    case 'no_activity':
      return 'No activity';
    default:
      return 'Ready';
  }
}

function formatDuration(totalMinutes: number | undefined) {
  if (totalMinutes == null || totalMinutes <= 0) return '—';
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function WeeklyReportDetail({
  report,
  patient,
  week,
  onBack,
}: {
  report: WeeklyReport;
  patient: Patient;
  week: WeekRange;
  onBack: () => void;
}) {
  const weekPatient = useMemo(() => scopePatientToWeek(patient, week), [patient, week]);

  const completion = useMemo(() => {
    const plan = getCarePlan(patient.id);
    const therapyDays = plan?.therapyDays ?? [];
    if (therapyDays.length === 0) return null;
    return therapyCompletionForWeek(therapyDays, weekPatient.sessions ?? [], week);
  }, [patient.id, week, weekPatient.sessions]);

  const historicalTrend = useMemo(() => {
    const sessions = [...(patient.sessions ?? [])]
      .filter((s) => s.status.toUpperCase() === 'COMPLETED' && s.completedAt && s.score != null)
      .sort(
        (a, b) =>
          new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime(),
      )
      .slice(-16);

    return sessions.map((session) => ({
      label: new Date(session.completedAt!).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      score: Math.round(session.score ?? 0),
    }));
  }, [patient.sessions]);

  return (
    <div className="reports-page reports-page--detail">
      <button type="button" className="reports-page__back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to reports
      </button>

      <header className="reports-page__detail-hero">
        <p className="reports-page__breadcrumb">Weekly patient report</p>
        <h1>{report.patientName}</h1>
        <p className="reports-page__detail-meta">
          {report.weekLabel}
          {report.module ? ` · ${report.module}` : ''}
        </p>
        <span className={`reports-page__status reports-page__status--large reports-page__status--${report.status}`}>
          {statusLabel(report.status)}
        </span>
      </header>

      <section className="reports-page__panel">
        <h2 className="reports-page__panel-title">Summary</h2>
        <p className="reports-page__summary">{report.summary}</p>
        {report.highlights.length > 0 && (
          <ul className="reports-page__highlights">
            {report.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="reports-page__panel">
        <h2 className="reports-page__panel-title">Statistics</h2>
        <dl className="reports-page__meta-grid">
          <div>
            <dt>Sessions</dt>
            <dd>{report.sessionsCompleted}</dd>
          </div>
          <div>
            <dt>Avg accuracy</dt>
            <dd>{report.avgAccuracy != null ? `${report.avgAccuracy}%` : '—'}</dd>
          </div>
          <div>
            <dt>Questions</dt>
            <dd>
              {report.totalQuestions
                ? `${report.questionsCorrect ?? 0}/${report.totalQuestions}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt>Practice time</dt>
            <dd>{formatDuration(report.totalMinutes)}</dd>
          </div>
          <div>
            <dt>Hints used</dt>
            <dd>{report.totalHints ?? 0}</dd>
          </div>
          <div>
            <dt>Week streak</dt>
            <dd>{report.streakDays > 0 ? `${report.streakDays}d` : '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="reports-page__panel">
        <h2 className="reports-page__panel-title">Therapy completion</h2>
        {completion && completion.scheduledDays > 0 ? (
          <>
            <dl className="reports-page__meta-grid">
              <div>
                <dt>Scheduled days</dt>
                <dd>{completion.scheduledDays}</dd>
              </div>
              <div>
                <dt>Completed days</dt>
                <dd>{completion.completedDays}</dd>
              </div>
              <div>
                <dt>Missed days</dt>
                <dd>{completion.missedDays}</dd>
              </div>
              <div>
                <dt>Completion</dt>
                <dd>{completion.percent != null ? `${completion.percent}%` : '—'}</dd>
              </div>
            </dl>
            <div
              className="reports-page__completion-bar"
              role="progressbar"
              aria-valuenow={completion.percent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Therapy completion"
            >
              <span
                className="reports-page__completion-bar-fill"
                style={{ width: `${completion.percent ?? 0}%` }}
              />
            </div>
          </>
        ) : (
          <p className="reports-page__notes">
            No care-plan exercise days are set for this patient, so therapy completion cannot be
            calculated for the week. Session activity is still shown below.
          </p>
        )}
      </section>

      <section className="reports-page__panel reports-page__panel--progress">
        <h2 className="reports-page__panel-title">Progress</h2>
        <PatientProgress
          patient={weekPatient}
          sections={['kpis']}
          embedded
          hideTitles
        />
      </section>

      <section className="reports-page__panel reports-page__panel--progress">
        <h2 className="reports-page__panel-title">Scores</h2>
        <PatientProgress
          patient={weekPatient}
          sections={['chart', 'exercises']}
          embedded
          hideTitles
        />
      </section>

      <section className="reports-page__panel reports-page__panel--progress">
        <h2 className="reports-page__panel-title">Historical performance</h2>
        {historicalTrend.length > 1 ? (
          <div className="reports-page__history-chart">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={historicalTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-divider)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={chartTickStyle}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-divider)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={chartTickStyle}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                  width={42}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => [`${value}%`, 'Score']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-therapy-blue)"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: 'var(--color-therapy-blue)', strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="reports-page__notes">Not enough scored sessions yet for a trend chart.</p>
        )}
        <div className="reports-page__history-sessions">
          <h3 className="reports-page__subheading">Recent sessions</h3>
          <PatientProgress
            patient={patient}
            sections={['sessions']}
            embedded
            hideTitles
            sessionLimit={12}
          />
        </div>
      </section>

      {report.clinicianNotes && (
        <section className="reports-page__panel">
          <h2 className="reports-page__panel-title">Care plan notes</h2>
          <p className="reports-page__notes">{report.clinicianNotes}</p>
        </section>
      )}
    </div>
  );
}
