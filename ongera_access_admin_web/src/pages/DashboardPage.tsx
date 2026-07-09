import { useEffect, useState } from 'react';
import { KpiCard } from '../components/dashboard/KpiCard';
import { PendingTasks } from '../components/dashboard/PendingTasks';
import { PlatformTrendChart } from '../components/dashboard/PlatformTrendChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { enrollmentTrendLabel } from '../lib/dashboardMetrics';
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

  const pendingTherapists = data
    ? Math.max(0, data.counts.therapists - data.counts.verifiedTherapists)
    : 0;
  const unassignedPatients = data?.tasks.filter((t) => t.id.startsWith('assign-')).length ?? 0;

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1>Dashboard</h1>
        <p>Overview of your platform and admin tasks</p>
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
              label="Total users"
              value={data.counts.users}
              trend={data.userSummary}
              accent="navy"
            />
            <KpiCard
              label="Therapists"
              value={data.counts.therapists}
              trend={
                pendingTherapists > 0
                  ? `${pendingTherapists} awaiting verify`
                  : `${data.counts.verifiedTherapists} verified`
              }
              accent="mint"
            />
            <KpiCard
              label="Patients"
              value={data.counts.patients}
              trend={unassignedPatients > 0 ? `${unassignedPatients} need therapist` : 'All assigned'}
              accent="blue"
            />
            <KpiCard
              label="Catalog modules"
              value={data.counts.modules}
              trend={data.counts.modules > 0 ? 'In therapy catalog' : 'Create first module'}
              accent="amber"
            />
          </div>

          <PlatformTrendChart
            title="Care network growth"
            subtitle={enrollmentTrendLabel(data.enrollment)}
            points={data.enrollment}
          />

          <div className="admin-dashboard__split">
            <RecentActivity items={data.activity} />
            <PendingTasks items={data.tasks} />
          </div>
        </>
      )}
    </div>
  );
}
