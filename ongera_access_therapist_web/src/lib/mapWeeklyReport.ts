import type { ApiWeeklyReport } from '../types/api';
import type { Patient } from '../types/patients';
import type { WeekRange, WeeklyReport } from '../types/reports';

function roundScore(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function buildSummary(report: WeeklyReport): string {
  if (report.sessionsCompleted === 0) {
    return 'No therapy activity was recorded for this patient during the selected week.';
  }
  const parts = [
    `Completed ${report.sessionsCompleted} session${report.sessionsCompleted === 1 ? '' : 's'}`,
  ];
  if (report.avgAccuracy != null) parts.push(`averaging ${report.avgAccuracy}% accuracy`);
  if (report.sessionsAbandoned && report.sessionsAbandoned > 0) {
    parts.push(`${report.sessionsAbandoned} abandoned`);
  }
  return `${parts.join(', ')}.`;
}

function buildHighlights(report: WeeklyReport, api: ApiWeeklyReport): string[] {
  const highlights: string[] = [];
  if (report.sessionsCompleted === 0) {
    highlights.push('No completed sessions this week.');
    return highlights;
  }
  if (report.avgAccuracy != null) {
    if (report.avgAccuracy >= 75) highlights.push(`Strong accuracy this week (${report.avgAccuracy}%).`);
    else if (report.avgAccuracy >= 50) highlights.push(`On-track accuracy this week (${report.avgAccuracy}%).`);
    else highlights.push(`Accuracy needs attention this week (${report.avgAccuracy}%).`);
  }
  if (report.sessionsAbandoned && report.sessionsAbandoned > 0) {
    highlights.push(
      `${report.sessionsAbandoned} session${report.sessionsAbandoned === 1 ? '' : 's'} abandoned.`,
    );
  }
  if ((report.totalHints ?? 0) > 0) {
    highlights.push(`Used ${report.totalHints} hint${report.totalHints === 1 ? '' : 's'} this week.`);
  }
  const levels = api.level_changes ?? [];
  if (levels.length > 0) {
    highlights.push(
      `${levels.length} level change${levels.length === 1 ? '' : 's'} recorded this week.`,
    );
  }
  return highlights.slice(0, 5);
}

/** Map API weekly report + patient profile into the therapist UI model. */
export function mapApiWeeklyReport(
  patient: Patient,
  week: WeekRange,
  api: ApiWeeklyReport | null,
): WeeklyReport {
  const sessionsCompleted = api?.sessions_completed ?? 0;
  const totalQuestions = api?.total_questions_attempted ?? 0;
  const questionsCorrect = api?.total_correct ?? 0;
  const avgAccuracy =
    totalQuestions > 0
      ? Math.round((questionsCorrect / totalQuestions) * 100)
      : roundScore(api?.average_score);

  const report: WeeklyReport = {
    id: `${patient.id}:${week.startKey}`,
    patientId: patient.id,
    patientName: patient.name,
    module: patient.module,
    weekLabel: week.label,
    weekStartKey: week.startKey,
    status: sessionsCompleted === 0 ? 'no_activity' : 'ready',
    sessionsCompleted,
    sessionsAbandoned: api?.sessions_abandoned ?? 0,
    avgAccuracy,
    streakDays: 0,
    summary: '',
    highlights: [],
    generatedAt: new Date().toISOString(),
    totalHints: api?.total_cues_used ?? 0,
    totalQuestions,
    questionsCorrect,
    graduationStatus: api?.graduation_status ?? patient.graduationStatus,
  };

  report.summary = buildSummary(report);
  report.highlights = buildHighlights(report, api ?? { patient_id: patient.id });
  return report;
}

export interface CaseloadWeekStats {
  assignedPatients: number;
  activePatients: number;
  inactivePatients: number;
  totalSessions: number;
  avgAccuracy: number | null;
  totalHints: number;
  totalAbandoned: number;
}

export function buildCaseloadWeekStats(reports: WeeklyReport[]): CaseloadWeekStats {
  const assignedPatients = reports.length;
  const activePatients = reports.filter((r) => r.sessionsCompleted > 0).length;
  const inactivePatients = assignedPatients - activePatients;
  const totalSessions = reports.reduce((sum, r) => sum + r.sessionsCompleted, 0);
  const withAccuracy = reports.filter((r) => r.avgAccuracy != null);
  const avgAccuracy =
    withAccuracy.length > 0
      ? Math.round(
          withAccuracy.reduce((sum, r) => sum + (r.avgAccuracy ?? 0), 0) / withAccuracy.length,
        )
      : null;
  const totalHints = reports.reduce((sum, r) => sum + (r.totalHints ?? 0), 0);
  const totalAbandoned = reports.reduce((sum, r) => sum + (r.sessionsAbandoned ?? 0), 0);

  return {
    assignedPatients,
    activePatients,
    inactivePatients,
    totalSessions,
    avgAccuracy,
    totalHints,
    totalAbandoned,
  };
}
