import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../components/auth/AuthForm.css';
import { PasswordInput } from '../../components/ui/PasswordInput';
import {
  SPECIALTY_OTHER,
  THERAPIST_SPECIALTIES,
} from '../../constants/therapistSpecialties';
import { useAuth } from '../../context/AuthContext';
import { getPostAuthPath, getSession } from '../../services/authService';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [specialtyChoice, setSpecialtyChoice] = useState('');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const specialty =
    specialtyChoice === SPECIALTY_OTHER ? customSpecialty.trim() : specialtyChoice.trim();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Fill in all required fields.');
      return;
    }

    if (!affiliation.trim()) {
      setError('Enter your hospital, clinic, or organization affiliation.');
      return;
    }

    if (!specialtyChoice) {
      setError('Select your specialty.');
      return;
    }

    if (specialtyChoice === SPECIALTY_OTHER && !customSpecialty.trim()) {
      setError('Enter your specialty.');
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
        affiliation: affiliation.trim(),
        specialty,
      });
      const session = getSession();
      navigate(session ? getPostAuthPath(session.user) : '/pending-approval', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <header className="auth-form__heading">
        <h1>Join Ongera</h1>
        <p>Create your therapist account. An admin will review your details before approving access.</p>
      </header>

      {error && (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="auth-form__row">
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
          placeholder="you@clinic.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-affiliation">
          Affiliation
        </label>
        <input
          id="signup-affiliation"
          className="auth-form__input"
          type="text"
          placeholder="e.g. Kigali University Teaching Hospital"
          autoComplete="organization"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          disabled={isSubmitting}
        />
        <p className="auth-form__hint">Hospital, clinic, or organization you practice with</p>
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-specialty">
          Specialty
        </label>
        <select
          id="signup-specialty"
          className="auth-form__input"
          value={specialtyChoice}
          onChange={(e) => setSpecialtyChoice(e.target.value)}
          disabled={isSubmitting}
        >
          <option value="">Select a specialty</option>
          {THERAPIST_SPECIALTIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={SPECIALTY_OTHER}>Other</option>
        </select>
      </div>

      {specialtyChoice === SPECIALTY_OTHER && (
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor="signup-custom-specialty">
            Your specialty
          </label>
          <input
            id="signup-custom-specialty"
            className="auth-form__input"
            type="text"
            placeholder="e.g. Pediatric speech therapist"
            value={customSpecialty}
            onChange={(e) => setCustomSpecialty(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      )}

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

      <div className="auth-form__row">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor="signup-password">
            Password
          </label>
          <PasswordInput
            id="signup-password"
            className="auth-form__input"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
          <p className="auth-form__hint">At least 8 characters</p>
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor="signup-confirm">
            Confirm password
          </label>
          <PasswordInput
            id="signup-confirm"
            className="auth-form__input"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="auth-form__actions">
        <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Sign up'}
        </button>
        <Link to="/login" className="auth-form__outline">
          Log in
        </Link>
      </div>
    </form>
  );
}
