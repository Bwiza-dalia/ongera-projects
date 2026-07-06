import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { PatientRow } from '../../types/dashboard';
import './ChartCard.css';
import './PatientProgressPieChart.css';

function isDoingWell(patient: PatientRow) {
  return patient.status === 'active' && (patient.accuracy == null || patient.accuracy >= 50);
}

export function PatientProgressPieChart({ patients }: { patients: PatientRow[] }) {
  const total = patients.length;
  const doingWell = patients.filter(isDoingWell).length;
  const needAttention = total - doingWell;
  const wellPct = total > 0 ? Math.round((doingWell / total) * 100) : 0;
  const attentionPct = total > 0 ? Math.round((needAttention / total) * 100) : 0;

  const data = [
    { name: 'Doing well', value: doingWell },
    { name: 'Need attention', value: needAttention },
  ].filter((d) => d.value > 0);

  return (
    <section className="chart-card patient-pie" aria-labelledby="patient-pie-title">
      <h2 id="patient-pie-title" className="chart-card__title">
        Patient progress
      </h2>
      <p className="chart-card__subtitle">Doing well vs need attention</p>

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
                    <Cell fill="var(--color-border-strong)" />
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} patients`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="patient-pie__legend" aria-label="Patient progress breakdown">
              <li>
                <span className="patient-pie__swatch patient-pie__swatch--well" aria-hidden="true" />
                <span className="patient-pie__legend-text">
                  <strong>Doing well</strong>
                  <span>{wellPct}% · {doingWell} patient{doingWell === 1 ? '' : 's'}</span>
                </span>
              </li>
              <li>
                <span className="patient-pie__swatch patient-pie__swatch--attention" aria-hidden="true" />
                <span className="patient-pie__legend-text">
                  <strong>Need attention</strong>
                  <span>{attentionPct}% · {needAttention} patient{needAttention === 1 ? '' : 's'}</span>
                </span>
              </li>
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
