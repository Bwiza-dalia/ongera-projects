import { useEffect, useState } from 'react';
import { getModule } from '../../services/catalogService';
import { listPatientCarePlanModules } from '../../services/patientCarePlanService';
import type { ApiAssignedModule, ApiExercise } from '../../types/api';

type CarePlanModuleView = ApiAssignedModule & {
  exercisesById: Map<string, ApiExercise>;
};

function exerciseLabel(
  exerciseId: string,
  exercisesById: Map<string, ApiExercise>,
): string {
  return exercisesById.get(exerciseId)?.name ?? exerciseId;
}

export function PatientCarePlanPanel({
  patientId,
  token,
}: {
  patientId: string;
  token: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modules, setModules] = useState<CarePlanModuleView[]>([]);

  useEffect(() => {
    if (!token || !patientId) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    setModules([]);

    (async () => {
      try {
        const assigned = await listPatientCarePlanModules(token, patientId);
        const enriched = await Promise.all(
          assigned.map(async (mod) => {
            let exercisesById = new Map<string, ApiExercise>();
            try {
              const detail = await getModule(token, mod.module_id);
              exercisesById = new Map((detail.exercises ?? []).map((ex) => [ex.id, ex]));
            } catch {
              // Keep plan visible even if catalog lookup fails.
            }
            return { ...mod, exercisesById };
          }),
        );
        if (!cancelled) setModules(enriched);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load care plan');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, patientId]);

  if (error) {
    return (
      <p className="admin-page__error" role="alert">
        {error}
      </p>
    );
  }

  if (loading) {
    return (
      <p className="admin-page__empty" role="status">
        Loading care plan…
      </p>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="admin-page__empty-state">
        <h3>No care plan yet</h3>
        <p>This patient has no modules assigned.</p>
      </div>
    );
  }

  return (
    <ul className="care-plan-view">
      {modules.map((mod) => {
        const plan =
          Array.isArray(mod.exercise_plan) && mod.exercise_plan.length > 0
            ? [...mod.exercise_plan].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
            : null;
        const exerciseIds = mod.exercise_ids ?? [];

        return (
          <li key={mod.module_id} className="care-plan-view__module">
            <header className="care-plan-view__module-header">
              <div>
                <h3 className="care-plan-view__module-name">{mod.name}</h3>
                {mod.description?.trim() ? (
                  <p className="care-plan-view__module-desc">{mod.description}</p>
                ) : null}
              </div>
              {typeof mod.weekly_minutes_target === 'number' ? (
                <p className="care-plan-view__weekly">{mod.weekly_minutes_target} min / week</p>
              ) : null}
            </header>

            {plan ? (
              <table className="care-plan-view__table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Exercise</th>
                    <th>Starting level</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((item) => (
                    <tr key={`${item.exercise_id}-${item.priority ?? 0}`}>
                      <td>{item.priority ?? '—'}</td>
                      <td>{exerciseLabel(item.exercise_id, mod.exercisesById)}</td>
                      <td>{item.starting_level ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : exerciseIds.length > 0 ? (
              <ul className="care-plan-view__ids">
                {exerciseIds.map((id) => (
                  <li key={id}>{exerciseLabel(id, mod.exercisesById)}</li>
                ))}
              </ul>
            ) : (
              <p className="admin-page__hint">All exercises in this module.</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
