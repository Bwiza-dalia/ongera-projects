import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { displayName } from '../../types/auth';
import {
  IconBell,
  IconDashboard,
  IconLogout,
  IconModules,
  IconPatients,
  IconReports,
  IconCarePlan,
  IconSettings,
} from '../ui/NavIcons';
import './Sidebar.css';

const links = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/modules', label: 'Modules', icon: IconModules },
  { to: '/patients', label: 'Patients', icon: IconPatients },
  { to: '/care-plans', label: 'Care plans', icon: IconCarePlan },
  { to: '/reports', label: 'Reports', icon: IconReports },
  { to: '/notifications', label: 'Notifications', icon: IconBell },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'T';
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = user ? displayName(user) : 'Therapist';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">OA</div>
        <div>
          <p className="sidebar__title">Ongera Access</p>
          <p className="sidebar__subtitle">Therapist portal</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            <span className="sidebar__link-icon" aria-hidden="true">
              <link.icon />
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <span className="sidebar__avatar" aria-hidden="true">
            {initials(name)}
          </span>
          <div className="sidebar__user-info">
            <p className="sidebar__user-name">{name}</p>
            <span className="sidebar__role-badge">Therapist</span>
          </div>
        </div>
        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          <IconLogout size={16} />
          Log out
        </button>
      </div>
    </aside>
  );
}
