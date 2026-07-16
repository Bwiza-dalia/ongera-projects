/** Shared Recharts text style so chart labels match the app typeface. */
export const chartTickStyle = {
  fontFamily: "'Source Sans 3', system-ui, sans-serif",
  fontSize: 12,
  fill: 'var(--color-muted)',
} as const;

export const chartTooltipStyle = {
  fontFamily: "'Source Sans 3', system-ui, sans-serif",
  borderRadius: 8,
  border: '1px solid var(--color-divider)',
  boxShadow: 'var(--shadow-card)',
} as const;
