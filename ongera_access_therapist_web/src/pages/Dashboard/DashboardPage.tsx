import { Link } from 'react-router-dom';
import { useDashboardData } from '../../hooks/useDashboard';
import { DashboardCaseload } from '../../components/dashboard/DashboardCaseload';
import { PatientProgressPieChart } from '../../components/dashboard/PatientProgressPieChart';
import { PatientsNeedingAttention } from '../../components/dashboard/PatientsNeedingAttention';
import { PendingReviews } from '../../components/dashboard/PendingReviews';
import { PatientTable } from '../../components/dashboard/PatientTable';
import { StatCard } from '../../components/dashboard/StatCard';
import '../../components/dashboard/ListPanel.css';
import './DashboardPage.css';

export function DashboardPage() {
  const { patientRows, pendingReviews, stats, isLoading, error, reload } = useDashboardData();

  const activeBadge =
    stats.totalPatients > 0
      ? `${Math.round((stats.activePatients / stats.totalPatients) * 100)}% active`
      : 'None yet';

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="app-page-title">Dashboard</h1>
        <Link to="/care-plans?tab=build" className="dashboard__cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Build care plan
        </Link>
      </header>

      {error && (
        <div className="dashboard__error" role="alert">
          <p>{error}</p>
          <button type="button" className="dashboard__retry" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      <div className="dashboard__stats">
        <StatCard
          label="Total patients"
          value={isLoading ? '…' : stats.totalPatients}
          badge={isLoading ? undefined : stats.totalPatients > 0 ? 'Assigned' : 'None yet'}
          badgeTone="neutral"
          accent="blue"
        />
        <StatCard
          label="Active patients"
          value={isLoading ? '…' : stats.activePatients}
          badge={isLoading ? undefined : activeBadge}
          badgeTone="positive"
          accent="mint"
        />
        <StatCard
          label="Pending requests"
          value={isLoading ? '…' : stats.pendingRequests}
          badge={
            isLoading
              ? undefined
              : stats.pendingRequests > 0
                ? 'Needs review'
                : 'All clear'
          }
          badgeTone={stats.pendingRequests > 0 ? 'negative' : 'positive'}
          accent="amber"
        />
        <StatCard
          label="Needs attention"
          value={isLoading ? '…' : stats.needingAttention}
          badge={
            isLoading
              ? undefined
              : stats.avgAccuracy != null
                ? `${stats.avgAccuracy}% avg accuracy`
                : 'No accuracy data'
          }
          badgeTone={stats.needingAttention > 0 ? 'negative' : 'positive'}
          accent="coral"
        />
      </div>

      <div className="dashboard__columns">
        {isLoading ? (
          <>
            <section className="list-panel">
              <p className="dashboard__loading" role="status">
                Loading caseload…
              </p>
            </section>
            <section className="list-panel">
              <p className="dashboard__loading" role="status">
                Loading requests…
              </p>
            </section>
            <section className="list-panel">
              <p className="dashboard__loading" role="status">
                Loading attention items…
              </p>
            </section>
          </>
        ) : (
          <>
            <DashboardCaseload patients={patientRows} />
            <PendingReviews reviews={pendingReviews} />
            <PatientsNeedingAttention patients={patientRows} />
          </>
        )}
      </div>

      <div className="dashboard__lower">
        {isLoading ? (
          <section className="chart-card">
            <p className="dashboard__loading" role="status">
              Loading progress…
            </p>
          </section>
        ) : (
          <PatientProgressPieChart patients={patientRows} />
        )}

        {isLoading ? (
          <section className="patient-table-card">
            <p className="dashboard__loading" role="status">
              Loading patients…
            </p>
          </section>
        ) : (
          <PatientTable patients={patientRows} />
        )}
      </div>
    </div>
  );
}
