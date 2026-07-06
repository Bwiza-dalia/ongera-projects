import { Outlet } from 'react-router-dom';
import './AuthForm.css';

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__panel">
        <header className="auth-layout__brand">
          <div className="auth-layout__logo" aria-hidden="true">
            OA
          </div>
          <div>
            <p className="auth-layout__title">Ongera Access</p>
            <p className="auth-layout__subtitle">Admin portal</p>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
