import type { ApiTherapistProfile, TherapistAccountStatus } from '../types/api';

export function therapistAccountStatus(
  therapist: Pick<ApiTherapistProfile, 'status' | 'is_verified'>,
): TherapistAccountStatus {
  const raw = (therapist.status ?? '').trim().toUpperCase();
  if (raw === 'VERIFIED' || raw === 'REJECTED' || raw === 'PENDING') {
    return raw;
  }
  return therapist.is_verified ? 'VERIFIED' : 'PENDING';
}

export function therapistStatusLabel(status: TherapistAccountStatus): string {
  switch (status) {
    case 'VERIFIED':
      return 'Verified';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Pending';
  }
}

export function isTherapistVerified(
  therapist: Pick<ApiTherapistProfile, 'status' | 'is_verified'>,
): boolean {
  return therapistAccountStatus(therapist) === 'VERIFIED';
}
