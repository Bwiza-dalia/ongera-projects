import { type FormEvent, useEffect, useId, useRef } from 'react';
import { DISTRACTOR_FIELD_OPTIONS, type DistractorField } from '../../services/catalogService';

export type CreateExerciseForm = {
  module_id: string;
  name: string;
  description: string;
  distractor_count: number;
  distractor_field: DistractorField;
};

export function CreateExerciseModal({
  open,
  form,
  submitting,
  error,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: CreateExerciseForm;
  submitting: boolean;
  error?: string;
  onClose: () => void;
  onChange: (key: keyof CreateExerciseForm, value: string | number) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const firstInput = dialogRef.current?.querySelector<HTMLElement>('input, select, textarea, button');
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
            Create exercise
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
            <label className="admin-page__label" htmlFor="ex-name">
              Name
            </label>
            <input
              id="ex-name"
              className="admin-page__input"
              required
              maxLength={150}
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="ex-desc">
              Description <span className="admin-page__hint-inline">(optional)</span>
            </label>
            <textarea
              id="ex-desc"
              className="admin-page__textarea"
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__grid admin-page__grid--2">
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="ex-distractors">
                Wrong answers per question
              </label>
              <input
                id="ex-distractors"
                type="number"
                min={1}
                max={5}
                className="admin-page__input"
                value={form.distractor_count}
                onChange={(e) => onChange('distractor_count', Number(e.target.value))}
                disabled={submitting}
                required
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="ex-field">
                Answer shown as
              </label>
              <select
                id="ex-field"
                className="admin-page__select"
                value={form.distractor_field}
                onChange={(e) => onChange('distractor_field', e.target.value)}
                disabled={submitting}
              >
                {DISTRACTOR_FIELD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <footer className="admin-modal__footer">
            <button type="button" className="admin-page__btn" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="admin-page__btn admin-page__btn--primary"
              disabled={submitting || !form.module_id}
            >
              {submitting ? 'Creating…' : 'Create exercise'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
