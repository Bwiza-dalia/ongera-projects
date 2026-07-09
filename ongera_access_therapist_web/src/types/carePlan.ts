export type PlanDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type CarePlanStatus = 'draft' | 'active';

export type CarePlanSourceType = 'request' | 'prescription' | 'manual';

export interface CarePlanExercise {
  exerciseId: string;
  exerciseName: string;
  moduleId: string;
  moduleName: string;
  level: PlanDifficulty;
  durationMinutes: number;
}

export interface CarePlanModule {
  moduleId: string;
  moduleName: string;
  domainName?: string;
  exercises: CarePlanExercise[];
}

export interface PatientCarePlan {
  patientId: string;
  patientName?: string;
  modules: CarePlanModule[];
  startDate: string;
  endDate: string;
  /** Therapy days per week (e.g. 5). */
  daysPerWeek: number;
  /** Recommended minutes of practice per active day (e.g. 180 = 3 hours). */
  dailyMinutes: number;
  clinicalNotes: string;
  status: CarePlanStatus;
  updatedAt: string;
  sentAt?: string;
  sourceType?: CarePlanSourceType;
  sourceId?: string;
}

/** One day of the weekly routine the patient will follow. */
export interface PlanDaySchedule {
  dayOfWeek: number;
  exercises: CarePlanExercise[];
  totalMinutes: number;
}
