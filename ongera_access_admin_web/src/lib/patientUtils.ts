import type { ApiPatientProfile, ApiUser } from '../types/api';

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
  return profile.user_id.slice(0, 8) + '…';
}

export function patientTherapistStatus(profile: ApiPatientProfile): 'ASSIGNED' | 'UNASSIGNED' {
  return profile.therapist_id ? 'ASSIGNED' : 'UNASSIGNED';
}

export function therapistUserLabel(userId: string, userById: Map<string, ApiUser>) {
  const user = userById.get(userId);
  if (!user) return userId.slice(0, 8) + '…';
  return `${user.first_name} ${user.last_name}`.trim();
}
