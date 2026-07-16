import { type FormEvent, useEffect, useId, useRef } from 'react';

export type CreateVocabularyForm = {
  word: string;
  english_translation: string;
  difficulty_level: 1 | 2 | 3;
  audio_model_url: string;
  image_url: string;
};

const DIFFICULTY_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
] as const;

export function CreateVocabularyModal({
  open,
  form,
  submitting,
  uploadingImage,
  error,
  onClose,
  onChange,
  onSubmit,
  onUploadImage,
}: {
  open: boolean;
  form: CreateVocabularyForm;
  submitting: boolean;
  uploadingImage: boolean;
  error?: string;
  onClose: () => void;
  onChange: (key: keyof CreateVocabularyForm, value: string | number) => void;
  onSubmit: (e: FormEvent) => void;
  onUploadImage: (file: File) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const busy = submitting || uploadingImage;

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const firstInput = dialogRef.current?.querySelector<HTMLElement>('input, select, button');
    firstInput?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previous?.focus();
    };
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div
      className="admin-modal__backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
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
            Create vocabulary item
          </h2>
          <button
            type="button"
            className="admin-modal__close"
            aria-label="Close"
            onClick={onClose}
            disabled={busy}
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
              <label className="admin-page__label" htmlFor="v-word">
                Word
              </label>
              <input
                id="v-word"
                className="admin-page__input"
                required
                maxLength={200}
                value={form.word}
                onChange={(e) => onChange('word', e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="v-english">
                English translation
              </label>
              <input
                id="v-english"
                className="admin-page__input"
                required
                maxLength={200}
                value={form.english_translation}
                onChange={(e) => onChange('english_translation', e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="v-level">
                Level
              </label>
              <select
                id="v-level"
                className="admin-page__select"
                value={form.difficulty_level}
                onChange={(e) => onChange('difficulty_level', Number(e.target.value))}
                disabled={busy}
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="v-image">
                Image URL
              </label>
              <input
                id="v-image"
                className="admin-page__input"
                type="url"
                value={form.image_url}
                onChange={(e) => onChange('image_url', e.target.value)}
                disabled={busy}
              />
              <label className="admin-page__upload-label">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) onUploadImage(file);
                  }}
                />
                {uploadingImage ? 'Uploading…' : 'Upload image'}
              </label>
            </div>
          </div>

          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="v-audio">
              Audio model URL
            </label>
            <input
              id="v-audio"
              className="admin-page__input"
              type="url"
              value={form.audio_model_url}
              onChange={(e) => onChange('audio_model_url', e.target.value)}
              disabled={busy}
            />
          </div>

          {form.image_url.trim() && (
            <div className="vocab-modal__preview">
              <img src={form.image_url.trim()} alt="" loading="lazy" />
            </div>
          )}

          <footer className="admin-modal__footer">
            <button type="button" className="admin-page__btn" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              type="submit"
              className="admin-page__btn admin-page__btn--primary"
              disabled={busy}
            >
              {submitting ? 'Creating…' : 'Create item'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
