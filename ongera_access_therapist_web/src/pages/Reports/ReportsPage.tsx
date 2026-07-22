import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '../../components/dashboard/StatCard';
import { WeekPicker } from '../../components/reports/WeekPicker';
import { usePatients } from '../../hooks/usePatients';
import {
  buildCaseloadWeekStats,
  buildWeeklyReports,
  weekRangeContaining,
} from '../../lib/weeklyReports';
import { chartTickStyle, chartTooltipStyle } from '../../styles/chartTypography';
import type { WeekRange, WeeklyReport } from '../../types/reports';
import '../../components/dashboard/ChartCard.css';
import './ReportsPage.css';

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

function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name.slice(0, 12);
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function ReportsPage() {
  const { patients, isLoading, error, reload } = usePatients();
  const [week, setWeek] = useState<WeekRange>(() => weekRangeContaining(new Date(), 0));
  const [search, setSearch] = useState('');

  const reports = useMemo(
    () => buildWeeklyReports(patients, week),
    [patients, week],
  );

  const stats = useMemo(() => buildCaseloadWeekStats(reports), [reports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (report) =>
        report.patientName.toLowerCase().includes(q) ||
        (report.module?.toLowerCase().includes(q) ?? false),
    );
  }, [reports, search]);

  const activityPie = useMemo(
    () =>
      [
        { name: 'With sessions', value: stats.activePatients },
        { name: 'No sessions', value: stats.inactivePatients },
      ].filter((d) => d.value > 0),
    [stats.activePatients, stats.inactivePatients],
  );

  const sessionsByPatient = useMemo(
    () =>
      [...reports]
        .sort((a, b) => b.sessionsCompleted - a.sessionsCompleted)
        .slice(0, 8)
        .map((report) => ({
          name: shortName(report.patientName),
          fullName: report.patientName,
          sessions: report.sessionsCompleted,
        })),
    [reports],
  );

  const accuracyByPatient = useMemo(
    () =>
      reports
        .filter((report) => report.avgAccuracy != null)
        .sort((a, b) => (b.avgAccuracy ?? 0) - (a.avgAccuracy ?? 0))
        .slice(0, 8)
        .map((report) => ({
          name: shortName(report.patientName),
          fullName: report.patientName,
          accuracy: report.avgAccuracy ?? 0,
        })),
    [reports],
  );

  return (
    <div className="reports-page">
      <header className="reports-page__hero">
        <h1 className="app-page-title">Reports</h1>
      </header>

      {error && (
        <div className="reports-page__empty-card" role="alert">
          <p>{error}</p>
          <button type="button" className="reports-page__view-btn" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      <div className="reports-page__toolbar">
        <div>
          <label className="reports-page__search-label" htmlFor="report-search">
            Search patients
          </label>
          <div className="reports-page__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            <input
              id="report-search"
              type="search"
              placeholder="Name or module"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <WeekPicker value={week} onChange={setWeek} disabled={isLoading} />
      </div>

      <div className="reports-page__stats">
        <StatCard
          label="Assigned patients"
          value={isLoading ? '…' : stats.assignedPatients}
          badge={week.label}
          badgeTone="neutral"
          accent="blue"
        />
        <StatCard
          label="Active this week"
          value={isLoading ? '…' : stats.activePatients}
          badge={
            isLoading
              ? undefined
              : stats.assignedPatients > 0
                ? `${Math.round((stats.activePatients / stats.assignedPatients) * 100)}% of caseload`
                : 'None yet'
          }
          badgeTone="positive"
          accent="mint"
        />
        <StatCard
          label="Sessions"
          value={isLoading ? '…' : stats.totalSessions}
          badge={
            isLoading
              ? undefined
              : stats.totalMinutes > 0
                ? `${stats.totalMinutes} min practiced`
                : 'No practice time'
          }
          badgeTone="neutral"
          accent="amber"
        />
        <StatCard
          label="Avg accuracy"
          value={
            isLoading ? '…' : stats.avgAccuracy != null ? `${stats.avgAccuracy}%` : '—'
          }
          badge={
            isLoading
              ? undefined
              : stats.avgCompletion != null
                ? `${stats.avgCompletion}% avg completion`
                : 'No completion data'
          }
          badgeTone={
            stats.avgAccuracy != null && stats.avgAccuracy < 50 ? 'negative' : 'positive'
          }
          accent="coral"
        />
      </div>

      {isLoading ? (
        <div className="reports-page__empty-card" role="status">
          <p>Loading weekly progress…</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="reports-page__empty-card" role="status">
          <p>No patients assigned yet.</p>
          <span>Weekly reports appear once patients are on your caseload.</span>
        </div>
      ) : (
        <>
          <div className="reports-page__charts">
            <section className="chart-card" aria-labelledby="activity-chart-title">
              <h2 id="activity-chart-title" className="chart-card__title">
                Weekly activity
              </h2>
              <p className="chart-card__subtitle">Patients with vs without sessions</p>
              <div className="chart-card__body reports-page__pie-body">
                {activityPie.length === 0 ? (
                  <p className="reports-page__chart-empty">No caseload data.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={activityPie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={74}
                          paddingAngle={2}
                          isAnimationActive={false}
                        >
                          <Cell fill="var(--color-mint-dark)" />
                          <Cell fill="var(--color-border-strong)" />
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} patients`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ul className="reports-page__pie-legend">
                      <li>
                        <span className="reports-page__swatch reports-page__swatch--mint" />
                        With sessions · {stats.activePatients}
                      </li>
                      <li>
                        <span className="reports-page__swatch reports-page__swatch--muted" />
                        No sessions · {stats.inactivePatients}
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </section>

            <section className="chart-card" aria-labelledby="sessions-chart-title">
              <h2 id="sessions-chart-title" className="chart-card__title">
                Sessions by patient
              </h2>
              <p className="chart-card__subtitle">Completed sessions this week</p>
              <div className="chart-card__body">
                {sessionsByPatient.every((row) => row.sessions === 0) ? (
                  <p className="reports-page__chart-empty">No sessions completed this week.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sessionsByPatient} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="var(--color-divider)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={chartTickStyle}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--color-divider)' }}
                        interval={0}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={chartTickStyle}
                        tickLine={false}
                        axisLine={false}
                        width={28}
                      />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value) => [value, 'Sessions']}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.fullName ?? ''
                        }
                      />
                      <Bar
                        dataKey="sessions"
                        fill="var(--color-therapy-blue)"
                        radius={[6, 6, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="chart-card" aria-labelledby="accuracy-chart-title">
              <h2 id="accuracy-chart-title" className="chart-card__title">
                Accuracy by patient
              </h2>
              <p className="chart-card__subtitle">Average score for patients with activity</p>
              <div className="chart-card__body">
                {accuracyByPatient.length === 0 ? (
                  <p className="reports-page__chart-empty">No accuracy data this week.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={accuracyByPatient} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="var(--color-divider)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={chartTickStyle}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--color-divider)' }}
                        interval={0}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tick={chartTickStyle}
                        tickLine={false}
                        axisLine={false}
                        unit="%"
                        width={40}
                      />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value) => [`${value}%`, 'Accuracy']}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.fullName ?? ''
                        }
                      />
                      <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                        {accuracyByPatient.map((row) => (
                          <Cell
                            key={row.fullName}
                            fill={
                              row.accuracy >= 75
                                ? 'var(--color-mint-dark)'
                                : row.accuracy >= 50
                                  ? 'var(--color-warm-amber)'
                                  : 'var(--color-speech-coral)'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          <div className="reports-page__table-section">
            <div className="reports-page__table-head">
              <h2 className="reports-page__table-title">Patient reports</h2>
              <p className="reports-page__count">
                {filtered.length} patient{filtered.length === 1 ? '' : 's'} · {week.label}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="reports-page__empty-card" role="status">
                <p>No matching patients.</p>
                <span>Try another search term.</span>
              </div>
            ) : (
              <div className="reports-page__table-wrap">
                <table className="reports-page__table">
                  <thead>
                    <tr>
                      <th scope="col">Patient</th>
                      <th scope="col">Module</th>
                      <th scope="col">Sessions</th>
                      <th scope="col">Accuracy</th>
                      <th scope="col">Completion</th>
                      <th scope="col">Hints</th>
                      <th scope="col">Status</th>
                      <th scope="col">
                        <span className="reports-page__sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((report) => (
                      <tr key={report.id}>
                        <td className="reports-page__name">{report.patientName}</td>
                        <td>{report.module ?? '—'}</td>
                        <td>{report.sessionsCompleted}</td>
                        <td>
                          {report.avgAccuracy != null ? `${report.avgAccuracy}%` : '—'}
                        </td>
                        <td>
                          {report.therapyCompletionPercent != null
                            ? `${report.therapyCompletionPercent}%`
                            : '—'}
                        </td>
                        <td>{report.totalHints ?? 0}</td>
                        <td>
                          <span
                            className={`reports-page__status reports-page__status--${report.status}`}
                          >
                            {statusLabel(report.status)}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/patients?patient=${report.patientId}`}
                            className="reports-page__view-btn"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
