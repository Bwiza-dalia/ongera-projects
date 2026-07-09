import type { ApiCaregiver, ApiCaregiverInfo, ApiPatientProfile } from '../types/api';

export function readCaregiver(profile: ApiPatientProfile): ApiCaregiver | undefined {
  if (profile.caregiver) return profile.caregiver;
  if (!profile.caregiver_info) return undefined;
  const info = profile.caregiver_info;
  return {
    fullname: info.fullname ?? info.name,
    email: info.email,
    relationship: info.relationship,
    phone_number: info.phone_number ?? info.phone,
  };
}

export function caregiverDisplayName(caregiver?: ApiCaregiver | ApiCaregiverInfo) {
  if (!caregiver) return undefined;
  if ('fullname' in caregiver && caregiver.fullname) return caregiver.fullname;
  if ('name' in caregiver && caregiver.name) return caregiver.name;
  return undefined;
}
