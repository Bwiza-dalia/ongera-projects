import { type FormEvent, useEffect, useId, useRef } from 'react';
import { PasswordInput } from '../ui/PasswordInput';

export type CreateTherapistForm = {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  location: string;
  affiliation: string;
  specialty: string;
};

export function CreateTherapistModal({
  open,
  form,
  submitting,
  error,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: CreateTherapistForm;
  submitting: boolean;
  error?: string;
  onClose: () => void;
  onChange: (key: keyof CreateTherapistForm, value: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const firstInput = dialogRef.current?.querySelector<HTMLElement>('input, button');
    firstInput?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previous?.focus();
    };
  }, [open, onClose, submitting]);

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
            Create therapist
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
              <label className="admin-page__label" htmlFor="therapist-email">
                Email
              </label>
              <input
                id="therapist-email"
                className="admin-page__input"
                type="email"
                required
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-password">
                Password
              </label>
              <PasswordInput
                id="therapist-password"
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
              <label className="admin-page__label" htmlFor="therapist-first">
                First name
              </label>
              <input
                id="therapist-first"
                className="admin-page__input"
                required
                value={form.first_name}
                onChange={(e) => onChange('first_name', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-last">
                Last name
              </label>
              <input
                id="therapist-last"
                className="admin-page__input"
                required
                value={form.last_name}
                onChange={(e) => onChange('last_name', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-affiliation">
                Affiliation <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="therapist-affiliation"
                className="admin-page__input"
                value={form.affiliation}
                onChange={(e) => onChange('affiliation', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-specialty">
                Specialty <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="therapist-specialty"
                className="admin-page__input"
                value={form.specialty}
                onChange={(e) => onChange('specialty', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-location">
                Location <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="therapist-location"
                className="admin-page__input"
                value={form.location}
                onChange={(e) => onChange('location', e.target.value)}
                disabled={submitting}
              />
            </div>
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
              {submitting ? 'Creating…' : 'Create therapist'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
