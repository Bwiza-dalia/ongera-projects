import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { DISTRACTOR_FIELD_OPTIONS, type DistractorField } from '../../services/catalogService';
import { getEnumValues } from '../../services/enumService';
import type { ApiEnumOption } from '../../types/api';

export type CreateExerciseForm = {
  module_id: string;
  name: string;
  description: string;
  distractor_count: number;
  distractor_field: DistractorField;
  type: string;
  metadata_json: string;
  video_url: string;
  demo_url: string;
};

export function CreateExerciseModal({
  open,
  form,
  submitting,
  error,
  token,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: CreateExerciseForm;
  submitting: boolean;
  error?: string;
  token: string | null;
  onClose: () => void;
  onChange: (key: keyof CreateExerciseForm, value: string | number) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const submittingRef = useRef(submitting);
  const [exerciseTypes, setExerciseTypes] = useState<ApiEnumOption[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState('');

  onCloseRef.current = onClose;
  submittingRef.current = submitting;

  useEffect(() => {
    if (!open || !token) return;

    let cancelled = false;
    setTypesLoading(true);
    setTypesError('');
    getEnumValues(token, 'exercise_types')
      .then((values) => {
        if (cancelled) return;
        setExerciseTypes(values);
        if (values.length === 0) {
          setTypesError('No exercise types returned from the server.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setExerciseTypes([]);
        setTypesError(err instanceof Error ? err.message : 'Failed to load exercise types');
      })
      .finally(() => {
        if (!cancelled) setTypesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, token]);

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
          {typesError && (
            <p className="admin-page__error" role="alert">
              {typesError}
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
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="ex-type">
              Type
            </label>
            <select
              id="ex-type"
              className="admin-page__select"
              value={form.type}
              onChange={(e) => onChange('type', e.target.value)}
              disabled={submitting || typesLoading || Boolean(typesError) || exerciseTypes.length === 0}
              required
            >
              <option value="">
                {typesLoading
                  ? 'Loading types…'
                  : typesError
                    ? 'Types unavailable'
                    : 'Select type…'}
              </option>
              {exerciseTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.description?.trim() || option.value}
                </option>
              ))}
            </select>
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
          <div className="admin-page__grid admin-page__grid--2">
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="ex-video">
                Video URL <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="ex-video"
                className="admin-page__input"
                type="url"
                value={form.video_url}
                onChange={(e) => onChange('video_url', e.target.value)}
                disabled={submitting}
                placeholder="https://"
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="ex-demo">
                Demo URL <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="ex-demo"
                className="admin-page__input"
                type="url"
                value={form.demo_url}
                onChange={(e) => onChange('demo_url', e.target.value)}
                disabled={submitting}
                placeholder="https://"
              />
            </div>
          </div>

          <fieldset className="admin-page__fieldset">
            <legend className="admin-page__label">Metadata</legend>
            <p className="admin-page__hint">
              Optional free-form JSON object sent as <code>metadata</code>. Leave empty to omit.
            </p>
            <textarea
              id="ex-metadata"
              className="admin-page__textarea admin-page__textarea--code"
              rows={5}
              spellCheck={false}
              value={form.metadata_json}
              onChange={(e) => onChange('metadata_json', e.target.value)}
              disabled={submitting}
              placeholder={'{\n  "key": "value"\n}'}
              aria-label="Exercise metadata JSON"
            />
          </fieldset>

          <footer className="admin-modal__footer">
            <button type="button" className="admin-page__btn" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="admin-page__btn admin-page__btn--primary"
              disabled={
                submitting ||
                !form.module_id ||
                !form.type ||
                Boolean(typesError) ||
                exerciseTypes.length === 0
              }
            >
              {submitting ? 'Creating…' : 'Create exercise'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
