import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './StatCard.css';

type Accent = 'mint' | 'blue' | 'amber' | 'coral';
type BadgeTone = 'positive' | 'negative' | 'neutral';

const icons: Record<Accent, ReactNode> = {
  mint: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  ),
  blue: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M16 14c1.8.5 3.2 1.8 3.8 3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
  amber: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4h8l1 3H7l1-3zM6 7h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M10 11h4M10 15h2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  coral: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3a5 5 0 0 0-5 5v3.5L5 14.5h14l-2-3V8a5 5 0 0 0-5-5z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M10 18v1a2 2 0 0 0 4 0v-1" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  ),
};

export function StatCard({
  label,
  value,
  detail,
  badge,
  badgeTone = 'neutral',
  accent = 'mint',
  to,
}: {
  label: string;
  value: number | string;
  detail?: string;
  badge?: string;
  badgeTone?: BadgeTone;
  accent?: Accent;
  to?: string;
}) {
  const body = (
    <>
      <div className="stat-card__top">
        <p className="stat-card__label">{label}</p>
        <span className="stat-card__icon">{icons[accent]}</span>
      </div>
      <p className="stat-card__value">{value}</p>
      {(badge || detail) && (
        <div className="stat-card__meta">
          {badge && (
            <span className={`stat-card__badge stat-card__badge--${badgeTone}`}>{badge}</span>
          )}
          {detail && <p className="stat-card__detail">{detail}</p>}
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`stat-card stat-card--${accent} stat-card--link`}>
        {body}
      </Link>
    );
  }

  return <article className={`stat-card stat-card--${accent}`}>{body}</article>;
}
