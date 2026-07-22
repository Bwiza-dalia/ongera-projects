import { getCarePlan } from '../services/carePlanService';
import { detectDecliningProgress } from './patientAttention';
import type { Patient, PatientProgressEntry, PatientSession } from '../types/patients';
import type {
  TherapyWeekCompletion,
  WeekRange,
  WeeklyReport,
} from '../types/reports';

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday-start local week containing `anchor`. */
export function weekRangeContaining(anchor = new Date(), weekOffset = 0): WeekRange {
  const day = startOfLocalDay(anchor);
  const weekday = day.getDay(); // 0 Sun … 6 Sat
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = addDays(day, -daysFromMonday + weekOffset * 7);
  const nextMonday = addDays(monday, 7);
  const sunday = addDays(monday, 6);

  const sameMonth = monday.getMonth() === sunday.getMonth();
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  const startFmt = monday.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const endFmt = sunday.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    year: 'numeric',
  });
  // When month is omitted, some locales render oddly — always include month on end if needed.
  const endLabel = sameMonth
    ? `${sunday.getDate()}, ${sunday.getFullYear()}`
    : endFmt;

  return {
    start: monday,
    end: nextMonday,
    label: sameYear && sameMonth
      ? `${monday.toLocaleDateString(undefined, { month: 'short' })} ${monday.getDate()} – ${sunday.getDate()}, ${sunday.getFullYear()}`
      : `${startFmt} – ${endLabel}`,
    startKey: localDateKey(monday),
  };
}

export function listRecentWeekRanges(count = 4): WeekRange[] {
  return Array.from({ length: count }, (_, index) => weekRangeContaining(new Date(), -index));
}

export function isSessionInWeek(session: PatientSession, week: WeekRange): boolean {
  if (!session.completedAt) return false;
  const at = new Date(session.completedAt);
  if (Number.isNaN(at.getTime())) return false;
  const t = at.getTime();
  return t >= week.start.getTime() && t < week.end.getTime();
}

export function completedSessionsInWeek(
  sessions: PatientSession[] | undefined,
  week: WeekRange,
): PatientSession[] {
  return (sessions ?? []).filter(
    (session) =>
      session.status.toUpperCase() === 'COMPLETED' && isSessionInWeek(session, week),
  );
}

function averageSessionScore(sessions: PatientSession[]): number | null {
  const scores = sessions
    .map((s) => s.score)
    .filter((score): score is number => score != null && Number.isFinite(score));
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function accuracyFromSessions(sessions: PatientSession[]): number | null {
  const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + s.questionsCorrect, 0);
  if (totalQuestions > 0) return Math.round((totalCorrect / totalQuestions) * 100);
  return averageSessionScore(sessions);
}

function weekStreakDays(sessions: PatientSession[], week: WeekRange): number {
  const dates = new Set(
    sessions
      .filter((s) => s.completedAt)
      .map((s) => localDateKey(new Date(s.completedAt!))),
  );
  let streak = 0;
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(week.start, 6 - i);
    if (day.getTime() >= week.end.getTime()) continue;
    if (day.getTime() > Date.now()) continue;
    if (dates.has(localDateKey(day))) streak += 1;
    else if (streak > 0) break;
  }
  return streak;
}

export function therapyCompletionForWeek(
  therapyDays: number[],
  sessions: PatientSession[],
  week: WeekRange,
): TherapyWeekCompletion {
  const completed = new Set(
    sessions
      .filter((s) => s.status.toUpperCase() === 'COMPLETED' && s.completedAt)
      .map((s) => localDateKey(new Date(s.completedAt!))),
  );

  const scheduledDateKeys: string[] = [];
  const completedDateKeys: string[] = [];
  const today = startOfLocalDay(new Date());

  for (let i = 0; i < 7; i += 1) {
    const day = addDays(week.start, i);
    if (day.getTime() >= week.end.getTime()) break;
    if (!therapyDays.includes(day.getDay())) continue;
    // Only count days that have already ended (or today).
    if (day.getTime() > today.getTime()) continue;
    const key = localDateKey(day);
    scheduledDateKeys.push(key);
    if (completed.has(key)) completedDateKeys.push(key);
  }

  const scheduledDays = scheduledDateKeys.length;
  const completedDays = completedDateKeys.length;
  const missedDays = Math.max(0, scheduledDays - completedDays);
  const percent =
    scheduledDays > 0 ? Math.round((completedDays / scheduledDays) * 100) : null;

  return {
    scheduledDays,
    completedDays,
    missedDays,
    percent,
    scheduledDateKeys,
    completedDateKeys,
  };
}

