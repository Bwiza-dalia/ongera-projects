import { Link } from 'react-router-dom';
import type { DashboardTask } from '../../lib/dashboardMetrics';
import './PendingTasks.css';

export function PendingTasks({ items }: { items: DashboardTask[] }) {
  return (
    <section className="tasks-card">
      <h2 className="tasks-card__title">Upcoming tasks</h2>
      {items.length === 0 ? (
        <p className="tasks-card__empty">All caught up — no pending admin tasks.</p>
      ) : (
        <ul className="tasks-card__list">
          {items.map((item) => (
            <li key={item.id}>
              <Link to={item.to} className="tasks-card__item">
                <span className="tasks-card__checkbox" aria-hidden="true" />
                <div className="tasks-card__body">
                  <p className="tasks-card__item-title">{item.title}</p>
                  <p className="tasks-card__item-detail">{item.detail}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
