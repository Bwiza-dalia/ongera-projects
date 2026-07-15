import { Outlet } from 'react-router-dom';
import { AuthIllustration } from './AuthIllustration';
import './AuthLayout.css';
import './AuthForm.css';

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__card">
        <aside className="auth-layout__aside">
          <header className="auth-layout__brand">
            <p className="auth-layout__brand-mark">
              <span className="auth-layout__brand-soft">Ongera</span>
              <span className="auth-layout__brand-accent">Access</span>
            </p>
            <p className="auth-layout__aside-copy">
              Manage therapists, patients, and therapy content from one calm admin workspace.
            </p>
          </header>
          <AuthIllustration />
        </aside>

        <main className="auth-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
