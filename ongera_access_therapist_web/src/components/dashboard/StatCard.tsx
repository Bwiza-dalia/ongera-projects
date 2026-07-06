import type { ReactNode } from 'react';
import './StatCard.css';

type Accent = 'mint' | 'blue' | 'amber' | 'coral';

const icons: Record<Accent, ReactNode> = {
  mint: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  ),
  blue: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  amber: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  coral: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3a5 5 0 0 0-5 5v3.5L5 14.5h14l-2-3V8a5 5 0 0 0-5-5z" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  ),
};

export function StatCard({
  label,
  value,
  detail,
  accent = 'mint',
}: {
  label: string;
  value: number | string;
  detail?: string;
  accent?: Accent;
}) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card__top">
        <p className="stat-card__label">{label}</p>
        <span className="stat-card__icon">{icons[accent]}</span>
      </div>
      <p className="stat-card__value">{value}</p>
      {detail && <p className="stat-card__detail">{detail}</p>}
    </div>
  );
}
