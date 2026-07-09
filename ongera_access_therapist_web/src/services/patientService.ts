import { isApiEnabled } from '../config/api';
import { mockPatients } from '../data/mockPatients';
import { formatRelativeDate, formatShortDate } from '../lib/formatDate';
import { caregiverDisplayName, readCaregiver } from '../lib/caregiverUtils';
import { apiFetch } from '../lib/apiClient';
import type { ApiPatientProfile, ApiPatientProgress } from '../types/api';
import type { Patient, PatientProgressEntry } from '../types/patients';
import type { PatientRow, PatientStatus } from '../types/dashboard';

import { asArray } from '../lib/asArray';
import { getCarePlan, planModuleLabel } from './carePlanService';
import {
  listPatientModules,
  primaryAssignedModule,
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

function mapProgressEntry(entry: ApiPatientProgress): PatientProgressEntry {
  const exerciseId = entry.exercise_id ?? entry.id ?? 'unknown';
  return {
    exerciseId,
    currentLevel: entry.current_level ?? null,
    averageScore: entry.average_score ?? null,
    lastSessionAt: entry.last_session_at ?? null,
    lastSessionLabel: formatRelativeDate(entry.last_session_at),
    totalSessions: entry.total_sessions_completed ?? 0,
    streakDays: entry.consecutive_high_scores ?? 0,
  };
}

/** The API stores the patient name under several possible keys; try them all. */
function resolvePatientName(profile: ApiPatientProfile): string {
  const pairs: Array<[string | undefined, string | undefined]> = [
    [profile.patient_first_name, profile.patient_last_name],
    [profile.first_name, profile.last_name],
    [profile.user?.first_name, profile.user?.last_name],
  ];
  for (const [first, last] of pairs) {
    const joined = [first, last].filter(Boolean).join(' ').trim();
    if (joined) return joined;
  }
  const single = (profile.full_name ?? profile.name ?? '').trim();
  return single;
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
): Patient {
  const progressItems = asArray(progress);
  const graduationStatus = mapGraduationStatus(profile.graduation_status);
  const status = deriveStatus(graduationStatus, progressItems);
  const primary = pickPrimaryProgress(progressItems);
  const progressEntries = progressItems.map(mapProgressEntry);
  const userId = profile.user_id ?? profile.id;
  const caregiver = readCaregiver(profile);
  const patientName = resolvePatientName(profile);
  const name = patientName || `Patient ${userId.slice(0, 8)}`;

  const totalSessions = progressItems.reduce(
    (sum, entry) => sum + (entry.total_sessions_completed ?? 0),
    0,
  );

  const carePlan = getCarePlan(profile.id);
  const moduleName =
    planModuleLabel(carePlan) ??
    assignedModuleName ??
    (primary?.exercise_id ? `Exercise ${primary.exercise_id.slice(0, 8)}` : null);

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
    level: primary?.current_level ?? null,
    lastSession: formatRelativeDate(primary?.last_session_at),
    accuracy:
      primary?.average_score != null ? Math.round(primary.average_score) : null,
    streakDays: primary?.consecutive_high_scores ?? 0,
    sessionsThisWeek: null,
    totalSessions,
    caregiverName: caregiverDisplayName(caregiver),
    caregiverEmail: caregiver?.email,
    caregiverPhone: caregiver?.phone_number ?? (profile.caregiver_info?.phone),
    caregiverRelationship: caregiver?.relationship,
    progressEntries,
  };
}

async function fetchPatientProfiles(token: string) {
  return apiFetch<ApiPatientProfile[]>('/api/v1/patients', { token });
}

async function fetchPatientProfile(token: string, patientId: string) {
  return apiFetch<ApiPatientProfile>(`/api/v1/patients/${patientId}`, { token });
}

async function fetchPatientProgress(token: string, patientId: string) {
  return apiFetch<ApiPatientProgress[]>(`/api/v1/patients/${patientId}/progress`, { token });
}

export async function listPatients(token: string): Promise<Patient[]> {
  if (!isApiEnabled()) {
    return mockPatients;
  }

  const profiles = asArray(await fetchPatientProfiles(token));
  return profiles.map((profile) => mapPatientProfile(profile));
}

export async function getPatient(token: string, patientId: string): Promise<Patient> {
  if (!isApiEnabled()) {
    const patient = mockPatients.find((p) => p.id === patientId);
    if (!patient) throw new Error('Patient not found');
    return patient;
  }

  const [profile, progress, assignments] = await Promise.all([
    fetchPatientProfile(token, patientId),
    fetchPatientProgress(token, patientId),
    listPatientModules(token, patientId).catch(() => []),
  ]);

  const assigned = primaryAssignedModule(assignments);
  return mapPatientProfile(profile, progress, assigned?.name ?? null);
}

export function toPatientRow(patient: Patient): PatientRow {
  const carePlan = getCarePlan(patient.id);
  return {
    id: patient.id,
    name: patient.name,
    status: patient.status,
    lastSession: patient.lastSession,
    accuracy: patient.accuracy,
    module: planModuleLabel(carePlan) ?? patient.module,
    streakDays: patient.streakDays,
  };
}

export function displayModule(patient: Patient): string | null {
  return planModuleLabel(getCarePlan(patient.id)) ?? patient.module;
}

export function countActivePatients(patients: Patient[]) {
  return patients.filter(
    (p) => p.status === 'active' || p.graduationStatus.toUpperCase() === 'ACTIVE',
  ).length;
}

export async function listPatientsWithProgress(token: string): Promise<Patient[]> {
  if (!isApiEnabled()) {
    return mockPatients;
  }

  const profiles = asArray(await fetchPatientProfiles(token));

  return Promise.all(
    profiles.map(async (profile) => {
      try {
        const [progress, assignments] = await Promise.all([
          fetchPatientProgress(token, profile.id),
          listPatientModules(token, profile.id).catch(() => []),
        ]);
        const assigned = primaryAssignedModule(assignments);
        return mapPatientProfile(profile, progress, assigned?.name ?? null);
      } catch {
        return mapPatientProfile(profile);
      }
    }),
  );
}
