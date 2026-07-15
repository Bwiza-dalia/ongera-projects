import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../components/auth/AuthForm.css';
import { useAuth } from '../../context/AuthContext';
import { displayName } from '../../types/auth';

export function PendingApprovalPage() {
  const { user, logout, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.isVerified) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  async function handleCheckStatus() {
    setIsChecking(true);
    setMessage('');
    try {
      const next = await refreshSession();
      if (next?.user.isVerified) {
        navigate('/', { replace: true });
        return;
      }
      setMessage('Your account is still pending admin approval.');
    } catch {
      setMessage('Could not refresh status. Try again in a moment.');
    } finally {
      setIsChecking(false);
    }
  }

  if (!user) return null;

  return (
    <div className="auth-form">
      <header className="auth-form__heading">
        <h1>Pending approval</h1>
        <p>
          Thanks, {displayName(user)}. Your therapist account has been submitted and is waiting for
          admin verification.
        </p>
      </header>

      {message && (
        <p className="auth-form__hint" role="status">
          {message}
        </p>
      )}

      <button
        type="button"
        className="auth-form__submit"
        onClick={handleCheckStatus}
        disabled={isChecking}
      >
        {isChecking ? 'Checking…' : 'Check approval status'}
      </button>

      <button type="button" className="auth-form__secondary" onClick={logout}>
        Log out
      </button>
    </div>
  );

}
