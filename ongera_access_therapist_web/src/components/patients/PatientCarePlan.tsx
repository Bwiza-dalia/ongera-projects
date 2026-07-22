import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModuleCatalog } from '../../hooks/useModules';
import { useCarePlan } from '../../hooks/useCarePlan';
import {
  activeDays,
  assignmentsToRecord,
  autoAssignExercises,
  buildModuleAssignmentPlans,
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
  unassignedExerciseIds,
  weeklyMinutes,
} from '../../services/carePlanService';
import { syncPatientPlan } from '../../services/moduleAssignmentService';
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

const WIZARD_STEPS = ['Modules', 'Exercises', 'Schedule', 'Weekly plan', 'Review'] as const;

function formatStartingLevel(levels: PlanDifficulty[]) {
  const level = levels[0];
  return level ? `Level ${LEVEL_LABELS[level]}` : 'No level';
}

const LEVEL_ORDER: Record<PlanDifficulty, number> = {
  BEGINNER: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
};

function resolveExerciseLevels(
  prior: CarePlanExercise | undefined,
  available: PlanDifficulty[],
): PlanDifficulty[] {
  if (available.length === 0) return [];
  if (!prior) return [available[0]];

  const normalized = normalizeCarePlanExercise(
    { ...prior, availableLevels: available },
    available,
  );
  const candidates = normalized.levels.length > 0 ? normalized.levels : [available[0]];
  const starting = [...candidates].sort(
    (a, b) => LEVEL_ORDER[a] - LEVEL_ORDER[b],
  )[0];
  return starting ? [starting] : [available[0]];
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
}

