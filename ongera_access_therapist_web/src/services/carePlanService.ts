import type {
  CarePlanExercisePick,
  PatientCarePlan,
  ScheduledExercise,
} from '../types/carePlan';

const STORAGE_KEY = 'ongera_patient_care_plans';

const WEEKDAYS = [1, 2, 3, 4, 5];

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
  return loadAll()[patientId] ?? null;
}

export function buildSchedule(
  exercises: CarePlanExercisePick[],
  sessionsPerWeek: number,
  startDate: string,
): ScheduledExercise[] {
  if (exercises.length === 0) return [];

  const days =
    sessionsPerWeek >= 7
      ? [1, 2, 3, 4, 5, 6, 0]
      : WEEKDAYS.slice(0, Math.max(1, Math.min(5, sessionsPerWeek)));

  const schedule: ScheduledExercise[] = [];
  let dayIndex = 0;

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const weekNumber = Math.floor(i / days.length) + 1;
    schedule.push({
      id: `${ex.exerciseId}-${i}`,
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      moduleId: ex.moduleId,
      moduleName: ex.moduleName,
      level: ex.level,
      dayOfWeek: days[dayIndex % days.length],
      weekNumber,
      durationMinutes: ex.durationMinutes,
    });
    dayIndex++;
  }

  void startDate;
  return schedule;
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

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