function buildProgressEntriesFromSessions(
  sessions: PatientSession[],
): PatientProgressEntry[] {
  const byExercise = new Map<string, PatientSession[]>();
  for (const session of sessions) {
    const list = byExercise.get(session.exerciseId) ?? [];
    list.push(session);
    byExercise.set(session.exerciseId, list);
  }

  return Array.from(byExercise.entries()).map(([exerciseId, rows]) => {
    const totalQuestions = rows.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalCorrect = rows.reduce((sum, s) => sum + s.questionsCorrect, 0);
    const scored = rows.filter((s) => s.score != null);
    const averageScore =
      scored.length > 0
        ? scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length
        : totalQuestions > 0
          ? (totalCorrect / totalQuestions) * 100
          : null;
    const latest = [...rows].sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    })[0];

    return {
      exerciseId,
      currentLevel: latest?.difficultyLevel != null ? String(latest.difficultyLevel) : null,
      averageScore: averageScore != null ? Math.round(averageScore) : null,
      lastSessionAt: latest?.completedAt ?? null,
      lastSessionLabel: latest?.completedLabel ?? null,
      totalSessions: rows.length,
      streakDays: 0,
      totalQuestions,
      totalCorrect,
      hintsUsed: rows.reduce((sum, s) => sum + s.hintsUsed, 0),
    };
  });
}

/** Clone a patient scoped to one week's completed sessions for report panels. */
export function scopePatientToWeek(patient: Patient, week: WeekRange): Patient {
  const sessions = completedSessionsInWeek(patient.sessions, week).sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });
  const totalHintsUsed = sessions.reduce((sum, s) => sum + s.hintsUsed, 0);
  const accuracy = accuracyFromSessions(sessions);

  return {
    ...patient,
    sessions,
    progressEntries: buildProgressEntriesFromSessions(sessions),
    totalSessions: sessions.length,
    accuracy,
    streakDays: weekStreakDays(sessions, week),
    totalHintsUsed,
    avgHintsPerSession:
      sessions.length > 0
        ? Math.round((totalHintsUsed / sessions.length) * 10) / 10
        : null,
    lastSession: sessions[0]?.completedLabel ?? null,
    lastSessionAt: sessions[0]?.completedAt ?? null,
  };
}

function buildHighlights(
  patient: Patient,
  weekSessions: PatientSession[],
  completion: TherapyWeekCompletion | null,
  avgAccuracy: number | null,
): string[] {
  const highlights: string[] = [];

  if (weekSessions.length === 0) {
    highlights.push('No completed sessions this week.');
    return highlights;
  }

  if (avgAccuracy != null) {
    if (avgAccuracy >= 75) highlights.push(`Strong accuracy this week (${avgAccuracy}%).`);
    else if (avgAccuracy >= 50) highlights.push(`On-track accuracy this week (${avgAccuracy}%).`);
    else highlights.push(`Accuracy needs attention this week (${avgAccuracy}%).`);
  }

  if (completion && completion.scheduledDays > 0) {
    highlights.push(
      `Therapy completion ${completion.completedDays}/${completion.scheduledDays} scheduled days` +
        (completion.percent != null ? ` (${completion.percent}%).` : '.'),
    );
    if (completion.missedDays > 0) {
      highlights.push(`Missed ${completion.missedDays} scheduled exercise day${completion.missedDays === 1 ? '' : 's'}.`);
    }
  }

  const decline = detectDecliningProgress(patient.sessions ?? []);
  if (decline.declining && decline.dropPoints != null) {
    highlights.push(`Scores declining (~${Math.round(decline.dropPoints)} pts vs earlier sessions).`);
  }

  const hints = weekSessions.reduce((sum, s) => sum + s.hintsUsed, 0);
  if (hints > 0) {
    highlights.push(`Used ${hints} hint${hints === 1 ? '' : 's'} across weekly sessions.`);
  }

  return highlights.slice(0, 5);
}

