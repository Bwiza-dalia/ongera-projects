import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isApiEnabled } from '../../config/api';
import { useModuleCatalog } from '../../hooks/useModules';
import { useCarePlan } from '../../hooks/useCarePlan';
import {
  buildWeeklyPlan,
  DAY_LABELS_LONG,
  formatDateLabel,
  formatMinutes,
  planExercises,
  planWeeks,
  saveCarePlan,
  suggestEndDate,
  weeklyMinutes,
} from '../../services/carePlanService';
import { assignModules } from '../../services/moduleAssignmentService';
import { getModule } from '../../services/moduleService';
import type {
  CarePlanExercise,
  CarePlanModule,
  PatientCarePlan,
  PlanDifficulty,
} from '../../types/carePlan';
import type { CarePlanDraftPrefill } from '../../types/prescription';
import type { Patient } from '../../types/patients';
import './PatientCarePlan.css';

const LEVELS: PlanDifficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
// Matches the admin catalog and API, which use numeric difficulty levels (1–3).
const LEVEL_LABELS: Record<PlanDifficulty, string> = {
  BEGINNER: 'Level 1',
  INTERMEDIATE: 'Level 2',
  ADVANCED: 'Level 3',
};

interface SelectedModule {
  moduleId: string;
  moduleName: string;
  domainName?: string;
}

interface Props {
  patient: Patient;
  draftPrefill?: CarePlanDraftPrefill | null;
  onPlanSent?: (plan: PatientCarePlan) => void;
  /** Sample/preview patient that does not exist in the API — skip the assign call. */
  demoMode?: boolean;
}

