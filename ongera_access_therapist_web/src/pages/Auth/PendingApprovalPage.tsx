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

  const isRejected = (user?.therapistStatus ?? '').toUpperCase() === 'REJECTED';

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
      if ((next?.user.therapistStatus ?? '').toUpperCase() === 'REJECTED') {
        setMessage('Your application was not approved. Contact an Ongera admin if you need help.');
        return;
      }
      setMessage('Your account is still pending admin review.');
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
        <h1>{isRejected ? 'Application not approved' : 'Almost there'}</h1>
        <p>
          {isRejected
            ? `Thanks, ${displayName(user)}. An admin reviewed your therapist account and did not approve it.`
            : `Thanks, ${displayName(user)}. Your therapist account is pending admin review.`}
        </p>
      </header>

      {message && (
        <p className="auth-form__hint" role="status">
          {message}
        </p>
      )}

      {!isRejected && (
        <button
          type="button"
          className="auth-form__submit"
          onClick={handleCheckStatus}
          disabled={isChecking}
        >
          {isChecking ? 'Checking…' : 'Check review status'}
        </button>
      )}

      <button type="button" className="auth-form__secondary" onClick={logout}>
        Log out
      </button>
    </div>
  );
}
