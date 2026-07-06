import type { ReactNode } from 'react';
import './KpiCard.css';

type Accent = 'navy' | 'mint' | 'blue' | 'amber';

const icons: Record<Accent, ReactNode> = {
  navy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
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
      <path d="M5 5h14v14H5V5z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 5v14M5 9h14" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  ),
};

export function KpiCard({
  label,
  value,
  detail,
  accent = 'navy',
}: {
  label: string;
  value: number | string;
  detail?: string;
  accent?: Accent;
}) {
  return (
    <div className={`kpi-card kpi-card--${accent}`}>
      <div className="kpi-card__top">
        <p className="kpi-card__label">{label}</p>
        <span className="kpi-card__icon">{icons[accent]}</span>
      </div>
      <p className="kpi-card__value">{value}</p>
      {detail && <p className="kpi-card__detail">{detail}</p>}
    </div>
  );
}
