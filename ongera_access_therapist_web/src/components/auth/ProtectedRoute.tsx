import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AuthLoading() {
  return (
    <div className="auth-loading" role="status" aria-live="polite">
      Loading…
    </div>
  );
}

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function VerifiedTherapistRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.isVerified === false) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (isLoading) {
    return <AuthLoading />;
  }

  if (user) {
    const destination =
      user.role === 'therapist' && user.isVerified === false ? '/pending-approval' : from;
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
