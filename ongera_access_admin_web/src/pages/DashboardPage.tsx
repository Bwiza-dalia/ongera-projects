import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/dashboard/KpiCard';
import { useAuth } from '../context/AuthContext';
import { getDashboardCounts } from '../services/dashboardService';
import '../styles/admin-page.css';
import './DashboardPage.css';

const actions = [
  {
    to: '/users',
    title: 'Manage users',
    description: 'Create accounts and assign roles across the platform.',
    accent: 'navy' as const,
  },
  {
    to: '/therapists',
    title: 'Review therapists',
    description: 'Verify therapist profiles awaiting approval.',
    accent: 'mint' as const,
  },
  {
    to: '/patients',
    title: 'Assign patients',
    description: 'Link patients to verified therapists on their care team.',
    accent: 'blue' as const,
  },
  {
    to: '/catalog',
    title: 'Edit catalog',
    description: 'Build modules, exercises, and questions for therapy.',
    accent: 'amber' as const,
  },
];

export function DashboardPage() {
  const { token } = useAuth();
  const [counts, setCounts] = useState<{
    users: number;
    patients: number;
    therapists: number;
    modules: number;
    verifiedTherapists: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    getDashboardCounts(token)
      .then((data) => {
        if (active) setCounts(data);
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

  const pendingTherapists = counts
    ? Math.max(0, counts.therapists - counts.verifiedTherapists)
    : 0;

  return (
    <div className="admin-page admin-dashboard">
      <header className="admin-page__hero admin-page__hero--row">
        <div>
          <h1>Platform dashboard</h1>
          <p>Manage organizations, users, and therapy content across Ongera Access.</p>
        </div>
        <Link to="/catalog" className="admin-page__cta">
          + Add to catalog
        </Link>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}{' '}
          <button type="button" className="admin-page__retry" onClick={() => window.location.reload()}>
            Retry
          </button>
        </p>
      )}

      {loading && !counts && <p className="admin-page__empty">Loading platform data…</p>}

      {counts && (
        <>
          <div className="admin-dashboard__kpis">
            <KpiCard
              label="Total users"
              value={counts.users}
              detail="All platform accounts"
              accent="navy"
            />
            <KpiCard
              label="Therapists"
              value={counts.therapists}
              detail={`${counts.verifiedTherapists} verified`}
              accent="mint"
            />
            <KpiCard
              label="Pending verification"
              value={pendingTherapists}
              detail={pendingTherapists === 1 ? 'Awaiting review' : 'Awaiting review'}
              accent="blue"
            />
            <KpiCard
              label="Patients"
              value={counts.patients}
              detail={`${counts.modules} therapy modules`}
              accent="amber"
            />
          </div>

          <section className="admin-dashboard__section">
            <div className="admin-dashboard__section-head">
              <h2>Quick actions</h2>
              <p>Common admin tasks to keep the platform running</p>
            </div>
            <div className="admin-dashboard__actions">
              {actions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className={`admin-dashboard__action admin-dashboard__action--${action.accent}`}
                >
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                  <span className="admin-dashboard__action-link">Open →</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
