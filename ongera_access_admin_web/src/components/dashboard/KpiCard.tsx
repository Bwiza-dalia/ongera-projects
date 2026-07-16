import type { ReactNode } from 'react';
import type { TrendTone } from '../../lib/dashboardMetrics';
import './KpiCard.css';

type Accent = 'navy' | 'mint' | 'blue' | 'amber';
type SparkVariant = 'bars' | 'area' | 'line';

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

function Sparkline({
  values,
  variant,
  accent,
}: {
  values: number[];
  variant: SparkVariant;
  accent: Accent;
}) {
  const width = 88;
  const height = 36;
  const pad = 2;
  const max = Math.max(1, ...values);
  const n = Math.max(1, values.length);

  if (variant === 'bars') {
    const gap = 3;
    const barW = Math.max(3, (width - pad * 2 - gap * (n - 1)) / n);
    return (
      <svg className="kpi-card__spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {values.map((value, i) => {
          const h = Math.max(3, (value / max) * (height - pad * 2));
          const x = pad + i * (barW + gap);
          const y = height - pad - h;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={1.5}
              className={`kpi-card__spark-bar kpi-card__spark-bar--${accent}`}
              opacity={0.45 + (i / Math.max(1, n - 1)) * 0.55}
            />
          );
        })}
      </svg>
    );
  }

  const coords = values.map((value, i) => {
    const x = pad + (i / Math.max(1, n - 1)) * (width - pad * 2);
    const y = height - pad - (value / max) * (height - pad * 2);
    return { x, y };
  });
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const area = `${line} L ${coords[coords.length - 1].x} ${height - pad} L ${coords[0].x} ${height - pad} Z`;

  return (
    <svg className="kpi-card__spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {variant === 'area' && (
        <path d={area} className={`kpi-card__spark-area kpi-card__spark-area--${accent}`} />
      )}
      <path d={line} className={`kpi-card__spark-line kpi-card__spark-line--${accent}`} />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  trend,
  trendTone = 'neutral',
  sparkline,
  sparkVariant = 'bars',
  accent = 'navy',
}: {
  label: string;
  value: number | string;
  trend?: string;
  trendTone?: TrendTone;
  sparkline?: number[];
  sparkVariant?: SparkVariant;
  accent?: Accent;
}) {
  return (
    <div className={`kpi-card kpi-card--${accent}`}>
      <div className="kpi-card__top">
        <p className="kpi-card__label">{label}</p>
        <span className="kpi-card__icon">{icons[accent]}</span>
      </div>
      <div className="kpi-card__body">
        <div className="kpi-card__metrics">
          <p className="kpi-card__value">{value}</p>
          {trend && (
            <p className={`kpi-card__trend kpi-card__trend--${trendTone}`}>{trend}</p>
          )}
        </div>
        {sparkline && sparkline.length > 0 && (
          <Sparkline values={sparkline} variant={sparkVariant} accent={accent} />
        )}
      </div>
    </div>
  );
}
