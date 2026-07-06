import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (isLoading) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        Loading…
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
