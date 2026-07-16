export type PlanDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type CarePlanStatus = 'draft' | 'active';

export type CarePlanSourceType = 'request' | 'manual';

export interface CarePlanExercise {
  exerciseId: string;
  exerciseName: string;
  moduleId: string;
  moduleName: string;
  /** One or more difficulty levels assigned for this exercise. */
  levels: PlanDifficulty[];
  durationMinutes: number;
  /** Levels that have question content from the API (UI hint only). */
  availableLevels?: PlanDifficulty[];
}

/** @deprecated Stored on older saved plans — migrated to `levels`. */
export type LegacyCarePlanExercise = CarePlanExercise & { level?: PlanDifficulty };

export interface CarePlanModule {
  moduleId: string;
  moduleName: string;
  domainName?: string;
  exercises: CarePlanExercise[];
}

/** Custom exercise order for one weekday (0 = Sun … 6 = Sat). */
export interface PlanDayAssignment {
  dayOfWeek: number;
  exerciseIds: string[];
}

export interface PatientCarePlan {
  patientId: string;
  patientName?: string;
  modules: CarePlanModule[];
  startDate: string;
  endDate: string;
  /** Therapy days per week — derived from `therapyDays` when set. */
  daysPerWeek: number;
  /** Which weekdays the patient practises on (0 = Sun … 6 = Sat). */
  therapyDays?: number[];
  /** Therapist-defined exercise order per day. Falls back to auto-distribution when absent. */
  weeklyAssignments?: PlanDayAssignment[];
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
