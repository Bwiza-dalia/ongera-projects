import type {
  CarePlanExercise,
  CarePlanModule,
  PatientCarePlan,
  PlanDaySchedule,
} from '../types/carePlan';

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
  return plan;
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

/** Distributes all exercises round-robin across the active days into a weekly routine. */
export function buildWeeklyPlan(
  modules: CarePlanModule[],
  daysPerWeek: number,
): PlanDaySchedule[] {
  const days = activeDays(daysPerWeek);
  const buckets: PlanDaySchedule[] = days.map((dayOfWeek) => ({
    dayOfWeek,
    exercises: [],
    totalMinutes: 0,
  }));

  const exercises = planExercises(modules);
  exercises.forEach((exercise, index) => {
    const bucket = buckets[index % buckets.length];
    bucket.exercises.push(exercise);
    bucket.totalMinutes += exercise.durationMinutes;
  });

  return buckets;
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
