import { useEffect, useMemo, useState } from 'react';
import './Pagination.css';

interface UsePaginationResult<T> {
  page: number;
  setPage: (page: number) => void;
  pageItems: T[];
  pageCount: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
}

/**
 * Client-side pagination over an in-memory array. Pass a `resetKey` (e.g. the
 * active search/filter value) to jump back to page 1 whenever it changes.
 */
export function usePagination<T>(
  items: T[],
  pageSize = 10,
  resetKey?: unknown,
): UsePaginationResult<T> {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;

  const pageItems = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize],
  );

  return {
    page: current,
    setPage,
    pageItems,
    pageCount,
    total: items.length,
    rangeStart: items.length === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, items.length),
  };
}

interface PaginationProps {
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function Pagination({
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
  onPageChange,
  itemLabel = 'items',
}: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        ← Prev
      </button>
      <span className="pagination__info">
        Page {page} of {pageCount} · {rangeStart}–{rangeEnd} of {total} {itemLabel}
      </span>
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
      >
        Next →
      </button>
    </nav>
  );
}
