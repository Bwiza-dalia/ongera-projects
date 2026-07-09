import type { DashboardActivity } from '../../lib/dashboardMetrics';
import './RecentActivity.css';

export function RecentActivity({ items }: { items: DashboardActivity[] }) {
  return (
    <section className="activity-card">
      <h2 className="activity-card__title">Recent activity</h2>
      {items.length === 0 ? (
        <p className="activity-card__empty">No recent platform activity yet.</p>
      ) : (
        <ul className="activity-card__list">
          {items.map((item) => (
            <li key={item.id} className="activity-card__item">
              <span className="activity-card__bullet" aria-hidden="true" />
              <div className="activity-card__body">
                <p className="activity-card__item-title">{item.title}</p>
                <p className="activity-card__item-detail">{item.detail}</p>
              </div>
              <time className="activity-card__time">{item.timeLabel}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
