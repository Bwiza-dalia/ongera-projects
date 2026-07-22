export type ReportStatus = 'ready' | 'reviewed' | 'no_activity';

export interface WeeklyReport {
  id: string;
  patientId: string;
  patientName: string;
  module: string | null;
  weekLabel: string;
  weekStartKey: string;
  status: ReportStatus;
  sessionsCompleted: number;
  avgAccuracy: number | null;
  streakDays: number;
  summary: string;
  highlights: string[];
  clinicianNotes?: string;
  generatedAt: string;
  /** Therapy completion for the week when a care plan schedule exists. */
  therapyScheduledDays?: number;
  therapyCompletedDays?: number;
  therapyCompletionPercent?: number | null;
  totalMinutes?: number;
  totalHints?: number;
  totalQuestions?: number;
  questionsCorrect?: number;
}

export interface WeekRange {
  /** Inclusive local start of week (Monday 00:00). */
  start: Date;
  /** Exclusive local end of week (next Monday 00:00). */
  end: Date;
  label: string;
  /** YYYY-MM-DD of week start. */
  startKey: string;
}

export interface TherapyWeekCompletion {
  scheduledDays: number;
  completedDays: number;
  missedDays: number;
  percent: number | null;
  scheduledDateKeys: string[];
  completedDateKeys: string[];
}
