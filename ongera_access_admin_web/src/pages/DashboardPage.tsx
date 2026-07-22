import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/dashboard/KpiCard';
import { PendingTasks } from '../components/dashboard/PendingTasks';
import { PlatformTrendChart } from '../components/dashboard/PlatformTrendChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { networkGrowthLabel } from '../lib/dashboardMetrics';
import { useAuth } from '../context/AuthContext';
import { getDashboardData, type DashboardData } from '../services/dashboardService';
import '../styles/admin-page.css';
import './DashboardPage.css';

export function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    getDashboardData(token)
      .then((next) => {
        if (active) setData(next);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const pendingTherapists = data?.counts.pendingTherapists ?? 0;

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <h1>Admin Dashboard</h1>
        </div>
        <div className="admin-dashboard__actions">
          <Link to="/therapists" className="admin-dashboard__btn admin-dashboard__btn--primary">
            + Review therapists
          </Link>
          <Link to="/patients" className="admin-dashboard__btn">
            Manage patients
          </Link>
        </div>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}{' '}
          <button type="button" className="admin-page__retry" onClick={() => window.location.reload()}>
            Retry
          </button>
        </p>
      )}

      {loading && !data && <p className="admin-page__empty">Loading platform data…</p>}

      {data && (
        <>
          <div className="admin-dashboard__kpis">
            <KpiCard
              label="Therapists"
              value={data.counts.therapists}
              trend={
                pendingTherapists > 0
                  ? `${pendingTherapists} awaiting review`
                  : data.trends.therapists.label
              }
              trendTone={pendingTherapists > 0 ? 'neutral' : data.trends.therapists.tone}
              sparkline={data.sparklines.therapists}
              sparkVariant="bars"
              accent="mint"
            />
            <KpiCard
              label="Patients"
              value={data.counts.patients}
              trend={data.trends.patients.label}
              trendTone={data.trends.patients.tone}
              sparkline={data.sparklines.patients}
              sparkVariant="area"
              accent="blue"
            />
            <KpiCard
              label="Total users"
              value={data.counts.users}
              trend={data.trends.users.label}
              trendTone={data.trends.users.tone}
              sparkline={data.sparklines.users}
              sparkVariant="bars"
              accent="navy"
            />
            <KpiCard
              label="Modules"
              value={data.counts.modules}
              trend={data.trends.modules.label}
              trendTone={data.trends.modules.tone}
              sparkline={data.sparklines.modules}
              sparkVariant="line"
              accent="amber"
            />
          </div>

          <div className="admin-dashboard__main">
            <PlatformTrendChart
              title="Care network growth"
              subtitle={networkGrowthLabel(data.enrollment)}
              points={data.enrollment}
            />
            <PendingTasks items={data.tasks} />
          </div>

          <RecentActivity items={data.activity} />
        </>
      )}
    </div>
  );
}
