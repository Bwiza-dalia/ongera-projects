export type PlanDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type CarePlanStatus = 'draft' | 'active';

export interface ScheduledExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  moduleId: string;
  moduleName: string;
  level: PlanDifficulty;
  dayOfWeek: number;
  weekNumber: number;
  durationMinutes: number;
}

export interface PatientCarePlan {
  patientId: string;
  moduleId: string;
  moduleName: string;
  startDate: string;
  sessionsPerWeek: number;
  clinicalNotes: string;
  status: CarePlanStatus;
  schedule: ScheduledExercise[];
  updatedAt: string;
}

export interface CarePlanExercisePick {
  exerciseId: string;
  exerciseName: string;
  moduleId: string;
  moduleName: string;
  level: PlanDifficulty;
  durationMinutes: number;
}
