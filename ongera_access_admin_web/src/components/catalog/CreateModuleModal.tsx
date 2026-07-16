import { type FormEvent, useEffect, useId, useRef } from 'react';
import { THERAPY_DOMAINS } from '../../lib/therapyDomains';

export type CreateModuleForm = {
  name: string;
  description: string;
  domainId: string;
};

export function CreateModuleModal({
  open,
  form,
  submitting,
  error,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: CreateModuleForm;
  submitting: boolean;
  error?: string;
  onClose: () => void;
  onChange: (key: keyof CreateModuleForm, value: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const firstInput = dialogRef.current?.querySelector<HTMLElement>('input, textarea, button');
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
            Create module
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

          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="mod-domain">
              Domain
            </label>
            <select
              id="mod-domain"
              className="admin-page__select"
              required
              value={form.domainId}
              onChange={(e) => onChange('domainId', e.target.value)}
              disabled={submitting}
            >
              {THERAPY_DOMAINS.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="mod-name">
              Name
            </label>
            <input
              id="mod-name"
              className="admin-page__input"
              required
              maxLength={150}
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="mod-desc">
              Description <span className="admin-page__hint-inline">(optional)</span>
            </label>
            <textarea
              id="mod-desc"
              className="admin-page__textarea"
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              disabled={submitting}
            />
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
              {submitting ? 'Creating…' : 'Create module'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
