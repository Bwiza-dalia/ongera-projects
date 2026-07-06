import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../types/auth';

export function AdminRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading" role="status">
        Loading…
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { user, isLoading } = useAuth();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';

  if (isLoading) {
    return (
      <div className="auth-loading" role="status">
        Loading…
      </div>
    );
  }

  if (user && isAdmin(user)) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
