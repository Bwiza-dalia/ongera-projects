import { Link } from 'react-router-dom';
import { buildPatientsNeedingAttention } from '../../lib/patientAttention';
import type { PatientRow } from '../../types/dashboard';
import './ListPanel.css';

export function PatientsNeedingAttention({ patients }: { patients: PatientRow[] }) {
  const items = buildPatientsNeedingAttention(patients).slice(0, 6);

  return (
    <section className="list-panel" aria-labelledby="attention-panel-title">
      <header className="list-panel__header">
        <h2 id="attention-panel-title" className="list-panel__title">
          Needs attention
        </h2>
        <span className="list-panel__count">{items.length}</span>
      </header>

      <ul className="list-panel__timeline">
        {items.length === 0 ? (
          <li className="list-panel__timeline-item">
            <span className="list-panel__timeline-dot list-panel__timeline-dot--mint" aria-hidden="true" />
            <div className="list-panel__item-main">
              <p className="list-panel__item-desc">All patients are on track.</p>
            </div>
          </li>
        ) : (
          items.map((item) => (
            <li key={item.patientId} className="list-panel__timeline-item">
              <span
                className={
                  item.priority === 'high'
                    ? 'list-panel__timeline-dot list-panel__timeline-dot--coral'
                    : 'list-panel__timeline-dot list-panel__timeline-dot--amber'
                }
                aria-hidden="true"
              />
              <div className="list-panel__item-main">
                <p className="list-panel__item-title">
                  {item.patientName}
                  <span className="list-panel__item-sep"> · </span>
                  <span className="list-panel__item-emph">{item.reason}</span>
                </p>
                {item.detail && <p className="list-panel__item-desc">{item.detail}</p>}
                {item.lastSession && (
                  <p className="list-panel__item-time list-panel__item-time--inline">
                    Last session {item.lastSession}
                  </p>
                )}
              </div>
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
