import { displayName } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import './TopBar.css';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'A';
}

export function TopBar() {
  const { user } = useAuth();
  const name = user ? displayName(user) : 'Admin';

  return (
    <header className="topbar">
      <div className="topbar__context">
        <p className="topbar__eyebrow">Ongera Access</p>
        <p className="topbar__page">Administration</p>
      </div>
      <div className="topbar__profile">
        <span className="topbar__avatar" aria-hidden="true">
          {initials(name)}
        </span>
        <div>
          <p className="topbar__name">{name}</p>
          <p className="topbar__role">Administrator</p>
        </div>
      </div>
    </header>
  );
}
