import { Link } from 'react-router-dom';
import type { PatientAttentionItem } from '../../lib/patientAttention';
import './ListPanel.css';

function reasonTone(type: PatientAttentionItem['reasons'][number]['type']) {
  switch (type) {
    case 'low_accuracy':
      return 'list-panel__reason--coral';
    case 'missed_exercises':
      return 'list-panel__reason--amber';
    case 'declining_progress':
      return 'list-panel__reason--coral';
    case 'needs_care_plan':
      return 'list-panel__reason--blue';
    case 'new_patient':
      return 'list-panel__reason--mint';
  }
}

export function PatientsNeedingAttention({
  items,
  totalCount,
}: {
  items: PatientAttentionItem[];
  totalCount: number;
}) {
  return (
    <section className="list-panel" aria-labelledby="attention-panel-title">
      <header className="list-panel__header">
        <h2 id="attention-panel-title" className="list-panel__title">
          Requiring attention
        </h2>
        <span className="list-panel__count">{totalCount}</span>
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
                  <Link
                    to={`/patients?patient=${item.patientId}`}
                    className="list-panel__name-link"
                  >
                    {item.patientName}
                  </Link>
                </p>
                <div className="list-panel__reasons" aria-label="Attention reasons">
                  {item.reasons.map((reason) => (
                    <span
                      key={reason.type}
                      className={`list-panel__reason ${reasonTone(reason.type)}`}
                    >
                      {reason.label}
                    </span>
                  ))}
                </div>
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
        Review patients
      </Link>
    </section>
  );
}
