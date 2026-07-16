import './NotificationsPage.css';

export function NotificationsPage() {
  return (
    <div className="notifications-page">
      <header className="notifications-page__hero">
        <h1 className="app-page-title">Notifications</h1>
        <p className="app-page-subtitle">Alerts about patient activity and requests.</p>
      </header>

      <div className="notifications-page__empty-card" role="status">
        <p>No notifications yet.</p>
      </div>
    </div>
  );
}
