import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import './ChartCard.css';
import './PatientProgressPieChart.css';

export function PatientProgressPieChart({
  total,
  needingAttention,
}: {
  total: number;
  needingAttention: number;
}) {
  const needAttention = Math.min(needingAttention, total);
  const doingWell = Math.max(0, total - needAttention);
  const wellPct = total > 0 ? Math.round((doingWell / total) * 100) : 0;
  const attentionPct = total > 0 ? Math.round((needAttention / total) * 100) : 0;

  const data = [
    { name: 'On track', value: doingWell },
    { name: 'Requiring attention', value: needAttention },
  ].filter((d) => d.value > 0);

  return (
    <section className="chart-card patient-pie" aria-labelledby="patient-pie-title">
      <h2 id="patient-pie-title" className="chart-card__title">
        Patient progress
      </h2>

      <div className="chart-card__body patient-pie__body">
        {total === 0 ? (
          <p className="patient-pie__empty">No patient data yet.</p>
        ) : (
          <>
            <div className="patient-pie__chart">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    <Cell fill="var(--color-mint-dark)" />
                    <Cell fill="var(--color-speech-coral)" />
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} patients`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="patient-pie__legend" aria-label="Patient progress breakdown">
              <li>
                <span className="patient-pie__swatch patient-pie__swatch--well" aria-hidden="true" />
                <span className="patient-pie__legend-text">
                  <strong>On track</strong>
                  <span>
                    {wellPct}% · {doingWell} patient{doingWell === 1 ? '' : 's'}
                  </span>
                </span>
              </li>
              <li>
                <span className="patient-pie__swatch patient-pie__swatch--attention" aria-hidden="true" />
                <span className="patient-pie__legend-text">
                  <strong>Requiring attention</strong>
                  <span>
                    {attentionPct}% · {needAttention} patient{needAttention === 1 ? '' : 's'}
                  </span>
                </span>
              </li>
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
