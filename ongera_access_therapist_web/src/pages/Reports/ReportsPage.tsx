import { useMemo, useState } from 'react';
import { mockReports } from '../../data/mockReports';
import type { ReportStatus, WeeklyReport } from '../../types/reports';
import './ReportsPage.css';

const STATUS_FILTERS: Array<ReportStatus | 'all'> = ['all', 'ready', 'reviewed'];

function statusText(status: ReportStatus) {
  return status === 'ready' ? 'Ready for review' : 'Reviewed';
}

export function ReportsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockReports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.patientName.toLowerCase().includes(q) ||
        r.module?.toLowerCase().includes(q) ||
        r.weekLabel.toLowerCase().includes(q)
      );
    });
  }, [search, statusFilter]);

  const readyCount = mockReports.filter((r) => r.status === 'ready').length;
  const selected = selectedId ? mockReports.find((r) => r.id === selectedId) ?? null : null;

  if (selected) {
    return <ReportDetail report={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="reports-page">
      <header className="reports-page__hero">
        <h1>Reports</h1>
        <p>
          Weekly patient reports · {readyCount} ready for review
        </p>
      </header>

      <div className="reports-page__toolbar">
        <div className="reports-page__search-wrap">
          <label className="reports-page__search-label" htmlFor="report-search">
            Search reports
          </label>
          <div className="reports-page__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <input
              id="report-search"
              type="search"
              placeholder="Patient, module, or week"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="reports-page__filters" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              className={
                statusFilter === status
                  ? 'reports-page__filter reports-page__filter--active'
                  : 'reports-page__filter'
              }
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : statusText(status)}
            </button>
          ))}
        </div>
      </div>

      <p className="reports-page__count">
        Showing {filtered.length} report{filtered.length === 1 ? '' : 's'}
      </p>

      {filtered.length === 0 ? (
        <p className="reports-page__empty" role="status">
          No reports match your search.
        </p>
      ) : (
        <div className="reports-page__table-wrap">
          <table className="reports-page__table">
            <thead>
              <tr>
                <th scope="col">Patient</th>
                <th scope="col">Week</th>
                <th scope="col">Module</th>
                <th scope="col">Sessions</th>
                <th scope="col">Accuracy</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="reports-page__sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="reports-page__name">{r.patientName}</td>
                  <td>{r.weekLabel}</td>
                  <td>{r.module ?? '—'}</td>
                  <td>{r.sessionsCompleted}</td>
                  <td>{r.avgAccuracy != null ? `${r.avgAccuracy}%` : '—'}</td>
                  <td>
                    <span className="reports-page__status">{statusText(r.status)}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="reports-page__view-btn"
                      onClick={() => setSelectedId(r.id)}
                      aria-label={`View report for ${r.patientName}, ${r.weekLabel}`}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReportDetail({ report, onBack }: { report: WeeklyReport; onBack: () => void }) {
  return (
    <div className="reports-page reports-page--detail">
      <button type="button" className="reports-page__back" onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        All reports
      </button>

      <header className="reports-page__detail-hero">
        <p className="reports-page__breadcrumb">Weekly report</p>
        <h1>{report.patientName}</h1>
        <p className="reports-page__detail-meta">
          {report.weekLabel} · {report.module ?? 'No module'} · Generated {report.generatedAt}
        </p>
        <p className="reports-page__status reports-page__status--large">
          {statusText(report.status)}
        </p>
      </header>

      <section className="reports-page__panel" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="reports-page__panel-title">
          Summary
        </h2>
        <p className="reports-page__summary">{report.summary}</p>
      </section>

      <section className="reports-page__panel" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="reports-page__panel-title">
          This week
        </h2>
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
            <dt>Streak</dt>
            <dd>{report.streakDays > 0 ? `${report.streakDays} days` : '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="reports-page__panel" aria-labelledby="highlights-heading">
        <h2 id="highlights-heading" className="reports-page__panel-title">
          Highlights
        </h2>
        <ul className="reports-page__highlights">
          {report.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {report.clinicianNotes && (
        <section className="reports-page__panel" aria-labelledby="notes-heading">
          <h2 id="notes-heading" className="reports-page__panel-title">
            Clinician notes
          </h2>
          <p className="reports-page__notes">{report.clinicianNotes}</p>
        </section>
      )}
    </div>
  );
}
