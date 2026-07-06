import { useMemo, useState } from 'react';
import { mockNotifications } from '../../data/mockNotifications';
import type { Notification } from '../../types/dashboard';
import './NotificationsPage.css';

type ReadFilter = 'all' | 'unread' | 'read';

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

export function NotificationsPage() {
  const [items, setItems] = useState(mockNotifications);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const unreadCount = items.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((n) => {
      if (readFilter === 'unread' && n.read) return false;
      if (readFilter === 'read' && !n.read) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.patientName.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      );
    });
  }, [items, search, readFilter]);

  const selected = selectedId ? items.find((n) => n.id === selectedId) ?? null : null;

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  if (selected) {
    return (
      <NotificationDetail
        notification={selected}
        onBack={() => setSelectedId(null)}
        onMarkRead={() => markRead(selected.id)}
      />
    );
  }

  return (
    <div className="notifications-page">
      <header className="notifications-page__hero">
        <h1>Notifications</h1>
        <p>{unreadCount} unread</p>
      </header>

      <div className="notifications-page__toolbar">
        <div className="notifications-page__search-wrap">
          <label className="notifications-page__search-label" htmlFor="notification-search">
            Search notifications
          </label>
          <div className="notifications-page__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <input
              id="notification-search"
              type="search"
              placeholder="Patient, title, or message"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="notifications-page__filters" role="group" aria-label="Filter by read status">
          {(['all', 'unread', 'read'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={
                readFilter === filter
                  ? 'notifications-page__filter notifications-page__filter--active'
                  : 'notifications-page__filter'
              }
              aria-pressed={readFilter === filter}
              onClick={() => setReadFilter(filter)}
            >
              {filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="notifications-page__empty" role="status">
          No notifications match your filters.
        </p>
      ) : (
        <ul className="notifications-page__list">
          {filtered.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={
                  n.read
                    ? 'notifications-page__item'
                    : 'notifications-page__item notifications-page__item--unread'
                }
                onClick={() => setSelectedId(n.id)}
                aria-label={`${n.read ? '' : 'Unread: '}${n.title}, ${n.patientName}`}
              >
                <div className="notifications-page__item-main">
                  <p className="notifications-page__item-title">{n.title}</p>
                  <p className="notifications-page__item-desc">
                    {n.patientName} — {n.message}
                  </p>
                </div>
                <div className="notifications-page__item-meta">
                  <span className="notifications-page__priority">{priorityLabel(n.priority)}</span>
                  <span className="notifications-page__time">{n.createdAt}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationDetail({
  notification,
  onBack,
  onMarkRead,
}: {
  notification: Notification;
  onBack: () => void;
  onMarkRead: () => void;
}) {
  return (
    <div className="notifications-page notifications-page--detail">
      <button type="button" className="notifications-page__back" onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        All notifications
      </button>

      <article className="notifications-page__detail">
        <header className="notifications-page__detail-header">
          <h1>{notification.title}</h1>
          <p className="notifications-page__detail-meta">
            {notification.patientName} · {notification.createdAt}
          </p>
        </header>

        <dl className="notifications-page__detail-grid">
          <div>
            <dt>Priority</dt>
            <dd>{priorityLabel(notification.priority)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{notification.read ? 'Read' : 'Unread'}</dd>
          </div>
          <div>
            <dt>Patient</dt>
            <dd>{notification.patientName}</dd>
          </div>
        </dl>

        <section aria-labelledby="message-heading">
          <h2 id="message-heading" className="notifications-page__detail-label">
            Message
          </h2>
          <p className="notifications-page__detail-message">{notification.message}</p>
        </section>

        {!notification.read && (
          <button type="button" className="notifications-page__mark-read" onClick={onMarkRead}>
            Mark as read
          </button>
        )}
      </article>
    </div>
  );
}