function buildSummary(
  sessionsCompleted: number,
  avgAccuracy: number | null,
  completion: TherapyWeekCompletion | null,
): string {
  if (sessionsCompleted === 0) {
    return 'No therapy activity was recorded for this patient during the selected week.';
  }
  const parts = [
    `Completed ${sessionsCompleted} session${sessionsCompleted === 1 ? '' : 's'}`,
  ];
  if (avgAccuracy != null) parts.push(`averaging ${avgAccuracy}% accuracy`);
  if (completion?.percent != null) {
    parts.push(`with ${completion.percent}% therapy-day completion`);
  }
  return `${parts.join(', ')}.`;
}

export function buildWeeklyReport(
  patient: Patient,
  week: WeekRange,
): WeeklyReport {
  const weekSessions = completedSessionsInWeek(patient.sessions, week);
  const avgAccuracy = accuracyFromSessions(weekSessions);
  const plan = getCarePlan(patient.id);
  const therapyDays = plan?.therapyDays ?? [];
  const completion =
    therapyDays.length > 0
      ? therapyCompletionForWeek(therapyDays, weekSessions, week)
      : null;

  const totalMinutes = Math.round(
    weekSessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / 60,
  );
  const totalHints = weekSessions.reduce((sum, s) => sum + s.hintsUsed, 0);
  const totalQuestions = weekSessions.reduce((sum, s) => sum + s.totalQuestions, 0);
  const questionsCorrect = weekSessions.reduce((sum, s) => sum + s.questionsCorrect, 0);
  const streakDays = weekStreakDays(weekSessions, week);

  const status: WeeklyReport['status'] =
    weekSessions.length === 0 ? 'no_activity' : 'ready';

  return {
    id: `${patient.id}:${week.startKey}`,
    patientId: patient.id,
    patientName: patient.name,
    module: patient.module,
    weekLabel: week.label,
    weekStartKey: week.startKey,
    status,
    sessionsCompleted: weekSessions.length,
    avgAccuracy,
    streakDays,
    summary: buildSummary(weekSessions.length, avgAccuracy, completion),
    highlights: buildHighlights(patient, weekSessions, completion, avgAccuracy),
    clinicianNotes: plan?.clinicalNotes?.trim() || undefined,
    generatedAt: new Date().toISOString(),
    therapyScheduledDays: completion?.scheduledDays,
    therapyCompletedDays: completion?.completedDays,
    therapyCompletionPercent: completion?.percent ?? null,
    totalMinutes,
    totalHints,
    totalQuestions,
    questionsCorrect,
  };
}

export function buildWeeklyReports(
  patients: Patient[],
  week: WeekRange,
): WeeklyReport[] {
  return patients
    .map((patient) => buildWeeklyReport(patient, week))
    .sort((a, b) => {
      if (b.sessionsCompleted !== a.sessionsCompleted) {
        return b.sessionsCompleted - a.sessionsCompleted;
      }
      return a.patientName.localeCompare(b.patientName);
    });
}

export interface CaseloadWeekStats {
  assignedPatients: number;
  activePatients: number;
  inactivePatients: number;
  totalSessions: number;
  avgAccuracy: number | null;
  avgCompletion: number | null;
  totalMinutes: number;
  totalHints: number;
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
  const withCompletion = reports.filter((r) => r.therapyCompletionPercent != null);
  const avgCompletion =
    withCompletion.length > 0
      ? Math.round(
          withCompletion.reduce((sum, r) => sum + (r.therapyCompletionPercent ?? 0), 0) /
            withCompletion.length,
        )
      : null;
  const totalMinutes = reports.reduce((sum, r) => sum + (r.totalMinutes ?? 0), 0);
  const totalHints = reports.reduce((sum, r) => sum + (r.totalHints ?? 0), 0);

  return {
    assignedPatients,
    activePatients,
    inactivePatients,
    totalSessions,
    avgAccuracy,
    avgCompletion,
    totalMinutes,
    totalHints,
  };
}