export function PatientCarePlanPanel({
  patient,
  draftPrefill,
  onPlanSent,
  onChangePatient,
}: Props) {
  const { token } = useAuth();
  const { catalog, reload: reloadCatalog } = useModuleCatalog();
  const { plan, reload, save } = useCarePlan(patient.id, patient.name);

  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [exercisesByModule, setExercisesByModule] = useState<Record<string, CarePlanExercise[]>>({});
  const [includedIds, setIncludedIds] = useState<Set<string>>(new Set());
  const [loadingModules, setLoadingModules] = useState<Set<string>>(new Set());

  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [therapyDays, setTherapyDays] = useState<number[]>(() => activeDays(5));
  const [weeklyAssignments, setWeeklyAssignments] = useState<Record<number, string[]>>({});
  const [scheduleCustomized, setScheduleCustomized] = useState(false);
  const [dailyHours, setDailyHours] = useState(3);
  const [clinicalNotes, setClinicalNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [hydratedFromPlan, setHydratedFromPlan] = useState(false);

  const [step, setStep] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  function setExerciseStartingLevel(
    moduleId: string,
    exerciseId: string,
    level: PlanDifficulty,
  ) {
    updateExercise(moduleId, exerciseId, { levels: [level] });
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

  function autoArrangeSchedule() {
    setScheduleCustomized(true);
    setWeeklyAssignments(autoAssignExercises(exerciseIds, therapyDays));
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    setError('');
    setSuccess('');

    if (planModules.length === 0) {
      setError('Select at least one module and include at least one exercise.');
      return;
    }
    if (planModules.some((mod) => mod.exercises.some((exercise) => exercise.levels.length === 0))) {
      setError('Each included exercise needs a starting level.');
      return;
    }
    if (unassignedIds.length > 0) {
      setError('Assign every exercise to a day in the weekly plan.');
      return;
    }
    if (!startDate) {
      setError('Choose a start date.');
      return;
    }

    setSaving(true);
    try {
      let assignNote = '';
      if (!token) {
        throw new Error('You must be signed in to send a care plan.');
      }
      const res = await syncPatientPlan(
        token,
        patient.id,
        buildModuleAssignmentPlans(planModules, therapyDays, weeklyAssignments),
      );
      if (res.failed.length > 0) {
        setError(
          `Could not send ${res.failed.length} module(s): ${res.failed
            .map((f) => f.message)
            .join('; ')}`,
        );
        setSaving(false);
        return;
      }
      const notes = [
        res.assigned.length ? `${res.assigned.length} new` : '',
        res.updated.length ? `${res.updated.length} updated` : '',
        res.removed.length ? `${res.removed.length} removed` : '',
      ].filter(Boolean);
      assignNote = notes.length ? ` (${notes.join(', ')})` : '';

      const sentAt = new Date().toISOString();
      const next: PatientCarePlan = {
        patientId: patient.id,
        patientName: patient.name,
        modules: planModules,
        startDate,
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
      setSuccess(`Care plan sent to the patient app${assignNote}.`);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  function validateStep(target: number): string | null {
    if (target === 0) {
      return selectedModules.length === 0 ? 'Select at least one module to continue.' : null;
    }
    if (target === 1) {
      if (planModules.length === 0) return 'Include at least one exercise to continue.';
      if (planModules.some((mod) => mod.exercises.some((ex) => ex.levels.length === 0))) {
        return 'Each included exercise needs a starting level.';
      }
      return null;
    }
    if (target === 2) {
      if (!startDate) return 'Choose a start date.';
      if (therapyDays.length === 0) return 'Pick at least one exercise day.';
      if (!(dailyHours > 0)) return 'Set exercise time (hours per day).';
      return null;
    }
    if (target === 3) {
      return unassignedIds.length > 0 ? 'Give every exercise at least one day.' : null;
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((current) => Math.min(current + 1, WIZARD_STEPS.length - 1));
  }

  function goBack() {
    setError('');
    setStep((current) => Math.max(current - 1, 0));
  }

  function goToStep(target: number) {
    if (target === step) return;
    if (target < step) {
      setError('');
      setStep(target);
      return;
    }
    for (let s = step; s < target; s += 1) {
      const message = validateStep(s);
      if (message) {
        setError(message);
        setStep(s);
        return;
      }
    }
    setError('');
    setStep(target);
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

  const isLastStep = step === WIZARD_STEPS.length - 1;

  return (
    <section className="care-plan care-plan--wizard">
      <header className="care-plan__head">
        <div>
          <h2 className="care-plan__title">{patient.name}</h2>
          <p className="care-plan__subtitle">
            Step {step + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[step]}
          </p>
        </div>
        {onChangePatient && (
          <button type="button" className="care-plan__change-patient" onClick={onChangePatient}>
            Change
          </button>
        )}
      </header>

      <ol className="care-plan__stepper">
        {WIZARD_STEPS.map((label, index) => {
          const state =
            index === step ? 'active' : index < step ? 'done' : 'upcoming';
          return (
            <li
              key={label}
              className={`care-plan__step-item care-plan__step-item--${state}`}
            >
              <button
                type="button"
                className="care-plan__step-btn"
                onClick={() => goToStep(index)}
              >
                <span className="care-plan__step-dot">
                  {index < step ? '✓' : index + 1}
                </span>
                <span className="care-plan__step-label">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {error && (
        <p className="care-plan__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="care-plan__success">{success}</p>}

      <div className="care-plan__step">
        {step === 0 && (
          <section className="care-plan__section">
            <h3 className="care-plan__section-title">Pick modules</h3>
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
        )}

        {step === 1 && (
          <section className="care-plan__section">
            <div className="care-plan__section-head">
              <h3 className="care-plan__section-title">Choose exercises</h3>
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
            {selectedModules.length === 0 ? (
              <p className="care-plan__hint">Go back and pick a module first.</p>
            ) : (
              selectedModules.map((sm) => {
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
                          const available = ex.availableLevels ?? [];
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
                                    role="radiogroup"
                                    aria-label={`Starting level for ${ex.exerciseName}`}
                                  >
                                    <span className="care-plan__level-label">Starting level</span>
                                    {available.map((level) => {
                                      const active = ex.levels[0] === level;
                                      return (
                                        <button
                                          key={level}
                                          type="button"
                                          role="radio"
                                          className={
                                            active
                                              ? 'care-plan__level-btn care-plan__level-btn--active'
                                              : 'care-plan__level-btn'
                                          }
                                          aria-checked={active}
                                          onClick={() =>
                                            setExerciseStartingLevel(
                                              sm.moduleId,
                                              ex.exerciseId,
                                              level,
                                            )
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
              })
            )}
          </section>
        )}

        {step === 2 && (
          <section className="care-plan__section">
            <h3 className="care-plan__section-title">Set the schedule</h3>
            <div className="care-plan__grid care-plan__grid--schedule">
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
                <label className="care-plan__label" htmlFor="care-daily">
                  Exercise time (hrs/day)
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

            <div className="care-plan__field">
              <span className="care-plan__label">Exercise days</span>
              <div className="care-plan__therapy-days" role="group" aria-label="Exercise days">
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
                    onClick={() => toggleTherapyDay(day)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="care-plan__section">
            <div className="care-plan__section-head">
              <h3 className="care-plan__section-title">Assign to days</h3>
              <button
                type="button"
                className="care-plan__link-btn care-plan__link-btn--refresh"
                onClick={autoArrangeSchedule}
              >
                Auto arrange
              </button>
            </div>

            {includedExercises.length === 0 ? (
              <p className="care-plan__hint">No exercises yet — add some first.</p>
            ) : (
              <ul className="care-plan__assign-list">
                {includedExercises.map((ex) => {
                  const dayCount = sortTherapyDays(therapyDays).filter((day) =>
                    (weeklyAssignments[day] ?? []).includes(ex.exerciseId),
                  ).length;
                  return (
                    <li key={ex.exerciseId} className="care-plan__assign-row">
                      <div className="care-plan__assign-info">
                        <span className="care-plan__assign-name">{ex.exerciseName}</span>
                        <span className="care-plan__assign-meta">
                          {formatStartingLevel(ex.levels)} · {ex.durationMinutes} min ·{' '}
                          {dayCount === 0 ? 'no days' : `${dayCount} day${dayCount === 1 ? '' : 's'}`}
                        </span>
                      </div>
                      <div
                        className="care-plan__assign-days"
                        role="group"
                        aria-label={`Days for ${ex.exerciseName}`}
                      >
                        {sortTherapyDays(therapyDays).map((day) => {
                          const on = (weeklyAssignments[day] ?? []).includes(ex.exerciseId);
                          return (
                            <button
                              key={day}
                              type="button"
                              className={
                                on
                                  ? 'care-plan__day-chip care-plan__day-chip--active'
                                  : 'care-plan__day-chip'
                              }
                              aria-pressed={on}
                              onClick={() =>
                                on
                                  ? unassignExercise(day, ex.exerciseId)
                                  : assignExerciseToDay(ex.exerciseId, day)
                              }
                            >
                              {DAY_LABELS[day]}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="care-plan__day-totals">
              {weeklyPlan.map((day) => (
                <span key={day.dayOfWeek} className="care-plan__day-total-pill">
                  {DAY_LABELS[day.dayOfWeek]} · {formatMinutes(day.totalMinutes)}
                </span>
              ))}
            </div>

            {unassignedIds.length > 0 && (
              <p className="care-plan__hint care-plan__hint--warn">
                {unassignedIds.length} exercise{unassignedIds.length === 1 ? '' : 's'} still need a day.
              </p>
            )}
          </section>
        )}

        {step === 4 && (
          <section className="care-plan__section">
            <div className="care-plan__section-head">
              <h3 className="care-plan__section-title">Review &amp; send</h3>
              <button
                type="button"
                className="care-plan__link-btn care-plan__link-btn--refresh"
                onClick={() => setPreviewOpen(true)}
              >
                Preview
              </button>
            </div>

            <PlanSummary
              modules={planModules}
              startDate={startDate}
              daysPerWeek={therapyDays.length}
              dailyMinutes={dailyMinutes}
              weeklyPlan={weeklyPlan}
              totalExercises={totalExercises}
              clinicalNotes={clinicalNotes}
            />

            <div className="care-plan__section care-plan__section--notes">
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
            </div>
          </section>
        )}
      </div>

      <div className="care-plan__wizard-nav">
        <button
          type="button"
          className="care-plan__nav-btn care-plan__nav-btn--ghost"
          onClick={goBack}
          disabled={step === 0}
        >
          Back
        </button>
        {isLastStep ? (
          <button
            type="button"
            className="care-plan__nav-btn care-plan__nav-btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Sending…' : 'Send plan'}
          </button>
        ) : (
          <button
            type="button"
            className="care-plan__nav-btn care-plan__nav-btn--primary"
            onClick={goNext}
          >
            Continue
          </button>
        )}
      </div>

      {previewOpen && (
        <div
          className="care-plan__modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Plan preview"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="care-plan__modal" onClick={(e) => e.stopPropagation()}>
            <div className="care-plan__modal-head">
              <h3>Plan preview</h3>
              <button
                type="button"
                className="care-plan__modal-close"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="care-plan__modal-body">
              <PlanSummary
                modules={planModules}
                startDate={startDate}
                daysPerWeek={therapyDays.length}
                dailyMinutes={dailyMinutes}
                weeklyPlan={weeklyPlan}
                totalExercises={totalExercises}
                clinicalNotes={clinicalNotes}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ActivePlanView({ plan, onEdit }: { plan: PatientCarePlan; onEdit: () => void }) {
  const hasSchedule =
    (plan.therapyDays?.length ?? 0) > 0 ||
    (plan.weeklyAssignments?.length ?? 0) > 0 ||
    plan.daysPerWeek > 0;
  const therapyDays = hasSchedule
    ? plan.therapyDays ?? activeDays(plan.daysPerWeek)
    : [];
  const weeklyPlan = useMemo(
    () =>
      hasSchedule
        ? buildWeeklyPlan(plan.modules, therapyDays, plan.weeklyAssignments)
        : [],
    [hasSchedule, plan.modules, plan.weeklyAssignments, therapyDays],
  );

  return (
    <section className="care-plan">
      <header className="care-plan__head">
        <div>
          <h2 className="care-plan__title">{plan.patientName ?? 'Patient'}</h2>
          <p className="care-plan__subtitle">
            {plan.sentAt ? `Assigned ${formatDateLabel(plan.sentAt)}` : 'Assigned from API'}
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
  endDate?: string;
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
  const weeks = startDate && endDate ? planWeeks(startDate, endDate) : 0;
  const weeklyMin = dailyMinutes > 0 && daysPerWeek > 0 ? weeklyMinutes(dailyMinutes, daysPerWeek) : 0;
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
        <strong>{totalExercises}</strong> exercise{totalExercises === 1 ? '' : 's'}
        {dailyMinutes > 0 ? (
          <>
            {' '}
            · <strong>{formatMinutes(dailyMinutes)}</strong>/day
          </>
        ) : null}
        {daysPerWeek > 0 ? (
          <>
            {' '}
            · <strong>{daysPerWeek}</strong> day{daysPerWeek === 1 ? '' : 's'}
          </>
        ) : null}
      </p>

      {startDate || endDate ? (
        <p className="care-plan__preview-window">
          {startDate ? `Starts ${formatDateLabel(startDate)}` : '—'}
          {endDate ? ` → ${formatDateLabel(endDate)}` : ''}
          {weeks > 0 ? ` · ${weeks} wk${weeks === 1 ? '' : 's'}` : ''}
          {weeklyMin > 0 ? ` · ${formatMinutes(weeklyMin)}/wk` : ''}
        </p>
      ) : null}

      <div className="care-plan__preview-modules">
        {modules.map((m) => (
          <span key={m.moduleId} className="care-plan__preview-tag">
            {m.moduleName}
          </span>
        ))}
      </div>

      {weeklyPlan.length > 0 ? (
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
          <div className="care-plan__therapy-days" role="group" aria-label="Exercise days">
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
                            {formatStartingLevel(ex.levels)} · {ex.durationMinutes} min
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
      ) : null}

      {clinicalNotes.trim() && (
        <div className="care-plan__preview-notes">
          <span className="care-plan__preview-notes-label">Notes</span>
          <p>{clinicalNotes}</p>
        </div>
      )}
    </div>
  );
}
