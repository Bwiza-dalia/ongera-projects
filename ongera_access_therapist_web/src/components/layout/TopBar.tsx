import { Link, useLocation } from 'react-router-dom';
import './TopBar.css';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'T';
}

function pageTitle(pathname: string) {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/patients')) return 'Patients';
  if (pathname.startsWith('/modules')) return 'Modules';
  if (pathname.startsWith('/care-plans')) return 'Care plans';
  if (pathname.startsWith('/reports')) return 'Reports';
  if (pathname.startsWith('/notifications')) return 'Notifications';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'Therapist workspace';
}

export function TopBar({
  therapistName,
  notificationCount,
}: {
  therapistName: string;
  notificationCount: number;
}) {
  const { pathname } = useLocation();
  const title = pageTitle(pathname);
  const notificationLabel =
    notificationCount > 0
      ? `Notifications, ${notificationCount} unread`
      : 'Notifications';

  return (
    <header className="topbar">
      <div className="topbar__context">
        <p className="topbar__eyebrow">Therapist workspace</p>
        <p className="topbar__page">{title}</p>
      </div>

      <div className="topbar__actions">
        <Link
          to="/notifications"
          className="topbar__icon-btn"
          aria-label={notificationLabel}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3a5 5 0 0 0-5 5v3.5L5 14.5h14l-2-3V8a5 5 0 0 0-5-5z"
              stroke="currentColor"
              strokeWidth="1.75"
            />
            <path d="M10 17.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.75" />
          </svg>
          {notificationCount > 0 && (
            <span className="topbar__badge" aria-hidden="true">
              {notificationCount}
            </span>
          )}
        </Link>

        <div className="topbar__profile" aria-label={`Profile: ${therapistName}`}>
          <span className="topbar__avatar" aria-hidden="true">
            {initials(therapistName)}
          </span>
          <div className="topbar__profile-text">
            <p className="topbar__name">{therapistName}</p>
            <p className="topbar__role">Therapist</p>
          </div>
        </div>
      </div>
    </header>
  );
}
