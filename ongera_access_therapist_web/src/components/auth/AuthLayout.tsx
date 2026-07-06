import { Link, Outlet, useLocation } from 'react-router-dom';
import './AuthLayout.css';

export function AuthLayout() {
  const { pathname } = useLocation();
  const onLogin = pathname === '/login';
  const onSignup = pathname === '/signup';

  return (
    <div className="auth-layout">
      <div className="auth-layout__panel">
        <header className="auth-layout__brand">
          <div className="auth-layout__logo" aria-hidden="true">
            OA
          </div>
          <div>
            <p className="auth-layout__title">Ongera Access</p>
            <p className="auth-layout__subtitle">Therapist portal</p>
          </div>
        </header>

        <Outlet />

        <footer className="auth-layout__footer">
          {onSignup ? (
            <Link to="/login">Back to log in</Link>
          ) : onLogin ? (
            <Link to="/signup">Create an account</Link>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <span aria-hidden="true">·</span>
              <Link to="/signup">Sign up</Link>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
