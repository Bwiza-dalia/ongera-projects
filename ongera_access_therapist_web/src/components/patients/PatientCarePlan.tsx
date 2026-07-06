import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isApiEnabled } from '../../config/api';
import { useModuleCatalog } from '../../hooks/useModules';
import { useCarePlan } from '../../hooks/useCarePlan';
import {
  buildSchedule,
  DAY_LABELS,
  saveCarePlan,
} from '../../services/carePlanService';
import { assignModule } from '../../services/moduleAssignmentService';
import { getModule } from '../../services/moduleService';
import type { CarePlanExercisePick, PlanDifficulty, PatientCarePlan, ScheduledExercise } from '../../types/carePlan';
import type { Patient } from '../../types/patients';
import './PatientCarePlan.css';

const LEVELS: PlanDifficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

interface Props {
  patient: Patient;
}

export function PatientCarePlanPanel({ patient }: Props) {
  const { token } = useAuth();
  const { catalog } = useModuleCatalog();
  const { plan, reload, save } = useCarePlan(patient.id);

  const [moduleId, setModuleId] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [exercises, setExercises] = useState<CarePlanExercisePick[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sessionsPerWeek, setSessionsPerWeek] = useState(5);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const allModules = useMemo(
    () => catalog.domains.flatMap((d) => d.modules.map((m) => ({ ...m, domainName: d.name }))),
    [catalog],
  );

  useEffect(() => {
    if (plan) {
      setModuleId(plan.moduleId);
      setModuleName(plan.moduleName);
      setStartDate(plan.startDate);
      setSessionsPerWeek(plan.sessionsPerWeek);
      setClinicalNotes(plan.clinicalNotes);
    }
  }, [plan]);

  async function handleModuleChange(nextModuleId: string) {
    setModuleId(nextModuleId);
    setExercises([]);
    setSelectedIds(new Set());
    setError('');
    if (!nextModuleId || !token) return;

    const mod = allModules.find((m) => m.id === nextModuleId);
    setModuleName(mod?.name ?? '');

    setLoadingExercises(true);
    try {
      const detail = await getModule(token, nextModuleId);
      setExercises(
        detail.exercises.map((ex) => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          moduleId: nextModuleId,
          moduleName: detail.name,
          level: 'BEGINNER',
          durationMinutes: 15,
        })),
      );
      setSelectedIds(new Set(detail.exercises.map((ex) => ex.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setLoadingExercises(false);
    }
  }

  function toggleExercise(exerciseId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }

  function updateExercise(
    exerciseId: string,
    patch: Partial<Pick<CarePlanExercisePick, 'level' | 'durationMinutes'>>,
  ) {
    setExercises((list) =>
      list.map((e) => (e.exerciseId === exerciseId ? { ...e, ...patch } : e)),
    );
  }

  const selectedExercises = exercises.filter((e) => selectedIds.has(e.exerciseId));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!moduleId) {
      setError('Select a therapy module.');
      return;
    }
    if (selectedExercises.length === 0) {
      setError('Select at least one exercise.');
      return;
    }

    setSaving(true);
    try {
      if (isApiEnabled() && token) {
        await assignModule(token, patient.id, moduleId);
      }

      const schedule = buildSchedule(selectedExercises, sessionsPerWeek, startDate);
      const next: PatientCarePlan = {
        patientId: patient.id,
        moduleId,
        moduleName,
        startDate,
        sessionsPerWeek,
        clinicalNotes: clinicalNotes.trim(),
        status: 'active',
        schedule,
        updatedAt: new Date().toISOString(),
      };
      save(next);
      setSuccess(
        isApiEnabled()
          ? 'Module assigned on the server and care plan saved locally. The patient will see it in the app.'
          : 'Care plan saved. The patient can follow this schedule in the app.',
      );
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  if (plan?.status === 'active') {
    const byWeek = new Map<number, ScheduledExercise[]>();
    for (const item of plan.schedule) {
      const list = byWeek.get(item.weekNumber) ?? [];
      list.push(item);
      byWeek.set(item.weekNumber, list);
    }

    return (
      <section className="care-plan">
        <header className="care-plan__head">
          <div>
            <h2>Active care plan</h2>
            <p>
              {plan.moduleName} · {plan.sessionsPerWeek} sessions/week · starts {plan.startDate}
            </p>
          </div>
          <span className="care-plan__badge">Active</span>
        </header>

        {plan.clinicalNotes && (
          <p className="care-plan__notes">
            <strong>Clinical notes:</strong> {plan.clinicalNotes}
          </p>
        )}

        {[...byWeek.entries()].map(([week, items]) => (
          <div key={week} className="care-plan__week">
            <h3>Week {week}</h3>
            <div className="care-plan__schedule-grid">
              {items
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((item) => (
                  <div key={item.id} className="care-plan__schedule-item">
                    <span className="care-plan__day">{DAY_LABELS[item.dayOfWeek]}</span>
                    <p className="care-plan__exercise-name">{item.exerciseName}</p>
                    <p className="care-plan__exercise-meta">
                      {item.level} · {item.durationMinutes} min
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="care-plan__edit-btn"
          onClick={() => {
            saveCarePlan({ ...plan, status: 'draft' });
            reload();
          }}
        >
          Edit plan
        </button>
      </section>
    );
  }

  return (
    <section className="care-plan">
      <header className="care-plan__head">
        <div>
          <h2>Build care plan</h2>
          <p>Assign a module, pick exercises, and schedule what {patient.name} will complete.</p>
        </div>
      </header>

      {error && (
        <p className="care-plan__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="care-plan__success">{success}</p>}

      <form className="care-plan__form" onSubmit={handleSubmit}>
        <div className="care-plan__step">
          <h3>1. Assign module</h3>
          <label className="care-plan__label" htmlFor="care-module">
            Therapy module
          </label>
          <select
            id="care-module"
            className="care-plan__select"
            value={moduleId}
            onChange={(e) => handleModuleChange(e.target.value)}
            required
          >
            <option value="">Select module…</option>
            {allModules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.domainName})
              </option>
            ))}
          </select>
        </div>

        {moduleId && (
          <div className="care-plan__step">
            <h3>2. Select exercises & levels</h3>
            {loadingExercises ? (
              <p className="care-plan__hint">Loading exercises…</p>
            ) : exercises.length === 0 ? (
              <p className="care-plan__hint">No exercises in this module yet.</p>
            ) : (
              <ul className="care-plan__exercise-list">
                {exercises.map((ex) => (
                  <li key={ex.exerciseId} className="care-plan__exercise-row">
                    <label className="care-plan__check">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ex.exerciseId)}
                        onChange={() => toggleExercise(ex.exerciseId)}
                      />
                      <span>{ex.exerciseName}</span>
                    </label>
                    {selectedIds.has(ex.exerciseId) && (
                      <div className="care-plan__exercise-controls">
                        <select
                          className="care-plan__select care-plan__select--sm"
                          value={ex.level}
                          onChange={(e) =>
                            updateExercise(ex.exerciseId, {
                              level: e.target.value as PlanDifficulty,
                            })
                          }
                        >
                          {LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="care-plan__input care-plan__input--sm"
                          min={5}
                          max={60}
                          value={ex.durationMinutes}
                          onChange={(e) =>
                            updateExercise(ex.exerciseId, {
                              durationMinutes: Number(e.target.value),
                            })
                          }
                          aria-label="Minutes"
                        />
                        <span className="care-plan__unit">min</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="care-plan__step">
          <h3>3. Schedule</h3>
          <div className="care-plan__row">
            <div className="care-plan__field">
              <label className="care-plan__label" htmlFor="care-start">
                Start date
              </label>
              <input
                id="care-start"
                type="date"
                className="care-plan__input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="care-plan__field">
              <label className="care-plan__label" htmlFor="care-sessions">
                Sessions per week
              </label>
              <input
                id="care-sessions"
                type="number"
                className="care-plan__input"
                min={1}
                max={7}
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </div>

        <div className="care-plan__step">
          <h3>4. Clinical notes</h3>
          <textarea
            className="care-plan__textarea"
            placeholder="Goals, precautions, or instructions for this patient…"
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            rows={3}
          />
        </div>

        <button type="submit" className="care-plan__submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save & activate plan'}
        </button>
      </form>
    </section>
  );
}
