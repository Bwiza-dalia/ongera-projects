import type { ApiCaregiver, ApiCaregiverInfo, ApiPatientProfile } from '../types/api';

export function readCaregiver(profile: ApiPatientProfile): ApiCaregiver | undefined {
  if (profile.caregiver) return profile.caregiver;
  if (!profile.caregiver_info) return undefined;
  return {
    fullname: profile.caregiver_info.fullname ?? profile.caregiver_info.name,
    email: profile.caregiver_info.email,
    phone_number: profile.caregiver_info.phone_number ?? profile.caregiver_info.phone,
    relationship: profile.caregiver_info.relationship,
  };
}

export function caregiverDisplayName(caregiver?: ApiCaregiver | ApiCaregiverInfo) {
  if (!caregiver) return undefined;
  if ('fullname' in caregiver && caregiver.fullname) return caregiver.fullname;
  if ('name' in caregiver && caregiver.name) return caregiver.name;
  return undefined;
}
