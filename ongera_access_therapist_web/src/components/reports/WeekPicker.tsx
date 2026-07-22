import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { weekRangeContaining } from '../../lib/weeklyReports';
import type { WeekRange } from '../../types/reports';
import './WeekPicker.css';

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sat', 'Su'] as const;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatFooterDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function monthTitle(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Grid of 42 days starting Monday of the week that contains the 1st. */
function buildMonthGrid(viewMonth: Date): Date[] {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const weekday = first.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const gridStart = addDays(first, -daysFromMonday);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function WeekPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: WeekRange;
  onChange: (week: WeekRange) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(value.start.getFullYear(), value.start.getMonth(), 1),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const weekStart = useMemo(() => startOfLocalDay(value.start), [value.start]);
  const weekEnd = useMemo(() => addDays(startOfLocalDay(value.start), 6), [value.start]);
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  useEffect(() => {
    if (!open) return;
    setViewMonth(new Date(value.start.getFullYear(), value.start.getMonth(), 1));
  }, [open, value.start]);

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

  function selectDay(day: Date) {
    onChange(weekRangeContaining(day, 0));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function dayClass(day: Date): string {
    const classes = ['week-picker__day'];
    if (day.getMonth() !== viewMonth.getMonth()) classes.push('week-picker__day--outside');
    if (sameDay(day, today)) classes.push('week-picker__day--today');

    const t = day.getTime();
    const startT = weekStart.getTime();
    const endT = weekEnd.getTime();
    if (t >= startT && t <= endT) classes.push('week-picker__day--in-range');
    if (sameDay(day, weekStart)) classes.push('week-picker__day--range-start');
    if (sameDay(day, weekEnd)) classes.push('week-picker__day--range-end');
    return classes.join(' ');
  }

  return (
    <div className="week-picker" ref={rootRef}>
      <span className="week-picker__label" id={`${panelId}-label`}>
        Report week
      </span>
      <button
        type="button"
        className="week-picker__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${panelId}-label`}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        <span>{value.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="week-picker__panel"
          role="dialog"
          aria-label="Select report week"
        >
          <div className="week-picker__header">
            <button
              type="button"
              className="week-picker__nav"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="week-picker__month">{monthTitle(viewMonth)}</p>
            <button
              type="button"
              className="week-picker__nav"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="week-picker__weekdays" aria-hidden="true">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="week-picker__grid" role="grid" aria-label={monthTitle(viewMonth)}>
            {days.map((day) => (
              <button
                key={day.toISOString()}
                type="button"
                className={dayClass(day)}
                onClick={() => selectDay(day)}
                aria-label={`Week of ${formatFooterDate(weekRangeContaining(day).start)}`}
                aria-pressed={
                  day.getTime() >= weekStart.getTime() && day.getTime() <= weekEnd.getTime()
                }
              >
                <span className="week-picker__day-num">{day.getDate()}</span>
              </button>
            ))}
          </div>

          <div className="week-picker__footer">
            <div className="week-picker__footer-field">
              <span className="week-picker__footer-label">Start</span>
              <span className="week-picker__footer-value">{formatFooterDate(weekStart)}</span>
            </div>
            <span className="week-picker__footer-sep" aria-hidden="true">
              →
            </span>
            <div className="week-picker__footer-field">
              <span className="week-picker__footer-label">End</span>
              <span className="week-picker__footer-value">{formatFooterDate(weekEnd)}</span>
            </div>
          </div>

          <div className="week-picker__actions">
            <button
              type="button"
              className="week-picker__action"
              onClick={() => {
                onChange(weekRangeContaining(new Date(), 0));
                setOpen(false);
              }}
            >
              This week
            </button>
            <button
              type="button"
              className="week-picker__action"
              onClick={() => {
                onChange(weekRangeContaining(new Date(), -1));
                setOpen(false);
              }}
            >
              Last week
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
