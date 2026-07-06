import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './ChartCard.css';

export function SessionsBarChart({ data }: { data: { day: string; sessions: number }[] }) {
  return (
    <section className="chart-card">
      <h2 className="chart-card__title">Sessions (7 days)</h2>
      <p className="chart-card__subtitle">All patients</p>
      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="sessions" fill="var(--color-therapy-blue)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
