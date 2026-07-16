import { Link } from 'react-router-dom';
import type { PatientRow } from '../../types/dashboard';
import './ListPanel.css';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function statusMeta(status: PatientRow['status']) {
  switch (status) {
    case 'active':
      return ['Active', 'dash-badge--mint'];
    case 'inactive':
      return ['Inactive', 'dash-badge--muted'];
    case 'struggling':
      return ['Struggling', 'dash-badge--coral'];
    case 'new':
      return ['New', 'dash-badge--blue'];
  }
}

export function DashboardCaseload({ patients }: { patients: PatientRow[] }) {
  const items = patients.slice(0, 6);

  return (
    <section className="list-panel" aria-labelledby="caseload-panel-title">
      <header className="list-panel__header">
        <h2 id="caseload-panel-title" className="list-panel__title">
          Caseload
        </h2>
        <Link to="/patients" className="list-panel__header-link">
          View all
        </Link>
      </header>

      <ul className="list-panel__list">
        {items.length === 0 ? (
          <li className="list-panel__item">
            <p className="list-panel__item-desc">No patients on your caseload yet.</p>
          </li>
        ) : (
          items.map((patient) => {
            const [label, badgeClass] = statusMeta(patient.status);
            return (
              <li key={patient.id} className="list-panel__item list-panel__item--person">
                <span className="list-panel__avatar" aria-hidden="true">
                  {initials(patient.name)}
                </span>
                <div className="list-panel__item-main">
                  <p className="list-panel__item-title">{patient.name}</p>
                  <p className="list-panel__item-desc">
                    {patient.module ?? 'No module'}
                    {patient.accuracy != null ? ` · ${patient.accuracy}%` : ''}
                  </p>
                </div>
                <span className={`dash-badge ${badgeClass}`}>{label}</span>
              </li>
            );
          })
        )}
      </ul>

      <Link to="/patients" className="list-panel__footer-btn">
        Open patients
      </Link>
    </section>
  );
}
