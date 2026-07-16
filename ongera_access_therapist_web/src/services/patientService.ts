import { formatRelativeDate, formatShortDate } from '../lib/formatDate';
import { caregiverDisplayName, readCaregiver } from '../lib/caregiverUtils';
import { apiFetch } from '../lib/apiClient';
import type { ApiPatientProfile, ApiPatientProgress, ApiSession } from '../types/api';
import type { Patient, PatientProgressEntry, PatientSession } from '../types/patients';
import type { PatientRow, PatientStatus } from '../types/dashboard';

import { asArray } from '../lib/asArray';
import {
  assignedModulesLabel,
  listPatientModules,
} from './moduleAssignmentService';

function mapGraduationStatus(status: string | undefined): PatientStatus {
  const value = (status ?? '').toUpperCase();
  if (value === 'ACTIVE') return 'active';
  if (value === 'GRADUATED') return 'inactive';
  if (value === 'PAUSED' || value === 'INACTIVE') return 'inactive';
  if (value === 'NEW' || value === 'PENDING') return 'new';
  return 'new';
}

function deriveStatus(
  graduationStatus: PatientStatus,
  progress: ApiPatientProgress[] | null | undefined,
): PatientStatus {
  const items = asArray(progress);
  if (graduationStatus !== 'active') return graduationStatus;

  const latest = pickPrimaryProgress(items);
  if (!latest?.last_session_at) return graduationStatus;

  const lastSession = new Date(latest.last_session_at);
  const daysSince = Math.floor((Date.now() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince >= 4) return 'inactive';

  if (latest.average_score != null && latest.average_score < 50 && latest.total_sessions_completed) {
    return 'struggling';
  }

  return graduationStatus;
}

function pickPrimaryProgress(progress: ApiPatientProgress[] | null | undefined) {
  const items = asArray(progress);
  if (items.length === 0) return null;
  return [...items].sort((a, b) => {
    const aTime = a.last_session_at ? new Date(a.last_session_at).getTime() : 0;
    const bTime = b.last_session_at ? new Date(b.last_session_at).getTime() : 0;
    return bTime - aTime;
  })[0];
}

function mapProgressEntry(
  entry: ApiPatientProgress,
  hintsByExercise: Map<string, number> = new Map(),
): PatientProgressEntry {
  const exerciseId = entry.exercise_id ?? entry.id ?? 'unknown';
  return {
    exerciseId,
    currentLevel: entry.current_level != null ? String(entry.current_level) : null,
    averageScore: entry.average_score ?? null,
    lastSessionAt: entry.last_session_at ?? null,
    lastSessionLabel: formatRelativeDate(entry.last_session_at),
    totalSessions: entry.total_sessions_completed ?? 0,
    streakDays: entry.consecutive_high_scores ?? 0,
    totalQuestions: entry.total_questions_attempted ?? 0,
    totalCorrect: entry.total_correct ?? 0,
    hintsUsed: hintsByExercise.get(exerciseId) ?? 0,
  };
}

function mapSession(session: ApiSession): PatientSession {
  const completedAt = session.completed_at ?? session.started_at ?? null;
  return {
    id: session.id,
    exerciseId: session.exercise_id,
    difficultyLevel: session.difficulty_level ?? null,
    status: session.status ?? 'UNKNOWN',
    totalQuestions: session.total_questions ?? 0,
    questionsCorrect: session.questions_correct ?? 0,
    questionsWrong: session.questions_wrong ?? 0,
    score: session.score ?? null,
    hintsUsed: session.total_cues_used ?? 0,
    durationSeconds: session.duration_seconds ?? null,
    completedAt,
    completedLabel: formatRelativeDate(completedAt),
  };
}

function aggregateHints(sessions: PatientSession[]) {
  const completed = sessions.filter((s) => s.status.toUpperCase() === 'COMPLETED');
  const totalHintsUsed = completed.reduce((sum, s) => sum + s.hintsUsed, 0);
  const hintsByExercise = new Map<string, number>();

  for (const session of completed) {
    hintsByExercise.set(
      session.exerciseId,
      (hintsByExercise.get(session.exerciseId) ?? 0) + session.hintsUsed,
    );
  }

  return {
    totalHintsUsed,
    avgHintsPerSession:
      completed.length > 0 ? Math.round((totalHintsUsed / completed.length) * 10) / 10 : null,
    hintsByExercise,
    sessions: completed,
  };
}

function isUsableNamePart(value: string | undefined) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return false;
  const normalized = trimmed.toLowerCase();
  // Swagger/OpenAPI placeholders sometimes land in the DB as literal "string".
  return normalized !== 'string' && normalized !== 'null' && normalized !== 'undefined';
}

/** The API stores the patient name under several possible keys; try them all. */
function resolvePatientName(profile: ApiPatientProfile): string {
  const pairs: Array<[string | undefined, string | undefined]> = [
    [profile.patient_first_name, profile.patient_last_name],
    [profile.first_name, profile.last_name],
    [profile.user?.first_name, profile.user?.last_name],
  ];
  for (const [first, last] of pairs) {
    const parts = [first, last].filter(isUsableNamePart);
    const joined = parts.join(' ').trim();
    if (joined) return joined;
  }
  const single = (profile.full_name ?? profile.name ?? '').trim();
  return isUsableNamePart(single) ? single : '';
}

function therapistDisplayName(profile: ApiPatientProfile) {
  if (!profile.therapist) return null;
  const name = `${profile.therapist.first_name ?? ''} ${profile.therapist.last_name ?? ''}`.trim();
  return name || null;
}

