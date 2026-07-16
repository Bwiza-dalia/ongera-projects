import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function ExerciseActionMenu({
  viewHref,
  createHref,
}: {
  viewHref: string;
  createHref: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="catalog-action-menu" ref={rootRef}>
      <button
        type="button"
        className="catalog-action-menu__trigger"
        aria-label="Open actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="catalog-action-menu__dots" aria-hidden="true">
          :
        </span>
      </button>

      {open && (
        <div className="catalog-action-menu__panel" role="menu" id={menuId}>
          <Link
            to={viewHref}
            className="catalog-action-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            View
          </Link>
          <Link
            to={createHref}
            className="catalog-action-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Create questions
          </Link>
        </div>
      )}
    </div>
  );
}
