import { Link, Outlet, useLocation } from 'react-router-dom';
import { AuthIllustration } from './AuthIllustration';
import './AuthLayout.css';

export function AuthLayout() {
  const { pathname } = useLocation();
  const onLogin = pathname === '/login';
  const onSignup = pathname === '/signup';

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
              Support patients with clear care plans, therapy modules, and progress you can act on.
            </p>
          </header>
          <AuthIllustration />
        </aside>

        <main className="auth-layout__main">
          <Outlet />

          <footer className="auth-layout__footer">
            {onSignup ? (
              <p>
                Already registered? <Link to="/login">Log in</Link>
              </p>
            ) : onLogin ? (
              <p>
                New therapist? <Link to="/signup">Create an account</Link>
              </p>
            ) : (
              <p>
                <Link to="/login">Log in</Link>
                <span aria-hidden="true"> · </span>
                <Link to="/signup">Sign up</Link>
              </p>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}
