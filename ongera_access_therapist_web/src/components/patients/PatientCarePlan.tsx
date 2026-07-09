import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isApiEnabled } from '../../config/api';
import { useModuleCatalog } from '../../hooks/useModules';
import { useCarePlan } from '../../hooks/useCarePlan';
import {
  activeDays,
  assignmentsToRecord,
  autoAssignExercises,
  buildWeeklyPlan,
  DAY_LABELS,
  formatDateLabel,
  formatMinutes,
  normalizeCarePlanExercise,
  planExercises,
  planWeeks,
  pruneAssignments,
  recordToAssignments,
  resolveWeeklyPlan,
  saveCarePlan,
  sortTherapyDays,
  suggestEndDate,
  unassignedExerciseIds,
  weeklyMinutes,
} from '../../services/carePlanService';
import { assignModules } from '../../services/moduleAssignmentService';
import { availablePlanLevels, getModule } from '../../services/moduleService';
import type {
  CarePlanExercise,
  CarePlanModule,
  PatientCarePlan,
  PlanDifficulty,
} from '../../types/carePlan';
import type { CarePlanDraftPrefill } from '../../types/prescription';
import type { Patient } from '../../types/patients';
import './PatientCarePlan.css';

const LEVEL_LABELS: Record<PlanDifficulty, string> = {
  BEGINNER: '1',
  INTERMEDIATE: '2',
  ADVANCED: '3',
};

function formatLevels(levels: PlanDifficulty[]) {
  return levels.map((level) => LEVEL_LABELS[level]).join(', ');
}

function resolveExerciseLevels(
  prior: CarePlanExercise | undefined,
  available: PlanDifficulty[],
): PlanDifficulty[] {
  const fallback = available[0] ?? 'BEGINNER';
  if (!prior) return [fallback];

  const normalized = normalizeCarePlanExercise(
    { ...prior, availableLevels: available },
    available,
  );
  return normalized.levels.length > 0 ? normalized.levels : [fallback];
}

interface SelectedModule {
  moduleId: string;
  moduleName: string;
  domainName?: string;
}

interface Props {
  patient: Patient;
  draftPrefill?: CarePlanDraftPrefill | null;
  onPlanSent?: (plan: PatientCarePlan) => void;
  onChangePatient?: () => void;
  demoMode?: boolean;
}

