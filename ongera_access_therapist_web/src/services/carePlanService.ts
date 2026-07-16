import { levelToDifficultyNumber } from '../lib/difficulty';
import type {
  CarePlanExercise,
  CarePlanModule,
  LegacyCarePlanExercise,
  PatientCarePlan,
  PlanDayAssignment,
  PlanDaySchedule,
  PlanDifficulty,
} from '../types/carePlan';

export function normalizeCarePlanExercise(
  raw: LegacyCarePlanExercise,
  fallbackAvailable: PlanDifficulty[] = [],
): CarePlanExercise {
  const available = raw.availableLevels?.length ? raw.availableLevels : fallbackAvailable;
  let levels = raw.levels?.length ? raw.levels : raw.level ? [raw.level] : [];
  levels = levels.filter((level) => available.includes(level));
  if (levels.length === 0 && available.length > 0) {
    levels = [available[0]];
  }
  const { level: _legacy, ...rest } = raw;
  return { ...rest, levels, availableLevels: available };
}

function normalizeCarePlanModule(mod: CarePlanModule): CarePlanModule {
  return {
    ...mod,
    exercises: mod.exercises.map((exercise) => normalizeCarePlanExercise(exercise)),
  };
}

function normalizeCarePlan(plan: PatientCarePlan): PatientCarePlan {
  const therapyDays =
    plan.therapyDays?.length ? sortTherapyDays(plan.therapyDays) : activeDays(plan.daysPerWeek);
  return {
    ...plan,
    modules: plan.modules.map(normalizeCarePlanModule),
    therapyDays,
    daysPerWeek: therapyDays.length,
  };
}

const STORAGE_KEY = 'ongera_patient_care_plans';

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const DAY_LABELS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

// Weekday-first ordering, weekends added last when >5 days/week.
const DAY_PRIORITY = [1, 2, 3, 4, 5, 6, 0];

export function sortTherapyDays(days: number[]): number[] {
  return [...days].sort((a, b) => {
    const na = a === 0 ? 7 : a;
    const nb = b === 0 ? 7 : b;
    return na - nb;
  });
}

export function assignmentsToRecord(
  assignments?: PlanDayAssignment[],
): Record<number, string[]> {
  const record: Record<number, string[]> = {};
  for (const entry of assignments ?? []) {
    record[entry.dayOfWeek] = [...entry.exerciseIds];
  }
  return record;
}

export function recordToAssignments(
  record: Record<number, string[]>,
): PlanDayAssignment[] {
  return sortTherapyDays(
    Object.keys(record)
      .map(Number)
      .filter((day) => (record[day]?.length ?? 0) > 0),
  ).map((dayOfWeek) => ({
    dayOfWeek,
    exerciseIds: record[dayOfWeek] ?? [],
  }));
}

export function autoAssignExercises(
  exerciseIds: string[],
  therapyDays: number[],
): Record<number, string[]> {
  const days = sortTherapyDays(therapyDays);
  const record: Record<number, string[]> = Object.fromEntries(days.map((day) => [day, []]));
  exerciseIds.forEach((id, index) => {
    const day = days[index % days.length];
    record[day].push(id);
  });
  return record;
}

export function pruneAssignments(
  assignments: Record<number, string[]>,
  validIds: Set<string>,
  therapyDays: number[],
): Record<number, string[]> {
  const next: Record<number, string[]> = {};
  for (const day of therapyDays) {
    next[day] = (assignments[day] ?? []).filter((id) => validIds.has(id));
  }
  return next;
}

export function unassignedExerciseIds(
  allIds: string[],
  assignments: Record<number, string[]>,
): string[] {
  const assigned = new Set(Object.values(assignments).flat());
  return allIds.filter((id) => !assigned.has(id));
}

export function resolveWeeklyPlan(
  modules: CarePlanModule[],
  therapyDays: number[],
  assignments: Record<number, string[]>,
): PlanDaySchedule[] {
  const byId = new Map(planExercises(modules).map((exercise) => [exercise.exerciseId, exercise]));
  return sortTherapyDays(therapyDays).map((dayOfWeek) => {
    const exercises = (assignments[dayOfWeek] ?? [])
      .map((id) => byId.get(id))
      .filter((exercise): exercise is CarePlanExercise => !!exercise);
    const totalMinutes = exercises.reduce((sum, exercise) => sum + exercise.durationMinutes, 0);
    return { dayOfWeek, exercises, totalMinutes };
  });
}

export interface ModuleAssignmentPlanItem {
  exerciseId: string;
  /** 1 = practised first. Derived from the weekly schedule order. */
  priority: number;
  /** Difficulty the patient starts at (1 = beginner … 3 = advanced). */
  startingLevel: number;
}

export interface ModuleAssignmentPlan {
  moduleId: string;
  exercisePlan: ModuleAssignmentPlanItem[];
  /** Minimum minutes/week for this module, from durations × scheduled days. */
  weeklyMinutesTarget: number;
}

