import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { displayName } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import './TopBar.css';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'A';
}

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = user ? displayName(user) : 'Admin';

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="topbar">
      <div className="topbar__spacer" aria-hidden="true" />

      <div className="topbar__actions" ref={menuRef}>
        <button
          type="button"
          className="topbar__account"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="topbar__avatar" aria-hidden="true">
            {initials(name)}
          </span>
          <span className="topbar__account-label">Account</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>

        {menuOpen && (
          <div className="topbar__menu" role="menu">
            <div className="topbar__menu-user">
              <p className="topbar__name">{name}</p>
              <p className="topbar__role">Administrator</p>
            </div>
            <button type="button" className="topbar__menu-item" role="menuitem" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
