import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboard';
import { displayName } from '../../types/auth';
import { PatientProgressPieChart } from '../../components/dashboard/PatientProgressPieChart';
import { PatientsNeedingAttention } from '../../components/dashboard/PatientsNeedingAttention';
import { PendingReviews } from '../../components/dashboard/PendingReviews';
import { PatientTable } from '../../components/dashboard/PatientTable';
import { StatCard } from '../../components/dashboard/StatCard';
import '../../components/dashboard/ListPanel.css';
import './DashboardPage.css';

export function DashboardPage() {
  const { user } = useAuth();
  const { patientRows, pendingReviews, stats, isLoading, error, reload } = useDashboardData();

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
      </div>

      <div className="dashboard__section-label">
        <h2>Overview</h2>
        <p>Progress and caseload health at a glance</p>
      </div>

      <div className="dashboard__charts">
        {isLoading ? (
          <>
            <section className="chart-card">
              <p className="dashboard__loading" role="status">
                Loading patient progress…
              </p>
            </section>
            <section className="chart-card">
              <p className="dashboard__loading" role="status">
                Loading caseload…
              </p>
            </section>
          </>
        ) : (
          <>
            <PatientProgressPieChart patients={patientRows} />
            <PatientsNeedingAttention patients={patientRows} />
          </>
        )}
      </div>

      <div className="dashboard__panels">
        {isLoading ? (
          <section className="list-panel">
            <p className="dashboard__loading" role="status">
              Loading pending requests…
            </p>
          </section>
        ) : (
          <PendingReviews reviews={pendingReviews} />
        )}
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
