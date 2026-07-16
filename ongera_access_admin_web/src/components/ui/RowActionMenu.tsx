import { useEffect, useId, useRef, useState } from 'react';
import './RowActionMenu.css';

export type RowActionItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

export function RowActionMenu({
  items,
  disabled = false,
}: {
  items: RowActionItem[];
  disabled?: boolean;
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

  if (items.length === 0) {
    return <span className="row-action-menu__empty">—</span>;
  }

  return (
    <div className="row-action-menu" ref={rootRef}>
      <button
        type="button"
        className="row-action-menu__trigger"
        aria-label="Open actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="row-action-menu__dots" aria-hidden="true">
          :
        </span>
      </button>

      {open && (
        <div className="row-action-menu__panel" role="menu" id={menuId}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={
                item.danger
                  ? 'row-action-menu__item row-action-menu__item--danger'
                  : 'row-action-menu__item'
              }
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
