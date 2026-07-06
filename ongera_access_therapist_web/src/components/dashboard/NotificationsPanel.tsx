import { Link } from 'react-router-dom';
import type { Notification } from '../../types/dashboard';
import './ListPanel.css';

function priorityLabel(priority: Notification['priority']) {
  switch (priority) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
  }
}

export function NotificationsPanel({ notifications }: { notifications: Notification[] }) {
  return (
    <section className="list-panel">
      <header className="list-panel__header">
        <h2 className="list-panel__title">Notifications</h2>
      </header>

      <ul className="list-panel__list">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={n.read ? 'list-panel__item' : 'list-panel__item list-panel__item--unread'}
          >
            <div className="list-panel__item-main">
              <p className="list-panel__item-title">
                {n.title}
                {!n.read && <span className="list-panel__sr-only"> (unread)</span>}
              </p>
              <p className="list-panel__item-desc">
                {n.patientName} — {n.message}
              </p>
              <p className="list-panel__item-priority">Priority: {priorityLabel(n.priority)}</p>
            </div>
            <span className="list-panel__item-time">{n.createdAt}</span>
          </li>
        ))}
      </ul>

      <Link to="/notifications" className="list-panel__footer-btn">
        See all
      </Link>
    </section>
  );
}