function mapPatientProfile(
  profile: ApiPatientProfile,
  progress: ApiPatientProgress[] | null | undefined = [],
  assignedModuleName?: string | null,
  sessions: PatientSession[] = [],
): Patient {
  const progressItems = asArray(progress);
  const hintStats = aggregateHints(sessions);
  const graduationStatus = mapGraduationStatus(profile.graduation_status);
  const status = deriveStatus(graduationStatus, progressItems);
  const primary = pickPrimaryProgress(progressItems);
  const progressEntries = progressItems.map((entry) =>
    mapProgressEntry(entry, hintStats.hintsByExercise),
  );
  const userId = profile.user_id ?? profile.id;
  const caregiver = readCaregiver(profile);
  const patientName = resolvePatientName(profile);
  const name = patientName || 'Name unavailable';

  const totalSessions = progressItems.reduce(
    (sum, entry) => sum + (entry.total_sessions_completed ?? 0),
    0,
  );

  const moduleName = assignedModuleName ?? null;

  const totalQuestions = progressItems.reduce(
    (sum, entry) => sum + (entry.total_questions_attempted ?? 0),
    0,
  );
  const totalCorrect = progressItems.reduce(
    (sum, entry) => sum + (entry.total_correct ?? 0),
    0,
  );
  const accuracyFromQuestions =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null;
  const accuracyFromAverage =
    primary?.average_score != null ? Math.round(primary.average_score) : null;

  return {
    id: profile.id,
    userId,
    name,
    status,
    graduationStatus: profile.graduation_status ?? 'UNKNOWN',
    therapistStatus: profile.therapist_status,
    therapistName: therapistDisplayName(profile),
    linkedSince: formatShortDate(profile.created_at) ?? '—',
    module: moduleName,
    level: primary?.current_level != null ? String(primary.current_level) : null,
    lastSession: formatRelativeDate(primary?.last_session_at),
    accuracy: accuracyFromQuestions ?? accuracyFromAverage,
    streakDays: primary?.consecutive_high_scores ?? 0,
    sessionsThisWeek: null,
    totalSessions,
    totalHintsUsed: hintStats.totalHintsUsed,
    avgHintsPerSession: hintStats.avgHintsPerSession,
    caregiverName: caregiverDisplayName(caregiver),
    caregiverEmail: caregiver?.email,
    caregiverPhone: caregiver?.phone_number ?? (profile.caregiver_info?.phone),
    caregiverRelationship: caregiver?.relationship,
    progressEntries,
    sessions: hintStats.sessions,
  };
}

async function fetchPatientProfiles(token: string) {
  return apiFetch<ApiPatientProfile[]>('/api/v1/patients', { token });
}

async function mergeProfileSummary(
  token: string,
  profile: ApiPatientProfile,
): Promise<ApiPatientProfile> {
  if (resolvePatientName(profile)) return profile;

  try {
    const summaries = asArray(await fetchPatientProfiles(token));
    const summary = summaries.find((item) => item.id === profile.id);
    if (summary) {
      return { ...profile, ...summary };
    }
  } catch {
    // Fall back to the detail profile only.
  }

  return profile;
}

async function fetchPatientProfile(token: string, patientId: string) {
  const profile = await apiFetch<ApiPatientProfile>(`/api/v1/patients/${patientId}`, { token });
  return mergeProfileSummary(token, profile);
}

async function fetchPatientProgress(token: string, patientId: string) {
  return apiFetch<ApiPatientProgress[]>(`/api/v1/patients/${patientId}/progress`, { token });
}

async function fetchPatientSessions(token: string, patientId: string) {
  return apiFetch<ApiSession[]>(`/api/v1/patients/${patientId}/sessions`, { token });
}

export async function getPatient(token: string, patientId: string): Promise<Patient> {
  const [profile, progress, assignments, sessionRows] = await Promise.all([
    fetchPatientProfile(token, patientId),
    fetchPatientProgress(token, patientId),
    listPatientModules(token, patientId).catch(() => []),
    fetchPatientSessions(token, patientId).catch((): ApiSession[] => []),
  ]);

  const sessions = asArray(sessionRows).map(mapSession);
  return mapPatientProfile(profile, progress, assignedModulesLabel(assignments), sessions);
}

export function toPatientRow(patient: Patient): PatientRow {
  return {
    id: patient.id,
    name: patient.name,
    status: patient.status,
    lastSession: patient.lastSession,
    accuracy: patient.accuracy,
    module: patient.module,
    streakDays: patient.streakDays,
  };
}

export function displayModule(patient: Patient): string | null {
  return patient.module;
}

export function countActivePatients(patients: Patient[]) {
  return patients.filter(
    (p) => p.status === 'active' || p.graduationStatus.toUpperCase() === 'ACTIVE',
  ).length;
}

/** Load patients with per-patient progress + assigned modules from the API. */
export async function listPatientsWithProgress(token: string): Promise<Patient[]> {
  const profiles = asArray(await fetchPatientProfiles(token));

  return Promise.all(
    profiles.map(async (profile) => {
      try {
        const [progress, assignments] = await Promise.all([
          fetchPatientProgress(token, profile.id),
          listPatientModules(token, profile.id).catch(() => []),
        ]);
        return mapPatientProfile(profile, progress, assignedModulesLabel(assignments));
      } catch {
        return mapPatientProfile(profile);
      }
    }),
  );
}

export async function listPatients(token: string): Promise<Patient[]> {
  return listPatientsWithProgress(token);
}