export function PatientCarePlanPanel({
  patient,
  draftPrefill,
  onPlanSent,
  onChangePatient,
  demoMode,
}: Props) {
  const { token } = useAuth();
  const { catalog, reload: reloadCatalog } = useModuleCatalog();
  const { plan, reload, save } = useCarePlan(patient.id);

  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [exercisesByModule, setExercisesByModule] = useState<Record<string, CarePlanExercise[]>>({});
  const [includedIds, setIncludedIds] = useState<Set<string>>(new Set());
  const [loadingModules, setLoadingModules] = useState<Set<string>>(new Set());

  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => suggestEndDate(new Date().toISOString().slice(0, 10)));
  const [therapyDays, setTherapyDays] = useState<number[]>(() => activeDays(5));
  const [weeklyAssignments, setWeeklyAssignments] = useState<Record<number, string[]>>({});
  const [scheduleCustomized, setScheduleCustomized] = useState(false);
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

  useEffect(() => {
    reloadCatalog();
  }, [reloadCatalog]);

  const loadModuleExercises = useCallback(
    async (moduleId: string, preserve?: CarePlanExercise[]) => {
      if (!token) return;
      setLoadingModules((prev) => new Set(prev).add(moduleId));
      try {
        const detail = await getModule(token, moduleId);
        const preserveMap = new Map((preserve ?? []).map((e) => [e.exerciseId, e]));
        const mapped: CarePlanExercise[] = detail.exercises.map((ex) => {
          const prior = preserveMap.get(ex.id);
          const available = availablePlanLevels(ex);
          return {
            exerciseId: ex.id,
            exerciseName: ex.name,
            moduleId,
            moduleName: detail.name,
            levels: resolveExerciseLevels(prior, available),
            durationMinutes: prior?.durationMinutes ?? 15,
            availableLevels: available,
          };
        });
        setExercisesByModule((prev) => ({ ...prev, [moduleId]: mapped }));
        setIncludedIds((prev) => {
          const next = new Set(prev);
          for (const ex of mapped) {
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
    const days = plan.therapyDays ?? activeDays(plan.daysPerWeek);
    setTherapyDays(days);
    setWeeklyAssignments(
      plan.weeklyAssignments
        ? assignmentsToRecord(plan.weeklyAssignments)
        : autoAssignExercises(
            planExercises(plan.modules).map((exercise) => exercise.exerciseId),
            days,
          ),
    );
    setScheduleCustomized(!!plan.weeklyAssignments?.length);
    setDailyHours(Math.round((plan.dailyMinutes / 60) * 2) / 2);
    setClinicalNotes(plan.clinicalNotes);
    for (const m of plan.modules) {
      void loadModuleExercises(m.moduleId, m.exercises);
    }
  }, [plan, hydratedFromPlan, loadModuleExercises]);

  useEffect(() => {
    if (!draftPrefill || plan || hydratedFromPlan) return;
    if (draftPrefill.startDate) {
      setStartDate(draftPrefill.startDate);
      setEndDate(suggestEndDate(draftPrefill.startDate));
    }
    if (draftPrefill.sessionsPerWeek) {
      const days = activeDays(draftPrefill.sessionsPerWeek);
      setTherapyDays(days);
    }
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
    patch: Partial<Pick<CarePlanExercise, 'levels' | 'durationMinutes'>>,
  ) {
    setExercisesByModule((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] ?? []).map((e) =>
        e.exerciseId === exerciseId ? { ...e, ...patch } : e,
      ),
    }));
  }

  function toggleExerciseLevel(
    moduleId: string,
    exerciseId: string,
    level: PlanDifficulty,
  ) {
    setExercisesByModule((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] ?? []).map((exercise) => {
        if (exercise.exerciseId !== exerciseId) return exercise;
        const selected = exercise.levels.includes(level);
        const next = selected
          ? exercise.levels.filter((item) => item !== level)
          : [...exercise.levels, level];
        if (next.length === 0) return exercise;
        return { ...exercise, levels: next };
      }),
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

  const includedExercises = useMemo(() => planExercises(planModules), [planModules]);
  const exerciseIds = useMemo(
    () => includedExercises.map((exercise) => exercise.exerciseId),
    [includedExercises],
  );

  useEffect(() => {
    const validIds = new Set(exerciseIds);
    setWeeklyAssignments((prev) => pruneAssignments(prev, validIds, therapyDays));
  }, [exerciseIds, therapyDays]);

  useEffect(() => {
    if (scheduleCustomized || exerciseIds.length === 0) return;
    setWeeklyAssignments(autoAssignExercises(exerciseIds, therapyDays));
  }, [exerciseIds, therapyDays, scheduleCustomized]);

  const weeklyPlan = useMemo(
    () => resolveWeeklyPlan(planModules, therapyDays, weeklyAssignments),
    [planModules, therapyDays, weeklyAssignments],
  );
  const unassignedIds = useMemo(
    () => unassignedExerciseIds(exerciseIds, weeklyAssignments),
    [exerciseIds, weeklyAssignments],
  );
  const totalExercises = exerciseIds.length;

  function markScheduleCustomized() {
    setScheduleCustomized(true);
  }

  function toggleTherapyDay(day: number) {
    markScheduleCustomized();
    setTherapyDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev;
        setWeeklyAssignments((assignments) => {
          const next = { ...assignments };
          delete next[day];
          return next;
        });
        const next = prev.filter((item) => item !== day);
        return next;
      }
      const next = sortTherapyDays([...prev, day]);
      return next;
    });
  }

  function assignExerciseToDay(exerciseId: string, day: number) {
    markScheduleCustomized();
    setWeeklyAssignments((prev) => ({
      ...prev,
      [day]: [...(prev[day] ?? []), exerciseId],
    }));
  }

  function unassignExercise(day: number, exerciseId: string) {
    markScheduleCustomized();
    setWeeklyAssignments((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((id) => id !== exerciseId),
    }));
  }

  function moveExercise(day: number, index: number, direction: -1 | 1) {
    markScheduleCustomized();
    setWeeklyAssignments((prev) => {
      const list = [...(prev[day] ?? [])];
      const target = index + direction;
      if (target < 0 || target >= list.length) return prev;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, [day]: list };
    });
  }

  function autoArrangeSchedule() {
    setScheduleCustomized(true);
    setWeeklyAssignments(autoAssignExercises(exerciseIds, therapyDays));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (planModules.length === 0) {
      setError('Select at least one module and include at least one exercise.');
      return;
    }
    if (planModules.some((mod) => mod.exercises.some((exercise) => exercise.levels.length === 0))) {
      setError('Each included exercise needs at least one difficulty level.');
      return;
    }
    if (unassignedIds.length > 0) {
      setError('Assign every exercise to a day in the weekly plan.');
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
        daysPerWeek: therapyDays.length,
        therapyDays,
        weeklyAssignments: recordToAssignments(weeklyAssignments),
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
          ? 'Demo plan saved for preview.'
          : isApiEnabled()
            ? `Care plan sent to the patient app${assignNote}.`
            : 'Care plan saved for this patient.',
      );
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  if (plan?.status === 'active') {
    return (
      <ActivePlanView
        plan={plan}
        onEdit={() => {
          saveCarePlan({ ...plan, status: 'draft' });
          setHydratedFromPlan(false);
          reload();
        }}
      />
    );
  }

  return (
    <section className="care-plan">
      <header className="care-plan__head">
        <h2 className="care-plan__title">{patient.name}</h2>
        {onChangePatient && (
          <button type="button" className="care-plan__change-patient" onClick={onChangePatient}>
            Change
          </button>
        )}
      </header>

      {error && (
        <p className="care-plan__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="care-plan__success">{success}</p>}

      <div className="care-plan__layout">
        <form className="care-plan__form" onSubmit={handleSubmit}>
          <section className="care-plan__section">
            <h3 className="care-plan__section-title">Modules</h3>
            <div className="care-plan__module-picker">
              {allModules.length === 0 ? (
                <p className="care-plan__hint">No modules.</p>
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
                      {m.name}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {selectedModules.length > 0 && (
            <section className="care-plan__section">
              <div className="care-plan__section-head">
                <h3 className="care-plan__section-title">Exercises</h3>
                <button
                  type="button"
                  className="care-plan__link-btn care-plan__link-btn--refresh"
                  onClick={() => {
                    for (const mod of selectedModules) {
                      void loadModuleExercises(mod.moduleId, exercisesByModule[mod.moduleId]);
                    }
                  }}
                  disabled={loadingModules.size > 0}
                >
                  Refresh
                </button>
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
                      <p className="care-plan__hint">Loading…</p>
                    ) : exercises.length === 0 ? (
                      <p className="care-plan__hint">None</p>
                    ) : (
                      <ul className="care-plan__exercise-list">
                        {exercises.map((ex) => {
                          const included = includedIds.has(ex.exerciseId);
                          const available = ex.availableLevels ?? ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
                          return (
                            <li
                              key={ex.exerciseId}
                              className={
                                included
                                  ? 'care-plan__exercise-row care-plan__exercise-row--on'
                                  : 'care-plan__exercise-row'
                              }
                            >
                              <label className="care-plan__check">
                                <input
                                  type="checkbox"
                                  checked={included}
                                  onChange={() => toggleExercise(ex.exerciseId)}
                                />
                                <span className="care-plan__exercise-name">{ex.exerciseName}</span>
                              </label>
                              {included && (
                                <div className="care-plan__exercise-controls">
                                  <div
                                    className="care-plan__level-picker"
                                    role="group"
                                    aria-label={`Levels for ${ex.exerciseName}`}
                                  >
                                    {available.map((level) => {
                                      const active = ex.levels.includes(level);
                                      return (
                                        <button
                                          key={level}
                                          type="button"
                                          className={
                                            active
                                              ? 'care-plan__level-btn care-plan__level-btn--active'
                                              : 'care-plan__level-btn'
                                          }
                                          aria-pressed={active}
                                          onClick={() =>
                                            toggleExerciseLevel(sm.moduleId, ex.exerciseId, level)
                                          }
                                        >
                                          {LEVEL_LABELS[level]}
                                        </button>
                                      );
                                    })}
                                  </div>
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
                                      aria-label={`Minutes for ${ex.exerciseName}`}
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
            </section>
          )}

          <section className="care-plan__section">
            <h3 className="care-plan__section-title">Schedule</h3>
            <div className="care-plan__grid care-plan__grid--schedule">
              <div className="care-plan__field">
                <label className="care-plan__label" htmlFor="care-start">
                  Start
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
                  End
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
                <label className="care-plan__label" htmlFor="care-daily">
                  Hrs/day
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
          </section>

          <section className="care-plan__section care-plan__section--notes">
            <label className="care-plan__section-title" htmlFor="care-notes">
              Notes
            </label>
            <textarea
              id="care-notes"
              className="care-plan__textarea"
              placeholder="Instructions for patient"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={2}
            />
          </section>

          <button type="submit" className="care-plan__submit" disabled={saving}>
            {saving ? 'Sending…' : 'Send plan'}
          </button>
        </form>

        <aside className="care-plan__preview" aria-label="Plan preview">
          <PlanSummary
            modules={planModules}
            startDate={startDate}
            endDate={endDate}
            daysPerWeek={therapyDays.length}
            dailyMinutes={dailyMinutes}
            weeklyPlan={weeklyPlan}
            totalExercises={totalExercises}
            clinicalNotes={clinicalNotes}
            therapyDays={therapyDays}
            unassignedIds={unassignedIds}
            exercisesById={new Map(includedExercises.map((exercise) => [exercise.exerciseId, exercise]))}
            onToggleDay={toggleTherapyDay}
            onAssign={assignExerciseToDay}
            onUnassign={unassignExercise}
            onMove={moveExercise}
            onAutoArrange={autoArrangeSchedule}
          />
        </aside>
      </div>
    </section>
  );
}

function ActivePlanView({ plan, onEdit }: { plan: PatientCarePlan; onEdit: () => void }) {
  const therapyDays = plan.therapyDays ?? activeDays(plan.daysPerWeek);
  const weeklyPlan = useMemo(
    () =>
      buildWeeklyPlan(plan.modules, therapyDays, plan.weeklyAssignments),
    [plan.modules, therapyDays, plan.weeklyAssignments],
  );

  return (
    <section className="care-plan">
      <header className="care-plan__head">
        <div>
          <h2 className="care-plan__title">{plan.patientName ?? 'Patient'}</h2>
          <p className="care-plan__subtitle">
            Sent {plan.sentAt ? formatDateLabel(plan.sentAt) : ''}
          </p>
        </div>
        <span className="care-plan__badge">Active</span>
      </header>

      <PlanSummary
        modules={plan.modules}
        startDate={plan.startDate}
        endDate={plan.endDate}
        daysPerWeek={therapyDays.length}
        dailyMinutes={plan.dailyMinutes}
        weeklyPlan={weeklyPlan}
        totalExercises={planExercises(plan.modules).length}
        clinicalNotes={plan.clinicalNotes}
      />

      <button type="button" className="care-plan__edit-btn" onClick={onEdit}>
        Edit
      </button>
    </section>
  );
}

function PlanSummary({
  modules,
  startDate,
  endDate,
  daysPerWeek,
  dailyMinutes,
  weeklyPlan,
  totalExercises,
  clinicalNotes,
  therapyDays,
  unassignedIds = [],
  exercisesById,
  onToggleDay,
  onAssign,
  onUnassign,
  onMove,
  onAutoArrange,
}: {
  modules: CarePlanModule[];
  startDate: string;
  endDate: string;
  daysPerWeek: number;
  dailyMinutes: number;
  weeklyPlan: ReturnType<typeof buildWeeklyPlan>;
  totalExercises: number;
  clinicalNotes: string;
  therapyDays?: number[];
  unassignedIds?: string[];
  exercisesById?: Map<string, CarePlanExercise>;
  onToggleDay?: (day: number) => void;
  onAssign?: (exerciseId: string, day: number) => void;
  onUnassign?: (day: number, exerciseId: string) => void;
  onMove?: (day: number, index: number, direction: -1 | 1) => void;
  onAutoArrange?: () => void;
}) {
  const weeks = planWeeks(startDate, endDate);
  const weeklyMin = weeklyMinutes(dailyMinutes, daysPerWeek);
  const editable = !!onToggleDay;

  if (modules.length === 0) {
    return (
      <div className="care-plan__preview-card care-plan__preview-card--empty">
        <h3>Summary</h3>
        <p className="care-plan__hint">Add modules and exercises.</p>
      </div>
    );
  }

  return (
    <div className="care-plan__preview-card">
      <h3>Summary</h3>

      <p className="care-plan__preview-summary">
        <strong>{totalExercises}</strong> exercises · <strong>{formatMinutes(dailyMinutes)}</strong>/day ·{' '}
        <strong>{daysPerWeek}</strong> days
      </p>

      <p className="care-plan__preview-window">
        {formatDateLabel(startDate)} → {formatDateLabel(endDate)} · {weeks} wk
        {weeks === 1 ? '' : 's'} · {formatMinutes(weeklyMin)}/wk
      </p>

      <div className="care-plan__preview-modules">
        {modules.map((m) => (
          <span key={m.moduleId} className="care-plan__preview-tag">
            {m.moduleName}
          </span>
        ))}
      </div>

      <div className="care-plan__weekly-breakdown">
        <div className="care-plan__weekly-breakdown-head">
          <h4>Week</h4>
          {editable && onAutoArrange && (
            <button type="button" className="care-plan__link-btn care-plan__link-btn--refresh" onClick={onAutoArrange}>
              Auto
            </button>
          )}
        </div>

        {editable && therapyDays && onToggleDay && (
          <div className="care-plan__therapy-days" role="group" aria-label="Therapy days">
            {DAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                className={
                  therapyDays.includes(day)
                    ? 'care-plan__therapy-day care-plan__therapy-day--active'
                    : 'care-plan__therapy-day'
                }
                aria-pressed={therapyDays.includes(day)}
                onClick={() => onToggleDay(day)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {editable && unassignedIds.length > 0 && exercisesById && onAssign && therapyDays && (
          <div className="care-plan__unassigned">
            <p className="care-plan__unassigned-title">Unassigned ({unassignedIds.length})</p>
            <ul className="care-plan__unassigned-list">
              {unassignedIds.map((id) => {
                const exercise = exercisesById.get(id);
                if (!exercise) return null;
                return (
                  <li key={id} className="care-plan__schedule-item">
                    <span className="care-plan__schedule-item-name">{exercise.exerciseName}</span>
                    <select
                      className="care-plan__select care-plan__select--assign"
                      defaultValue=""
                      onChange={(e) => {
                        const day = Number(e.target.value);
                        if (!Number.isNaN(day)) onAssign(id, day);
                        e.target.value = '';
                      }}
                      aria-label={`Assign ${exercise.exerciseName} to a day`}
                    >
                      <option value="">Add…</option>
                      {sortTherapyDays(therapyDays).map((day) => (
                        <option key={day} value={day}>
                          {DAY_LABELS[day]}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <ol className="care-plan__week">
          {weeklyPlan.map((day) => (
            <li key={day.dayOfWeek} className="care-plan__day">
              <div className="care-plan__day-head">
                <span className="care-plan__day-name">{DAY_LABELS[day.dayOfWeek]}</span>
                <span className="care-plan__day-total">{formatMinutes(day.totalMinutes)}</span>
              </div>
              {day.exercises.length === 0 ? (
                <p className="care-plan__day-rest">—</p>
              ) : (
                <ul className="care-plan__day-exercises">
                  {day.exercises.map((ex, index) => (
                    <li key={`${ex.exerciseId}-${index}`}>
                      <div className="care-plan__day-exercise-row">
                        <div>
                          {ex.exerciseName}
                          <span className="care-plan__day-exercise-meta">
                            {formatLevels(ex.levels)} · {ex.durationMinutes} min
                          </span>
                        </div>
                        {editable && onMove && onUnassign && (
                          <div className="care-plan__schedule-actions">
                            <button
                              type="button"
                              className="care-plan__schedule-btn"
                              disabled={index === 0}
                              onClick={() => onMove(day.dayOfWeek, index, -1)}
                              aria-label={`Move ${ex.exerciseName} up`}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="care-plan__schedule-btn"
                              disabled={index === day.exercises.length - 1}
                              onClick={() => onMove(day.dayOfWeek, index, 1)}
                              aria-label={`Move ${ex.exerciseName} down`}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="care-plan__schedule-btn care-plan__schedule-btn--remove"
                              onClick={() => onUnassign(day.dayOfWeek, ex.exerciseId)}
                              aria-label={`Remove ${ex.exerciseName}`}
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>

      {clinicalNotes.trim() && (
        <div className="care-plan__preview-notes">
          <span className="care-plan__preview-notes-label">Notes</span>
          <p>{clinicalNotes}</p>
        </div>
      )}
    </div>
  );
}