/**
 * Translates the therapist's rich weekly plan into the per-module payload the
 * API understands (exercise priority + starting level + weekly minutes target).
 * Priority follows the order exercises appear across the therapy week; an
 * exercise scheduled on several days counts its minutes for each day.
 */
export function buildModuleAssignmentPlans(
  modules: CarePlanModule[],
  therapyDays: number[],
  weeklyAssignments: Record<number, string[]>,
): ModuleAssignmentPlan[] {
  const orderedDays = sortTherapyDays(therapyDays);

  const priorityById = new Map<string, number>();
  for (const day of orderedDays) {
    for (const exerciseId of weeklyAssignments[day] ?? []) {
      if (!priorityById.has(exerciseId)) {
        priorityById.set(exerciseId, priorityById.size + 1);
      }
    }
  }
  const fallbackPriority = priorityById.size + 1;

  const daysScheduled = (exerciseId: string) =>
    orderedDays.filter((day) => (weeklyAssignments[day] ?? []).includes(exerciseId)).length;

  return modules.map((mod) => {
    const exercisePlan = mod.exercises.map((exercise) => {
      const levelNumbers = (exercise.levels.length ? exercise.levels : ['BEGINNER']).map((level) =>
        levelToDifficultyNumber(level),
      );
      return {
        exerciseId: exercise.exerciseId,
        priority: priorityById.get(exercise.exerciseId) ?? fallbackPriority,
        startingLevel: Math.min(...levelNumbers),
      };
    });

    const weeklyMinutesTarget = mod.exercises.reduce(
      (sum, exercise) =>
        sum + exercise.durationMinutes * Math.max(1, daysScheduled(exercise.exerciseId)),
      0,
    );

    return { moduleId: mod.moduleId, exercisePlan, weeklyMinutesTarget };
  });
}

function loadAll(): Record<string, PatientCarePlan> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PatientCarePlan>;
  } catch {
    return {};
  }
}

function saveAll(plans: Record<string, PatientCarePlan>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function getCarePlan(patientId: string): PatientCarePlan | null {
  const plan = loadAll()[patientId] ?? null;
  // Ignore plans stored in the pre-multi-module shape (no `modules` array).
  if (plan && !Array.isArray(plan.modules)) return null;
  return plan ? normalizeCarePlan(plan) : null;
}

export function saveCarePlan(plan: PatientCarePlan): PatientCarePlan {
  const all = loadAll();
  const next: PatientCarePlan = { ...plan, updatedAt: new Date().toISOString() };
  all[plan.patientId] = next;
  saveAll(all);
  return next;
}

export function deleteCarePlan(patientId: string) {
  const all = loadAll();
  delete all[patientId];
  saveAll(all);
}

/** All included exercises across every module in the plan. */
export function planExercises(modules: CarePlanModule[]): CarePlanExercise[] {
  return modules.flatMap((m) => m.exercises);
}

/** The weekday indices the patient practises on, given days-per-week. */
export function activeDays(daysPerWeek: number): number[] {
  const count = Math.max(1, Math.min(7, daysPerWeek));
  return DAY_PRIORITY.slice(0, count).sort((a, b) => {
    // Present Mon..Sun in natural weekday order.
    const na = a === 0 ? 7 : a;
    const nb = b === 0 ? 7 : b;
    return na - nb;
  });
}

/** Builds the weekly routine from saved or auto-generated assignments. */
export function buildWeeklyPlan(
  modules: CarePlanModule[],
  therapyDays: number[],
  weeklyAssignments?: PlanDayAssignment[],
): PlanDaySchedule[] {
  if (weeklyAssignments?.length) {
    return resolveWeeklyPlan(modules, therapyDays, assignmentsToRecord(weeklyAssignments));
  }
  const exerciseIds = planExercises(modules).map((exercise) => exercise.exerciseId);
  return resolveWeeklyPlan(
    modules,
    therapyDays,
    autoAssignExercises(exerciseIds, therapyDays),
  );
}

export function weeklyMinutes(dailyMinutes: number, daysPerWeek: number): number {
  return Math.max(0, dailyMinutes) * Math.max(0, daysPerWeek);
}

export function planWeeks(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(days / 7));
}

/** Suggests an end date `weeks` after the start date (default 4 weeks). */
export function suggestEndDate(startDate: string, weeks = 4): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return startDate;
  start.setDate(start.getDate() + weeks * 7);
  return start.toISOString().slice(0, 10);
}

/** "3h", "1h 30m", "45m" */
export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** Comma-joined module names for a plan, or null when empty. */
export function planModuleLabel(plan: PatientCarePlan | null): string | null {
  if (!plan || plan.modules.length === 0) return null;
  return plan.modules.map((m) => m.moduleName).join(', ');
}

export function formatDateLabel(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