export function PatientCarePlanPanel({ patient, draftPrefill, onPlanSent, demoMode }: Props) {
  const { token } = useAuth();
  const { catalog } = useModuleCatalog();
  const { plan, reload, save } = useCarePlan(patient.id);

  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [exercisesByModule, setExercisesByModule] = useState<Record<string, CarePlanExercise[]>>({});
  const [includedIds, setIncludedIds] = useState<Set<string>>(new Set());
  const [loadingModules, setLoadingModules] = useState<Set<string>>(new Set());

  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => suggestEndDate(new Date().toISOString().slice(0, 10)));
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [dailyHours, setDailyHours] = useState(3);
  const [clinicalNotes, setClinicalNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [hydratedFromPlan, setHydratedFromPlan] = useState(false);

  const allModules = useMemo(
    () => catalog.domains.flatMap((d) => d.modules.map((m) => ({ ...m, domainName: d.name }))),
    [catalog],
  );

  const loadModuleExercises = useCallback(
    async (moduleId: string, preserve?: CarePlanExercise[]) => {
      if (!token) return;
      setLoadingModules((prev) => new Set(prev).add(moduleId));
      try {
        const detail = await getModule(token, moduleId);
        const preserveMap = new Map((preserve ?? []).map((e) => [e.exerciseId, e]));
        const mapped: CarePlanExercise[] = detail.exercises.map((ex) => {
          const prior = preserveMap.get(ex.id);
          return {
            exerciseId: ex.id,
            exerciseName: ex.name,
            moduleId,
            moduleName: detail.name,
            level: prior?.level ?? 'BEGINNER',
            durationMinutes: prior?.durationMinutes ?? 15,
          };
        });
        setExercisesByModule((prev) => ({ ...prev, [moduleId]: mapped }));
        setIncludedIds((prev) => {
          const next = new Set(prev);
          for (const ex of mapped) {
            // Include all by default, unless we are preserving a prior selection.
            if (!preserve || preserveMap.has(ex.exerciseId)) next.add(ex.exerciseId);
          }
          return next;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exercises');
      } finally {
        setLoadingModules((prev) => {
          const next = new Set(prev);
          next.delete(moduleId);
          return next;
        });
      }
    },
    [token],
  );

  // Hydrate the form from an existing (editable) plan once.
  useEffect(() => {
    if (!plan || hydratedFromPlan) return;
    setHydratedFromPlan(true);
    setSelectedModules(
      plan.modules.map((m) => ({
        moduleId: m.moduleId,
        moduleName: m.moduleName,
        domainName: m.domainName,
      })),
    );
    setStartDate(plan.startDate);
    setEndDate(plan.endDate);
    setDaysPerWeek(plan.daysPerWeek);
    setDailyHours(Math.round((plan.dailyMinutes / 60) * 2) / 2);
    setClinicalNotes(plan.clinicalNotes);
    for (const m of plan.modules) {
      void loadModuleExercises(m.moduleId, m.exercises);
    }
  }, [plan, hydratedFromPlan, loadModuleExercises]);

  // Prefill from a request/prescription draft (only when no saved plan yet).
  useEffect(() => {
    if (!draftPrefill || plan || hydratedFromPlan) return;
    if (draftPrefill.startDate) {
      setStartDate(draftPrefill.startDate);
      setEndDate(suggestEndDate(draftPrefill.startDate));
    }
    if (draftPrefill.sessionsPerWeek) setDaysPerWeek(draftPrefill.sessionsPerWeek);
    if (draftPrefill.clinicalNotes) setClinicalNotes(draftPrefill.clinicalNotes);
    if (draftPrefill.moduleId) {
      const mod = allModules.find((m) => m.id === draftPrefill.moduleId);
      if (mod) {
        setSelectedModules((prev) =>
          prev.some((s) => s.moduleId === mod.id)
            ? prev
            : [...prev, { moduleId: mod.id, moduleName: mod.name, domainName: mod.domainName }],
        );
        void loadModuleExercises(mod.id);
      }
    }
  }, [draftPrefill, plan, hydratedFromPlan, allModules, loadModuleExercises]);

  const dailyMinutes = Math.round(dailyHours * 60);

  function toggleModule(moduleId: string) {
    const already = selectedModules.some((s) => s.moduleId === moduleId);
    if (already) {
      setSelectedModules((prev) => prev.filter((s) => s.moduleId !== moduleId));
      setIncludedIds((prev) => {
        const next = new Set(prev);
        for (const ex of exercisesByModule[moduleId] ?? []) next.delete(ex.exerciseId);
        return next;
      });
      setExercisesByModule((prev) => {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      });
      return;
    }
    const mod = allModules.find((m) => m.id === moduleId);
    if (!mod) return;
    setError('');
    setSelectedModules((prev) => [
      ...prev,
      { moduleId: mod.id, moduleName: mod.name, domainName: mod.domainName },
    ]);
    void loadModuleExercises(mod.id);
  }

  function toggleExercise(exerciseId: string) {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }

  function updateExercise(
    moduleId: string,
    exerciseId: string,
    patch: Partial<Pick<CarePlanExercise, 'level' | 'durationMinutes'>>,
  ) {
    setExercisesByModule((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] ?? []).map((e) =>
        e.exerciseId === exerciseId ? { ...e, ...patch } : e,
      ),
    }));
  }

  const planModules: CarePlanModule[] = useMemo(
    () =>
      selectedModules
        .map((sm) => ({
          moduleId: sm.moduleId,
          moduleName: sm.moduleName,
          domainName: sm.domainName,
          exercises: (exercisesByModule[sm.moduleId] ?? []).filter((e) =>
            includedIds.has(e.exerciseId),
          ),
        }))
        .filter((m) => m.exercises.length > 0),
    [selectedModules, exercisesByModule, includedIds],
  );

  const weeklyPlan = useMemo(
    () => buildWeeklyPlan(planModules, daysPerWeek),
    [planModules, daysPerWeek],
  );
  const totalExercises = planExercises(planModules).length;
  const weeks = planWeeks(startDate, endDate);
  const weeklyMin = weeklyMinutes(dailyMinutes, daysPerWeek);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (planModules.length === 0) {
      setError('Select at least one module and include at least one exercise.');
      return;
    }
    if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      setError('End date must be after the start date.');
      return;
    }

    setSaving(true);
    try {
      let assignNote = '';
      if (isApiEnabled() && token && !demoMode) {
        const res = await assignModules(
          token,
          patient.id,
          planModules.map((m) => m.moduleId),
        );
        if (res.failed.length > 0) {
          setError(
            `Could not assign ${res.failed.length} module(s): ${res.failed
              .map((f) => f.message)
              .join('; ')}`,
          );
          setSaving(false);
          return;
        }
        assignNote =
          res.alreadyAssigned.length > 0
            ? ` (${res.assigned.length} newly assigned, ${res.alreadyAssigned.length} already assigned)`
            : '';
      }

      const sentAt = new Date().toISOString();
      const next: PatientCarePlan = {
        patientId: patient.id,
        patientName: patient.name,
        modules: planModules,
        startDate,
        endDate,
        daysPerWeek,
        dailyMinutes,
        clinicalNotes: clinicalNotes.trim(),
        status: 'active',
        updatedAt: sentAt,
        sentAt,
        sourceType: draftPrefill?.sourceType ?? 'manual',
        sourceId: draftPrefill?.sourceId,
      };
      save(next);
      onPlanSent?.(next);
      setSuccess(
        demoMode
          ? 'Demo plan saved for preview. (No API call — this is a sample patient.)'
          : isApiEnabled()
            ? `Care plan sent. Modules assigned and the routine is now visible in the patient app${assignNote}.`
            : 'Care plan saved and marked as sent for this patient.',
      );
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  // ---- Active plan (read-only summary) ----
  if (plan?.status === 'active') {
    return <ActivePlanView plan={plan} onEdit={() => {
      saveCarePlan({ ...plan, status: 'draft' });
      setHydratedFromPlan(false);
      reload();
    }} />;
  }

  return (
    <section className="care-plan">
      <header className="care-plan__head">
        <div>
          <h2>Build care plan for {patient.name}</h2>
          <p className="care-plan__subtitle">
            Assign one or more therapy modules, set the schedule, and preview exactly what the
            patient will follow before sending.
          </p>
        </div>
      </header>

      {error && (
        <p className="care-plan__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="care-plan__success">{success}</p>}

      <div className="care-plan__layout">
        <form className="care-plan__form" onSubmit={handleSubmit}>
          {/* STEP 1 — modules */}
          <div className="care-plan__step">
            <div className="care-plan__step-head">
              <span className="care-plan__step-num">1</span>
              <div>
                <h3>Assign modules</h3>
                <p className="care-plan__step-hint">
                  A patient can follow more than one module. Tap to add or remove.
                </p>
              </div>
            </div>

            <div className="care-plan__module-picker">
              {allModules.length === 0 ? (
                <p className="care-plan__hint">No modules available yet.</p>
              ) : (
                allModules.map((m) => {
                  const active = selectedModules.some((s) => s.moduleId === m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={
                        active
                          ? 'care-plan__module-chip care-plan__module-chip--active'
                          : 'care-plan__module-chip'
                      }
                      onClick={() => toggleModule(m.id)}
                      aria-pressed={active}
                    >
                      <span className="care-plan__module-chip-name">{m.name}</span>
                      <span className="care-plan__module-chip-domain">{m.domainName}</span>
                      <span className="care-plan__module-chip-mark" aria-hidden="true">
                        {active ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* STEP 2 — exercises per module */}
          {selectedModules.length > 0 && (
            <div className="care-plan__step">
              <div className="care-plan__step-head">
                <span className="care-plan__step-num">2</span>
                <div>
                  <h3>Choose exercises &amp; levels</h3>
                  <p className="care-plan__step-hint">
                    Pick which exercises to include and set difficulty and time each.
                  </p>
                </div>
              </div>

              {selectedModules.map((sm) => {
                const exercises = exercisesByModule[sm.moduleId] ?? [];
                const isLoading = loadingModules.has(sm.moduleId);
                return (
                  <div key={sm.moduleId} className="care-plan__module-block">
                    <div className="care-plan__module-block-head">
                      <h4>{sm.moduleName}</h4>
                      <button
                        type="button"
                        className="care-plan__link-btn"
                        onClick={() => toggleModule(sm.moduleId)}
                      >
                        Remove
                      </button>
                    </div>
                    {isLoading ? (
                      <p className="care-plan__hint">Loading exercises…</p>
                    ) : exercises.length === 0 ? (
                      <p className="care-plan__hint">No exercises in this module yet.</p>
                    ) : (
                      <ul className="care-plan__exercise-list">
                        {exercises.map((ex) => {
                          const included = includedIds.has(ex.exerciseId);
                          return (
                            <li key={ex.exerciseId} className="care-plan__exercise-row">
                              <label className="care-plan__check">
                                <input
                                  type="checkbox"
                                  checked={included}
                                  onChange={() => toggleExercise(ex.exerciseId)}
                                />
                                <span>{ex.exerciseName}</span>
                              </label>
                              {included && (
                                <div className="care-plan__exercise-controls">
                                  <select
                                    className="care-plan__select care-plan__select--sm"
                                    value={ex.level}
                                    onChange={(e) =>
                                      updateExercise(sm.moduleId, ex.exerciseId, {
                                        level: e.target.value as PlanDifficulty,
                                      })
                                    }
                                    aria-label="Difficulty level"
                                  >
                                    {LEVELS.map((l) => (
                                      <option key={l} value={l}>
                                        {LEVEL_LABELS[l]}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="care-plan__duration">
                                    <input
                                      type="number"
                                      className="care-plan__input care-plan__input--sm"
                                      min={5}
                                      max={120}
                                      step={5}
                                      value={ex.durationMinutes}
                                      onChange={(e) =>
                                        updateExercise(sm.moduleId, ex.exerciseId, {
                                          durationMinutes: Number(e.target.value),
                                        })
                                      }
                                      aria-label="Minutes"
                                    />
                                    <span className="care-plan__unit">min</span>
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 3 — schedule */}
          <div className="care-plan__step">
            <div className="care-plan__step-head">
              <span className="care-plan__step-num">3</span>
              <div>
                <h3>Schedule &amp; targets</h3>
                <p className="care-plan__step-hint">
                  Set the practice window and how much the patient should do.
                </p>
              </div>
            </div>

            <div className="care-plan__grid">
              <div className="care-plan__field">
                <label className="care-plan__label" htmlFor="care-start">
                  Start date
                </label>
                <input
                  id="care-start"
                  type="date"
                  className="care-plan__input"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (new Date(endDate) <= new Date(e.target.value)) {
                      setEndDate(suggestEndDate(e.target.value));
                    }
                  }}
                  required
                />
              </div>
              <div className="care-plan__field">
                <label className="care-plan__label" htmlFor="care-end">
                  End date
                </label>
                <input
                  id="care-end"
                  type="date"
                  className="care-plan__input"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div className="care-plan__field">
                <label className="care-plan__label" htmlFor="care-days">
                  Days per week
                </label>
                <input
                  id="care-days"
                  type="number"
                  className="care-plan__input"
                  min={1}
                  max={7}
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  required
                />
              </div>
              <div className="care-plan__field">
                <label className="care-plan__label" htmlFor="care-daily">
                  Hours per day
                </label>
                <input
                  id="care-daily"
                  type="number"
                  className="care-plan__input"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="care-plan__targets">
              <div className="care-plan__target">
                <span className="care-plan__target-value">{formatMinutes(weeklyMin)}</span>
                <span className="care-plan__target-label">recommended per week</span>
              </div>
              <div className="care-plan__target">
                <span className="care-plan__target-value">{weeks}</span>
                <span className="care-plan__target-label">week{weeks === 1 ? '' : 's'} total</span>
              </div>
              <div className="care-plan__target">
                <span className="care-plan__target-value">{formatMinutes(weeklyMin * weeks)}</span>
                <span className="care-plan__target-label">full program</span>
              </div>
            </div>
          </div>

          {/* STEP 4 — notes */}
          <div className="care-plan__step">
            <div className="care-plan__step-head">
              <span className="care-plan__step-num">4</span>
              <div>
                <h3>Clinical notes</h3>
                <p className="care-plan__step-hint">Goals, precautions, or instructions.</p>
              </div>
            </div>
            <textarea
              className="care-plan__textarea"
              placeholder="e.g. Focus on naming accuracy. Take breaks between sessions. Encourage caregiver support."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={3}
            />
          </div>

          <button type="submit" className="care-plan__submit" disabled={saving}>
            {saving ? 'Sending…' : 'Send plan to patient'}
          </button>
        </form>

        {/* PREVIEW — the plan the patient will follow */}
        <aside className="care-plan__preview" aria-label="Plan preview">
          <PlanSummary
            title="Plan the patient will follow"
            patientName={patient.name}
            modules={planModules}
            startDate={startDate}
            endDate={endDate}
            daysPerWeek={daysPerWeek}
            dailyMinutes={dailyMinutes}
            weeklyPlan={weeklyPlan}
            totalExercises={totalExercises}
            clinicalNotes={clinicalNotes}
          />
        </aside>
      </div>
    </section>
  );
}

function ActivePlanView({ plan, onEdit }: { plan: PatientCarePlan; onEdit: () => void }) {
  const weeklyPlan = useMemo(
    () => buildWeeklyPlan(plan.modules, plan.daysPerWeek),
    [plan.modules, plan.daysPerWeek],
  );

  return (
    <section className="care-plan">
      <header className="care-plan__head">
        <div>
          <h2>Active care plan</h2>
          <p className="care-plan__subtitle">
            Sent {plan.sentAt ? formatDateLabel(plan.sentAt) : ''} · The patient is following this
            routine in the app.
          </p>
        </div>
        <span className="care-plan__badge">Active</span>
      </header>

      <PlanSummary
        title={`${plan.patientName ?? 'Patient'}'s routine`}
        patientName={plan.patientName ?? 'Patient'}
        modules={plan.modules}
        startDate={plan.startDate}
        endDate={plan.endDate}
        daysPerWeek={plan.daysPerWeek}
        dailyMinutes={plan.dailyMinutes}
        weeklyPlan={weeklyPlan}
        totalExercises={planExercises(plan.modules).length}
        clinicalNotes={plan.clinicalNotes}
      />

      <button type="button" className="care-plan__edit-btn" onClick={onEdit}>
        Edit plan
      </button>
    </section>
  );
}

function PlanSummary({
  title,
  patientName,
  modules,
  startDate,
  endDate,
  daysPerWeek,
  dailyMinutes,
  weeklyPlan,
  totalExercises,
  clinicalNotes,
}: {
  title: string;
  patientName: string;
  modules: CarePlanModule[];
  startDate: string;
  endDate: string;
  daysPerWeek: number;
  dailyMinutes: number;
  weeklyPlan: ReturnType<typeof buildWeeklyPlan>;
  totalExercises: number;
  clinicalNotes: string;
}) {
  const weeks = planWeeks(startDate, endDate);
  const weeklyMin = weeklyMinutes(dailyMinutes, daysPerWeek);

  if (modules.length === 0) {
    return (
      <div className="care-plan__preview-card care-plan__preview-card--empty">
        <h3>{title}</h3>
        <p className="care-plan__hint">
          Select modules and exercises to preview the daily routine {patientName} will follow.
        </p>
      </div>
    );
  }

  return (
    <div className="care-plan__preview-card">
      <h3>{title}</h3>

      <div className="care-plan__preview-stats">
        <div>
          <span className="care-plan__preview-stat-value">{modules.length}</span>
          <span className="care-plan__preview-stat-label">
            module{modules.length === 1 ? '' : 's'}
          </span>
        </div>
        <div>
          <span className="care-plan__preview-stat-value">{totalExercises}</span>
          <span className="care-plan__preview-stat-label">
            exercise{totalExercises === 1 ? '' : 's'}
          </span>
        </div>
        <div>
          <span className="care-plan__preview-stat-value">{formatMinutes(dailyMinutes)}</span>
          <span className="care-plan__preview-stat-label">per day</span>
        </div>
        <div>
          <span className="care-plan__preview-stat-value">{formatMinutes(weeklyMin)}</span>
          <span className="care-plan__preview-stat-label">per week</span>
        </div>
      </div>

      <p className="care-plan__preview-window">
        {formatDateLabel(startDate)} → {formatDateLabel(endDate)} · {daysPerWeek} days/week ·{' '}
        {weeks} week{weeks === 1 ? '' : 's'}
      </p>

      <div className="care-plan__preview-modules">
        {modules.map((m) => (
          <span key={m.moduleId} className="care-plan__preview-tag">
            {m.moduleName}
          </span>
        ))}
      </div>

      <h4 className="care-plan__preview-subtitle">Weekly routine</h4>
      <ol className="care-plan__week">
        {weeklyPlan.map((day) => (
          <li key={day.dayOfWeek} className="care-plan__day">
            <div className="care-plan__day-head">
              <span className="care-plan__day-name">{DAY_LABELS_LONG[day.dayOfWeek]}</span>
              <span className="care-plan__day-total">{formatMinutes(day.totalMinutes)}</span>
            </div>
            {day.exercises.length === 0 ? (
              <p className="care-plan__day-rest">Rest / practice review</p>
            ) : (
              <ul className="care-plan__day-exercises">
                {day.exercises.map((ex, i) => (
                  <li key={`${ex.exerciseId}-${i}`}>
                    <span className="care-plan__day-exercise-name">{ex.exerciseName}</span>
                    <span className="care-plan__day-exercise-meta">
                      {LEVEL_LABELS[ex.level]} · {ex.durationMinutes} min · {ex.moduleName}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {clinicalNotes.trim() && (
        <div className="care-plan__preview-notes">
          <span className="care-plan__preview-notes-label">Notes for the patient</span>
          <p>{clinicalNotes}</p>
        </div>
      )}
    </div>
  );
}
