import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboard';
import { displayName } from '../../types/auth';
import { PatientProgressPieChart } from '../../components/dashboard/PatientProgressPieChart';
import { NotificationsPanel } from '../../components/dashboard/NotificationsPanel';
import { PatientTable } from '../../components/dashboard/PatientTable';
import { PendingReviews } from '../../components/dashboard/PendingReviews';
import { SessionsBarChart } from '../../components/dashboard/SessionsBarChart';
import { StatCard } from '../../components/dashboard/StatCard';
import './DashboardPage.css';

export function DashboardPage() {
  const { user } = useAuth();
  const {
    patientRows,
    stats,
    pendingReviews,
    notifications,
    sessionsTrend,
    isLoading,
    error,
    reload,
  } = useDashboardData();

  const therapistName = user ? displayName(user) : 'Therapist';
  const activeRate =
    stats.totalPatients > 0
      ? `${Math.round((stats.activePatients / stats.totalPatients) * 100)}% active`
      : 'No patients yet';

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Therapist dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome back, {therapistName}. Track patients, sessions, and therapy progress.
          </p>
        </div>
        <Link to="/patients" className="dashboard__cta">
          + View patients
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
          detail="On your caseload"
          accent="blue"
        />
        <StatCard
          label="Active patients"
          value={isLoading ? '…' : stats.activePatients}
          detail={activeRate}
          accent="mint"
        />
        <StatCard
          label="Pending reviews"
          value={stats.pendingReviews}
          detail="Awaiting your review"
          accent="amber"
        />
        <StatCard
          label="Alerts today"
          value={stats.alertsToday}
          detail="Require attention"
          accent="coral"
        />
      </div>

      <div className="dashboard__section-label">
        <h2>Overview</h2>
        <p>Progress and session activity at a glance</p>
      </div>

      <div className="dashboard__charts">
        {isLoading ? (
          <section className="chart-card">
            <p className="dashboard__loading" role="status">
              Loading patient progress…
            </p>
          </section>
        ) : (
          <PatientProgressPieChart patients={patientRows} />
        )}
        <SessionsBarChart data={sessionsTrend} />
      </div>

      <div className="dashboard__panels">
        <PendingReviews reviews={pendingReviews} />
        <NotificationsPanel notifications={notifications} />
      </div>

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
  );
}
