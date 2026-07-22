import { useEffect, useId, useRef } from 'react';

export function ImportVocabularyModal({
  open,
  importJson,
  importing,
  error,
  onClose,
  onChange,
  onImport,
}: {
  open: boolean;
  importJson: string;
  importing: boolean;
  error?: string;
  onClose: () => void;
  onChange: (value: string) => void;
  onImport: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const importingRef = useRef(importing);

  onCloseRef.current = onClose;
  importingRef.current = importing;

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const firstField = dialogRef.current?.querySelector<HTMLElement>('textarea');
    firstField?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !importingRef.current) onCloseRef.current();
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
        if (e.target === e.currentTarget && !importing) onClose();
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
            Import vocabulary (JSON)
          </h2>
          <button
            type="button"
            className="admin-modal__close"
            aria-label="Close"
            onClick={onClose}
            disabled={importing}
          >
            ×
          </button>
        </header>

        <div className="admin-modal__body">
          {error && (
            <p className="admin-page__error" role="alert">
              {error}
            </p>
          )}

          <p className="admin-page__hint">
            Needs <code>word</code> + <code>english_translation</code>. Optional:{' '}
            <code>difficulty_level</code> (1–3), <code>image_url</code>, <code>audio_model_url</code>.
          </p>

          <div className="admin-page__field">
            <textarea
              className="admin-page__textarea admin-page__textarea--tall"
              placeholder='{ "items": [ { "word": "Intu", "english_translation": "House", "difficulty_level": 1 } ] }'
              value={importJson}
              onChange={(e) => onChange(e.target.value)}
              disabled={importing}
              rows={10}
            />
          </div>

          <footer className="admin-modal__footer">
            <button
              type="button"
              className="admin-page__btn"
              onClick={onClose}
              disabled={importing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-page__btn admin-page__btn--primary"
              disabled={importing || !importJson.trim()}
              onClick={onImport}
            >
              {importing ? 'Importing…' : 'Import JSON'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
