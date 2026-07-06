import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './ChartCard.css';

export function AccuracyTrendChart({ data }: { data: { day: string; accuracy: number }[] }) {
  return (
    <section className="chart-card">
      <h2 className="chart-card__title">Accuracy (7 days)</h2>
      <p className="chart-card__subtitle">Caseload average</p>
      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[60, 100]}
              tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip formatter={(v) => [`${v}%`, 'Accuracy']} />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="var(--color-mint-dark)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--color-mint-dark)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
