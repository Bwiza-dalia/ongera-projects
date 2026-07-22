import { type FormEvent, useEffect, useId, useRef } from 'react';
import { PasswordInput } from '../ui/PasswordInput';
import { PhoneInput } from '../ui/PhoneInput';
import { therapistUserLabel } from '../../lib/patientUtils';
import type { ApiTherapistProfile, ApiUser } from '../../types/api';

export type CreatePatientForm = {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  date_of_birth: string;
  location: string;
  caregiver_fullname: string;
  caregiver_email: string;
  caregiver_relationship: string;
  caregiver_phone: string;
  therapist_id: string;
};

export function CreatePatientModal({
  open,
  form,
  submitting,
  error,
  verifiedTherapists,
  userById,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: CreatePatientForm;
  submitting: boolean;
  error?: string;
  verifiedTherapists: ApiTherapistProfile[];
  userById: Map<string, ApiUser>;
  onClose: () => void;
  onChange: (key: keyof CreatePatientForm, value: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const submittingRef = useRef(submitting);

  onCloseRef.current = onClose;
  submittingRef.current = submitting;

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const firstField = dialogRef.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, textarea',
    );
    firstField?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submittingRef.current) onCloseRef.current();
    }

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="admin-modal__backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="admin-modal__header">
          <h2 id={titleId} className="admin-modal__title">
            Create patient
          </h2>
          <button
            type="button"
            className="admin-modal__close"
            aria-label="Close"
            onClick={onClose}
            disabled={submitting}
          >
            ×
          </button>
        </header>

        <form className="admin-modal__body" onSubmit={onSubmit}>
          {error && (
            <p className="admin-page__error" role="alert">
              {error}
            </p>
          )}

          <div className="admin-page__grid admin-page__grid--2">
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-email">
                Email
              </label>
              <input
                id="patient-email"
                className="admin-page__input"
                type="email"
                required
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-password">
                Password
              </label>
              <PasswordInput
                id="patient-password"
                className="admin-page__input"
                wrapClassName="admin-page__password-wrap"
                toggleClassName="admin-page__toggle"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-first">
                First name
              </label>
              <input
                id="patient-first"
                className="admin-page__input"
                required
                value={form.first_name}
                onChange={(e) => onChange('first_name', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-last">
                Last name
              </label>
              <input
                id="patient-last"
                className="admin-page__input"
                required
                value={form.last_name}
                onChange={(e) => onChange('last_name', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-dob">
                Date of birth <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="patient-dob"
                className="admin-page__input"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => onChange('date_of_birth', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-location">
                Location <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="patient-location"
                className="admin-page__input"
                value={form.location}
                onChange={(e) => onChange('location', e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="admin-page__subpanel">
            <p className="admin-page__subpanel-title">Caregiver (optional)</p>
            <div className="admin-page__grid admin-page__grid--2">
              <div className="admin-page__field">
                <label className="admin-page__label" htmlFor="caregiver-name">
                  Full name
                </label>
                <input
                  id="caregiver-name"
                  className="admin-page__input"
                  value={form.caregiver_fullname}
                  onChange={(e) => onChange('caregiver_fullname', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="admin-page__field">
                <label className="admin-page__label" htmlFor="caregiver-relationship">
                  Relationship
                </label>
                <input
                  id="caregiver-relationship"
                  className="admin-page__input"
                  value={form.caregiver_relationship}
                  onChange={(e) => onChange('caregiver_relationship', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="admin-page__field">
                <label className="admin-page__label" htmlFor="caregiver-email">
                  Email
                </label>
                <input
                  id="caregiver-email"
                  className="admin-page__input"
                  type="email"
                  value={form.caregiver_email}
                  onChange={(e) => onChange('caregiver_email', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="admin-page__field">
                <label className="admin-page__label" htmlFor="caregiver-phone">
                  Phone number
                </label>
                <PhoneInput
                  id="caregiver-phone"
                  value={form.caregiver_phone}
                  onChange={(value) => onChange('caregiver_phone', value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="patient-therapist">
              Request therapist link{' '}
              <span className="admin-page__hint-inline">(optional — therapist must accept)</span>
            </label>
            <select
              id="patient-therapist"
              className="admin-page__select"
              value={form.therapist_id}
              onChange={(e) => onChange('therapist_id', e.target.value)}
              disabled={submitting}
            >
              <option value="">No therapist yet</option>
              {verifiedTherapists.map((t) => (
                <option key={t.id} value={t.user_id}>
                  {therapistUserLabel(t.user_id, userById)}
                </option>
              ))}
            </select>
          </div>

          <footer className="admin-modal__footer">
            <button
              type="button"
              className="admin-page__btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-page__btn admin-page__btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Creating…' : 'Create patient'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
