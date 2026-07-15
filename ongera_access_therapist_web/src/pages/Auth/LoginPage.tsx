import { type FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isApiEnabled } from '../../config/api';
import '../../components/auth/AuthForm.css';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { getPostAuthPath, getSession } from '../../services/authService';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      const session = getSession();
      navigate(session ? getPostAuthPath(session.user) : from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <header className="auth-form__heading">
        <h1>Therapist</h1>
        <p>Welcome back! Please log in to your account.</p>
      </header>

      {error && (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="auth-form__input"
          type="email"
          autoComplete="email"
          placeholder="you@clinic.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="login-password">
          Password
        </label>
        <PasswordInput
          id="login-password"
          className="auth-form__input"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="auth-form__actions">
        <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Log in'}
        </button>
        <Link to="/signup" className="auth-form__outline">
          Sign up
        </Link>
      </div>

      {!isApiEnabled() && (
        <p className="auth-form__demo">
          Demo: <strong>claudine@ongera.rw</strong> / <strong>password123</strong>
        </p>
      )}
    </form>
  );
}
