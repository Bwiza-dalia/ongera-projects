import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../components/auth/AuthForm.css';
import { useAuth } from '../../context/AuthContext';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Fill in all required fields.');
      return;
    }

    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        location: location.trim() || undefined,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <header className="auth-form__heading">
        <h1>Create account</h1>
        <p>Register as a therapist to access the portal.</p>
      </header>

      {error && (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-first-name">
          First name
        </label>
        <input
          id="signup-first-name"
          className="auth-form__input"
          type="text"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-last-name">
          Last name
        </label>
        <input
          id="signup-last-name"
          className="auth-form__input"
          type="text"
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-email">
          Email
        </label>
        <input
          id="signup-email"
          className="auth-form__input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-location">
          Location <span className="auth-form__hint">(optional)</span>
        </label>
        <input
          id="signup-location"
          className="auth-form__input"
          type="text"
          placeholder="e.g. Kigali, Rwanda"
          autoComplete="address-level2"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-password">
          Password
        </label>
        <div className="auth-form__password-wrap">
          <input
            id="signup-password"
            className="auth-form__input"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="auth-form__toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="auth-form__hint">At least 8 characters</p>
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-confirm">
          Confirm password
        </label>
        <input
          id="signup-confirm"
          className="auth-form__input"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Sign up'}
      </button>

      <p className="auth-form__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
