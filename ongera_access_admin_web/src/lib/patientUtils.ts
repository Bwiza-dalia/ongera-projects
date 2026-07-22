import type { ApiPatientProfile, ApiPatientProgress, ApiUser } from '../types/api';

/** Resolve display name from GET /patients list (PatientSummary) or detail shapes. */
export function resolvePatientName(
  profile: ApiPatientProfile,
  userById?: Map<string, ApiUser>,
): string {
  const pairs: Array<[string | undefined, string | undefined]> = [
    [profile.first_name, profile.last_name],
    [profile.patient_first_name, profile.patient_last_name],
  ];
  for (const [first, last] of pairs) {
    const joined = [first, last].filter(Boolean).join(' ').trim();
    if (joined) return joined;
  }

  const user = userById?.get(profile.user_id);
  if (user) return `${user.first_name} ${user.last_name}`.trim();

  if (profile.email?.trim()) return profile.email.trim();
  return 'Name unavailable';
}

/** Therapist link state used for assignment UI. */
export type PatientLinkStatus = 'ASSIGNED' | 'PENDING' | 'UNASSIGNED';

/** Meaningful patient status shown in the admin UI. */
export type PatientDisplayStatus = 'ASSIGNED_ACTIVE' | 'ASSIGNED_INACTIVE' | 'UNASSIGNED';

/** Active = used the app within this window; Inactive = no activity for ~3 days. */
export const PATIENT_ACTIVE_WITHIN_MS = 3 * 24 * 60 * 60 * 1000;

export function patientTherapistStatus(
  profile: ApiPatientProfile,
  hasPendingRequest = false,
): PatientLinkStatus {
  if (hasPendingRequest) return 'PENDING';

  const raw = profile.therapist_status?.toUpperCase();
  if (raw === 'PENDING') return 'PENDING';
  if (raw === 'ASSIGNED') return 'ASSIGNED';
  if (raw === 'UNASSIGNED') return 'UNASSIGNED';

  return profile.therapist_id ? 'ASSIGNED' : 'UNASSIGNED';
}

export function latestPatientActivityAt(
  progress: ApiPatientProgress[],
): string | null {
  let latest: string | null = null;
  let latestMs = -1;
  for (const entry of progress) {
    if (!entry.last_session_at) continue;
    const ms = new Date(entry.last_session_at).getTime();
    if (Number.isNaN(ms)) continue;
    if (ms > latestMs) {
      latestMs = ms;
      latest = entry.last_session_at;
    }
  }
  return latest;
}

export function isPatientRecentlyActive(
  lastActivityAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!lastActivityAt) return false;
  const ms = new Date(lastActivityAt).getTime();
  if (Number.isNaN(ms)) return false;
  return now - ms <= PATIENT_ACTIVE_WITHIN_MS;
}

/**
 * Display status for lists and badges.
 * Pending therapist links count as Unassigned until the link is confirmed.
 */
export function patientDisplayStatus(
  profile: ApiPatientProfile,
  options: {
    hasPendingRequest?: boolean;
    lastActivityAt?: string | null;
  } = {},
): PatientDisplayStatus {
  const link = patientTherapistStatus(profile, options.hasPendingRequest);
  if (link !== 'ASSIGNED') return 'UNASSIGNED';
  return isPatientRecentlyActive(options.lastActivityAt)
    ? 'ASSIGNED_ACTIVE'
    : 'ASSIGNED_INACTIVE';
}

export function patientDisplayStatusLabel(status: PatientDisplayStatus): string {
  switch (status) {
    case 'ASSIGNED_ACTIVE':
      return 'Assigned – Active';
    case 'ASSIGNED_INACTIVE':
      return 'Assigned – Inactive';
    case 'UNASSIGNED':
      return 'Unassigned';
  }
}

export function patientDisplayStatusClass(status: PatientDisplayStatus): string {
  switch (status) {
    case 'ASSIGNED_ACTIVE':
      return 'patients-status patients-status--active';
    case 'ASSIGNED_INACTIVE':
      return 'patients-status patients-status--inactive';
    case 'UNASSIGNED':
      return 'patients-status patients-status--unassigned';
  }
}

export function therapistUserLabel(userId: string, userById: Map<string, ApiUser>) {
  const user = userById.get(userId);
  if (!user) return 'Name unavailable';
  return `${user.first_name} ${user.last_name}`.trim();
}
