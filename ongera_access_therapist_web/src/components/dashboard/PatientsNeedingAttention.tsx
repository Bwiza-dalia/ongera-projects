import { Link } from 'react-router-dom';
import { buildPatientsNeedingAttention } from '../../lib/patientAttention';
import type { PatientRow } from '../../types/dashboard';
import './ListPanel.css';

function priorityLabel(priority: 'high' | 'medium') {
  return priority === 'high' ? 'High' : 'Medium';
}

export function PatientsNeedingAttention({ patients }: { patients: PatientRow[] }) {
  const items = buildPatientsNeedingAttention(patients);

  return (
    <section className="list-panel" aria-labelledby="attention-panel-title">
      <header className="list-panel__header">
        <h2 id="attention-panel-title" className="list-panel__title">
          Patients needing attention
        </h2>
        <span className="list-panel__count">{items.length}</span>
      </header>

      <ul className="list-panel__list">
        {items.length === 0 ? (
          <li className="list-panel__item">
            <p className="list-panel__item-desc">
              All patients are on track based on their latest progress data.
            </p>
          </li>
        ) : (
          items.map((item) => (
            <li key={item.patientId} className="list-panel__item list-panel__item--unread">
              <div className="list-panel__item-main">
                <p className="list-panel__item-title">{item.patientName}</p>
                <p className="list-panel__item-desc">
                  {item.reason}
                  {item.detail ? ` — ${item.detail}` : ''}
                </p>
                <p className="list-panel__item-priority">Priority: {priorityLabel(item.priority)}</p>
              </div>
              {item.lastSession && (
                <span className="list-panel__item-time">{item.lastSession}</span>
              )}
            </li>
          ))
        )}
      </ul>

      <Link to="/patients" className="list-panel__footer-btn">
        View all patients
      </Link>
    </section>
  );
}
