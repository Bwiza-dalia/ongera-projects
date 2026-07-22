import { Link } from 'react-router-dom';
import './RowActionMenu.css';

export type RowActionItem = {
  label: string;
  onSelect?: () => void;
  to?: string;
  danger?: boolean;
};

export function RowActionMenu({
  items,
  disabled = false,
}: {
  items: RowActionItem[];
  disabled?: boolean;
}) {
  if (items.length === 0) {
    return <span className="row-action-menu__empty">—</span>;
  }

  return (
    <div className="row-action-menu">
      {items.map((item, index) => (
        <span key={item.label} className="row-action-menu__item-wrap">
          {index > 0 && (
            <span className="row-action-menu__sep" aria-hidden="true">
              |
            </span>
          )}
          {item.to ? (
            <Link
              to={item.to}
              className={
                item.danger
                  ? 'row-action-menu__link row-action-menu__link--danger'
                  : 'row-action-menu__link'
              }
              aria-disabled={disabled || undefined}
              onClick={(event) => {
                if (disabled) {
                  event.preventDefault();
                  return;
                }
                item.onSelect?.();
              }}
            >
              {item.label}
            </Link>
          ) : (
            <button
              type="button"
              className={
                item.danger
                  ? 'row-action-menu__link row-action-menu__link--danger'
                  : 'row-action-menu__link'
              }
              disabled={disabled}
              onClick={() => item.onSelect?.()}
            >
              {item.label}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
