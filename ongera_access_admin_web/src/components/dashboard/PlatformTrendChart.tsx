import { useState } from 'react';
import type { EnrollmentPoint } from '../../lib/dashboardMetrics';
import { networkSummary } from '../../lib/dashboardMetrics';
import './PlatformTrendChart.css';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Rounded path for a stacked segment — round top and/or bottom corners. */
function stackedBarPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  roundTop: boolean,
  roundBottom = true,
) {
  const radius = Math.min(r, w / 2, h / 2);
  const top = roundTop ? radius : 0;
  const bottom = roundBottom ? radius : 0;
  return [
    `M ${x + top} ${y}`,
    `H ${x + w - top}`,
    top ? `Q ${x + w} ${y} ${x + w} ${y + top}` : `L ${x + w} ${y}`,
    `V ${y + h - bottom}`,
    bottom ? `Q ${x + w} ${y + h} ${x + w - bottom} ${y + h}` : `L ${x + w} ${y + h}`,
    `H ${x + bottom}`,
    bottom ? `Q ${x} ${y + h} ${x} ${y + h - bottom}` : `L ${x} ${y + h}`,
    `V ${y + top}`,
    top ? `Q ${x} ${y} ${x + top} ${y}` : `L ${x} ${y}`,
    'Z',
  ].join(' ');
}

export function PlatformTrendChart({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle?: string;
  points: EnrollmentPoint[];
}) {
  const width = 720;
  const height = 280;
  const padding = { top: 20, right: 16, bottom: 36, left: 40 };
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const summary = networkSummary(points);
  const totals = points.map((p) => p.patients + p.therapists);
  const max = Math.max(1, ...totals);
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const n = Math.max(1, points.length);
  const groupW = innerW / n;
  const barW = Math.min(36, groupW * 0.55);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(max * ratio),
    y: padding.top + innerH * (1 - ratio),
  }));

  const active = activeIndex != null ? points[activeIndex] : null;
  const tooltipW = 168;
  const tooltipH = 72;
  const activeX =
    activeIndex != null ? padding.left + activeIndex * groupW + groupW / 2 : 0;
  const tooltipX = clamp(activeX - tooltipW / 2, padding.left, width - padding.right - tooltipW);
  const tooltipY = padding.top + 8;

  return (
    <section className="trend-chart">
      <header className="trend-chart__header">
        <div>
          <h2 className="trend-chart__title">{title}</h2>
          {subtitle && <p className="trend-chart__subtitle">{subtitle}</p>}
        </div>
        <span className="trend-chart__period">Monthly</span>
      </header>

      <ul className="trend-chart__summary" aria-label="Network summary">
        <li>
          <span className="trend-chart__dot trend-chart__dot--total" />
          <div>
            <p className="trend-chart__summary-label">Care network</p>
            <p className="trend-chart__summary-value">{summary.total}</p>
          </div>
        </li>
        <li>
          <span className="trend-chart__dot trend-chart__dot--patients" />
          <div>
            <p className="trend-chart__summary-label">Patients</p>
            <p className="trend-chart__summary-value">{summary.patients}</p>
          </div>
        </li>
        <li>
          <span className="trend-chart__dot trend-chart__dot--therapists" />
          <div>
            <p className="trend-chart__summary-label">Therapists</p>
            <p className="trend-chart__summary-value">{summary.therapists}</p>
          </div>
        </li>
        <li>
          <span className="trend-chart__dot trend-chart__dot--new" />
          <div>
            <p className="trend-chart__summary-label">Joined this month</p>
            <p className="trend-chart__summary-value">
              {summary.patientsNew + summary.therapistsNew}
            </p>
          </div>
        </li>
      </ul>

      <div className="trend-chart__canvas-wrap">
        <svg
          className="trend-chart__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title} stacked bar chart`}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                className="trend-chart__grid-line"
              />
              <text x={padding.left - 8} y={tick.y + 4} className="trend-chart__axis-label" textAnchor="end">
                {tick.value}
              </text>
            </g>
          ))}

          {points.map((point, index) => {
            const x = padding.left + index * groupW + (groupW - barW) / 2;
            const patientH = (point.patients / max) * innerH;
            const therapistH = (point.therapists / max) * innerH;
            const baseY = padding.top + innerH;
            const therapistY = baseY - therapistH;
            const patientY = therapistY - patientH;
            const isActive = activeIndex === index;
            const opacity = activeIndex == null || isActive ? 1 : 0.45;
            const r = isActive ? 6 : 5;

            return (
              <g key={point.label}>
                {patientH > 0 && (
                  <path
                    d={stackedBarPath(x, patientY, barW, patientH, r, true, therapistH <= 0)}
                    className="trend-chart__bar trend-chart__bar--patients"
                    opacity={opacity}
                  />
                )}
                {therapistH > 0 && (
                  <path
                    d={stackedBarPath(x, therapistY, barW, therapistH, r, patientH <= 0, true)}
                    className="trend-chart__bar trend-chart__bar--therapists"
                    opacity={opacity}
                  />
                )}
                <text
                  x={x + barW / 2}
                  y={height - 12}
                  className="trend-chart__month"
                  textAnchor="middle"
                >
                  {point.label}
                </text>
                <rect
                  x={padding.left + index * groupW}
                  y={0}
                  width={groupW}
                  height={height}
                  className="trend-chart__hit"
                  onMouseEnter={() => setActiveIndex(index)}
                />
              </g>
            );
          })}

          {active && (
            <g className="trend-chart__tooltip" pointerEvents="none">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipW}
                height={tooltipH}
                rx={10}
                className="trend-chart__tooltip-bg"
              />
              <text x={tooltipX + 14} y={tooltipY + 22} className="trend-chart__tooltip-title">
                {active.label}
              </text>
              <circle cx={tooltipX + 18} cy={tooltipY + 40} r={4} className="trend-chart__tooltip-dot--patients" />
              <text x={tooltipX + 30} y={tooltipY + 44} className="trend-chart__tooltip-row">
                {`${active.patients} patients${active.patientsNew ? ` (+${active.patientsNew})` : ''}`}
              </text>
              <circle cx={tooltipX + 18} cy={tooltipY + 58} r={4} className="trend-chart__tooltip-dot--therapists" />
              <text x={tooltipX + 30} y={tooltipY + 62} className="trend-chart__tooltip-row">
                {`${active.therapists} therapists${
                  active.therapistsNew ? ` (+${active.therapistsNew})` : ''
                }`}
              </text>
            </g>
          )}
        </svg>
      </div>
    </section>
  );
}
