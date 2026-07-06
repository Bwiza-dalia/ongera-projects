export type ReportStatus = 'ready' | 'reviewed';

export interface WeeklyReport {
  id: string;
  patientId: string;
  patientName: string;
  module: string | null;
  weekLabel: string;
  status: ReportStatus;
  sessionsCompleted: number;
  avgAccuracy: number | null;
  streakDays: number;
  summary: string;
  highlights: string[];
  clinicianNotes?: string;
  generatedAt: string;
}
