import { useState } from 'react';
import type { EnrollmentPoint } from '../../lib/dashboardMetrics';
import './PlatformTrendChart.css';

function buildPath(values: number[], width: number, height: number, padding: number, max: number) {
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const coords = values.map((value, index) => {
    const x = padding + (index / Math.max(1, values.length - 1)) * innerW;
    const y = padding + innerH - (value / max) * innerH;
    return { x, y };
  });

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const area = `${line} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

  return { line, area, coords };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
  const height = 260;
  const padding = 28;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const patientValues = points.map((p) => p.patients);
  const therapistValues = points.map((p) => p.therapists);
  const max = Math.max(1, ...patientValues, ...therapistValues);

  const patients = buildPath(patientValues, width, height, padding, max);
  const therapists = buildPath(therapistValues, width, height, padding, max);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(max * ratio),
    y: padding + (height - padding * 2) * (1 - ratio),
  }));

  const bandWidth = (width - padding * 2) / Math.max(1, points.length - 1);
  const lastIndex = points.length - 1;

  const tooltipW = 168;
  const tooltipH = 70;
  const active = activeIndex != null ? points[activeIndex] : null;
  const activeX = activeIndex != null ? patients.coords[activeIndex].x : 0;
  const activeMinY =
    activeIndex != null
      ? Math.min(patients.coords[activeIndex].y, therapists.coords[activeIndex].y)
      : 0;
  const tooltipX = clamp(activeX - tooltipW / 2, padding, width - padding - tooltipW);
  const tooltipY = clamp(activeMinY - tooltipH - 14, 4, height - tooltipH - 4);

  return (
    <section className="trend-chart">
      <header className="trend-chart__header">
        <div>
          <h2 className="trend-chart__title">{title}</h2>
          {subtitle && <p className="trend-chart__subtitle">{subtitle}</p>}
        </div>
        <ul className="trend-chart__legend" aria-label="Chart legend">
          <li>
            <span className="trend-chart__legend-swatch trend-chart__legend-swatch--patients" />
            Patients
          </li>
          <li>
            <span className="trend-chart__legend-swatch trend-chart__legend-swatch--therapists" />
            Therapists
          </li>
        </ul>
      </header>

      <div className="trend-chart__canvas-wrap">
        <svg
          className="trend-chart__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title} chart`}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="trend-fill-patients" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-therapy-blue)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-therapy-blue)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="trend-fill-therapists" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-mint-dark)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-mint-dark)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={padding}
                y1={tick.y}
                x2={width - padding}
                y2={tick.y}
                className="trend-chart__grid-line"
              />
              <text x={padding - 8} y={tick.y + 4} className="trend-chart__axis-label" textAnchor="end">
                {tick.value}
              </text>
            </g>
          ))}

          {activeIndex != null && (
            <line
              x1={activeX}
              y1={padding}
              x2={activeX}
              y2={height - padding}
              className="trend-chart__guide"
            />
          )}

          <path d={patients.area} fill="url(#trend-fill-patients)" />
          <path d={patients.line} className="trend-chart__line trend-chart__line--patients" />

          <path d={therapists.area} fill="url(#trend-fill-therapists)" />
          <path d={therapists.line} className="trend-chart__line trend-chart__line--therapists" />

          {patients.coords.map((coord, index) => (
            <circle
              key={`patient-${points[index].label}`}
              cx={coord.x}
              cy={coord.y}
              r={activeIndex === index ? 6 : 4.5}
              className="trend-chart__dot trend-chart__dot--patients"
            />
          ))}

          {therapists.coords.map((coord, index) => (
            <g key={`therapist-${points[index].label}`}>
              <circle
                cx={coord.x}
                cy={coord.y}
                r={activeIndex === index ? 6 : 4.5}
                className="trend-chart__dot trend-chart__dot--therapists"
              />
              <text x={coord.x} y={height - 8} className="trend-chart__month" textAnchor="middle">
                {points[index].label}
              </text>
            </g>
          ))}

          {lastIndex >= 0 && (
            <>
              <text
                x={patients.coords[lastIndex].x}
                y={patients.coords[lastIndex].y - 12}
                className="trend-chart__value trend-chart__value--patients"
                textAnchor="end"
              >
                {patientValues[lastIndex]}
              </text>
              <text
                x={therapists.coords[lastIndex].x}
                y={therapists.coords[lastIndex].y + 20}
                className="trend-chart__value trend-chart__value--therapists"
                textAnchor="end"
              >
                {therapistValues[lastIndex]}
              </text>
            </>
          )}

          {points.map((point, index) => (
            <rect
              key={`hit-${point.label}`}
              x={clamp(patients.coords[index].x - bandWidth / 2, 0, width)}
              y={0}
              width={bandWidth}
              height={height}
              className="trend-chart__hit"
              onMouseEnter={() => setActiveIndex(index)}
            />
          ))}

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
