import { getCarePlan } from '../services/carePlanService';
import type { Patient, PatientSession } from '../types/patients';

export type AttentionReasonType =
  | 'low_accuracy'
  | 'missed_exercises'
  | 'declining_progress'
  | 'needs_care_plan'
  | 'new_patient';

export interface AttentionReason {
  type: AttentionReasonType;
  label: string;
  detail?: string;
  priority: 'high' | 'medium';
}

export interface PatientAttentionItem {
  patientId: string;
  patientName: string;
  /** Primary reason shown in the list title. */
  reason: string;
  detail?: string;
  priority: 'high' | 'medium';
  lastSession: string | null;
  reasons: AttentionReason[];
}

const LOW_ACCURACY_THRESHOLD = 50;
const MISSED_LOOKBACK_DAYS = 7;
const MISSED_EXERCISE_THRESHOLD = 2;
const INACTIVE_DAYS_THRESHOLD = 4;
const DECLINE_MIN_SESSIONS = 4;
const DECLINE_DROP_POINTS = 15;

const PRIORITY_ORDER = { high: 0, medium: 1 } as const;

const REASON_PRIORITY: Record<AttentionReasonType, number> = {
  low_accuracy: 0,
  missed_exercises: 1,
  declining_progress: 2,
  needs_care_plan: 3,
  new_patient: 4,
};

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const ms = startOfLocalDay(new Date()).getTime() - startOfLocalDay(then).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function completedSessionDates(sessions: PatientSession[]): Set<string> {
  const dates = new Set<string>();
  for (const session of sessions) {
    if (session.status.toUpperCase() !== 'COMPLETED' || !session.completedAt) continue;
    const at = new Date(session.completedAt);
    if (Number.isNaN(at.getTime())) continue;
    dates.add(localDateKey(at));
  }
  return dates;
}

/** Count scheduled therapy days in the lookback window with no completed session. */
export function countMissedTherapyDays(
  therapyDays: number[],
  sessions: PatientSession[],
  lookbackDays = MISSED_LOOKBACK_DAYS,
): number {
  if (therapyDays.length === 0) return 0;
  const completed = completedSessionDates(sessions);
  const today = startOfLocalDay(new Date());
  let missed = 0;

  for (let i = 1; i <= lookbackDays; i += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    if (!therapyDays.includes(day.getDay())) continue;
    if (!completed.has(localDateKey(day))) missed += 1;
  }

  return missed;
}

function averageScore(sessions: PatientSession[]): number | null {
  const scores = sessions
    .map((s) => s.score)
    .filter((score): score is number => score != null && Number.isFinite(score));
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/** Recent average dropped meaningfully vs the prior window. */
export function detectDecliningProgress(sessions: PatientSession[]): {
  declining: boolean;
  dropPoints: number | null;
  recentAvg: number | null;
  earlierAvg: number | null;
} {
  const scored = sessions
    .filter(
      (s) =>
        s.status.toUpperCase() === 'COMPLETED' &&
        s.score != null &&
        Number.isFinite(s.score) &&
        s.completedAt,
    )
    .sort(
      (a, b) =>
        new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime(),
    );

  if (scored.length < DECLINE_MIN_SESSIONS) {
    return { declining: false, dropPoints: null, recentAvg: null, earlierAvg: null };
  }

  const recent = scored.slice(-3);
  const earlier = scored.slice(-6, -3);
  if (earlier.length < 2) {
    return { declining: false, dropPoints: null, recentAvg: null, earlierAvg: null };
  }

  const recentAvg = averageScore(recent);
  const earlierAvg = averageScore(earlier);
  if (recentAvg == null || earlierAvg == null) {
    return { declining: false, dropPoints: null, recentAvg, earlierAvg };
  }

  const dropPoints = earlierAvg - recentAvg;
  return {
    declining: dropPoints >= DECLINE_DROP_POINTS,
    dropPoints,
    recentAvg,
    earlierAvg,
  };
}

function collectReasons(patient: Patient): AttentionReason[] {
  const graduation = patient.graduationStatus.toUpperCase();
  if (graduation === 'GRADUATED') return [];

  const reasons: AttentionReason[] = [];
  const sessions = patient.sessions ?? [];
  const since = daysSince(patient.lastSessionAt);
  const isPaused = graduation === 'PAUSED';

  if (
    patient.accuracy != null &&
    patient.accuracy < LOW_ACCURACY_THRESHOLD &&
    patient.totalSessions > 0
  ) {
    reasons.push({
      type: 'low_accuracy',
      label: 'Low accuracy',
      detail: `${patient.accuracy}% average${patient.module ? ` · ${patient.module}` : ''}`,
      priority: 'high',
    });
  }

  if (!isPaused) {
    const plan = getCarePlan(patient.id);
    const therapyDays = plan?.therapyDays ?? [];
    if (therapyDays.length > 0) {
      const missed = countMissedTherapyDays(therapyDays, sessions);
      if (missed >= MISSED_EXERCISE_THRESHOLD) {
        reasons.push({
          type: 'missed_exercises',
          label: 'Missed exercises',
          detail: `${missed} scheduled day${missed === 1 ? '' : 's'} missed in the last week`,
          priority: 'high',
        });
      }
    } else if (since != null && since >= INACTIVE_DAYS_THRESHOLD) {
      reasons.push({
        type: 'missed_exercises',
        label: 'Missed exercises',
        detail: `No session in ${since} day${since === 1 ? '' : 's'}`,
        priority: 'high',
      });
    } else if (!patient.lastSessionAt && patient.status !== 'new') {
      reasons.push({
        type: 'missed_exercises',
        label: 'Missed exercises',
        detail: 'No sessions logged yet',
        priority: 'high',
      });
    }
  }

  const decline = detectDecliningProgress(sessions);
  if (decline.declining && decline.dropPoints != null) {
    reasons.push({
      type: 'declining_progress',
      label: 'Declining progress',
      detail: `Recent scores down ~${Math.round(decline.dropPoints)} pts`,
      priority: 'high',
    });
  }

  if (patient.status === 'new' && !patient.module) {
    reasons.push({
      type: 'needs_care_plan',
      label: 'Needs care plan',
      detail: 'No module assigned yet',
      priority: 'high',
    });
  } else if (patient.status === 'new' && patient.module) {
    reasons.push({
      type: 'new_patient',
      label: 'New patient',
      detail: `Assigned to ${patient.module}`,
      priority: 'medium',
    });
  }

  return reasons.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      REASON_PRIORITY[a.type] - REASON_PRIORITY[b.type],
  );
}

function attentionForPatient(patient: Patient): PatientAttentionItem | null {
  const reasons = collectReasons(patient);
  if (reasons.length === 0) return null;

  const primary = reasons[0];
  const extra = reasons
    .slice(1)
    .map((r) => r.label)
    .join(' · ');

  return {
    patientId: patient.id,
    patientName: patient.name,
    reason: primary.label,
    detail: [primary.detail, extra || undefined].filter(Boolean).join(' · ') || undefined,
    priority: reasons.some((r) => r.priority === 'high') ? 'high' : 'medium',
    lastSession: patient.lastSession,
    reasons,
  };
}

export function buildPatientsNeedingAttention(
  patients: Patient[],
  limit = 6,
): PatientAttentionItem[] {
  return patients
    .map(attentionForPatient)
    .filter((item): item is PatientAttentionItem => item !== null)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, limit);
}

export function countPatientsNeedingAttention(patients: Patient[]): number {
  return patients.filter((patient) => attentionForPatient(patient) !== null).length;
}

export function patientNeedsAttention(patient: Patient): boolean {
  return attentionForPatient(patient) !== null;
}
