import {
  DAY_LABELS,
  getCarePlan,
  weeklyMinutes,
} from '../../services/carePlanService';
import type { Patient } from '../../types/patients';
import './PatientCarePlanSummary.css';

export function PatientCarePlanSummary({ patient }: { patient: Patient }) {
  const carePlan = getCarePlan(patient.id);

  if (!carePlan || carePlan.modules.length === 0) {
    return (
      <section className="patients-page__panel" aria-labelledby="assignment-heading">
        <h2 id="assignment-heading" className="patients-page__panel-title">
          Care plan
        </h2>
        <div className="pcs-empty">
          <p className="pcs-empty__title">No care plan yet</p>
          <p className="pcs-empty__hint">
            {patient.module
              ? `Assigned module: ${patient.module}. Open the Care plan tab to build a full schedule.`
              : 'Open the Care plan tab to assign modules and set a weekly routine.'}
          </p>
        </div>
      </section>
    );
  }

  const therapyDays = carePlan.therapyDays ?? [];
  const dayLabels = therapyDays.map((d) => DAY_LABELS[d]).join(', ');
  const exerciseCount = carePlan.modules.reduce((sum, mod) => sum + mod.exercises.length, 0);
  const weeklyTarget = weeklyMinutes(carePlan.dailyMinutes, carePlan.daysPerWeek);

  return (
    <section className="patients-page__panel" aria-labelledby="assignment-heading">
      <h2 id="assignment-heading" className="patients-page__panel-title">
        Care plan
      </h2>

      <div className="pcs-stats">
        <div className="pcs-stat">
          <span className="pcs-stat__label">Modules</span>
          <span className="pcs-stat__value">{carePlan.modules.length}</span>
        </div>
        <div className="pcs-stat">
          <span className="pcs-stat__label">Exercises</span>
          <span className="pcs-stat__value">{exerciseCount}</span>
        </div>
        <div className="pcs-stat">
          <span className="pcs-stat__label">Days / week</span>
          <span className="pcs-stat__value">{carePlan.daysPerWeek}</span>
        </div>
        <div className="pcs-stat">
          <span className="pcs-stat__label">Weekly target</span>
          <span className="pcs-stat__value">{weeklyTarget} min</span>
        </div>
      </div>

      {therapyDays.length > 0 && (
        <p className="pcs-schedule">
          <span className="pcs-schedule__label">Practice days</span>
          {dayLabels}
        </p>
      )}

      <ul className="pcs-modules">
        {carePlan.modules.map((mod) => (
          <li key={mod.moduleId} className="pcs-module">
            <div className="pcs-module__head">
              <span className="pcs-module__name">{mod.moduleName}</span>
              {mod.domainName && <span className="pcs-module__domain">{mod.domainName}</span>}
            </div>
            <ul className="pcs-module__exercises">
              {mod.exercises.map((ex) => (
                <li key={ex.exerciseId}>
                  <span className="pcs-module__ex-name">{ex.exerciseName}</span>
                  <span className="pcs-module__ex-meta">
                    {ex.levels.join(', ')} · {ex.durationMinutes} min
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {carePlan.clinicalNotes && (
        <div className="pcs-notes">
          <span className="pcs-notes__label">Clinical notes</span>
          <p>{carePlan.clinicalNotes}</p>
        </div>
      )}
    </section>
  );
}
