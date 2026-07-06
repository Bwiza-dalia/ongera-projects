import { asArray } from '../lib/asArray';
import { apiFetch } from '../lib/apiClient';
import type { ApiPatientProfile } from '../types/api';

export async function listPatients(token: string) {
  return asArray(await apiFetch<ApiPatientProfile[]>('/api/v1/patients', { token }));
}

export async function assignTherapist(
  token: string,
  patientId: string,
  therapistUserId: string,
) {
  return apiFetch<ApiPatientProfile>(`/api/v1/patients/${patientId}/therapist`, {
    method: 'PUT',
    token,
    json: { therapist_id: therapistUserId },
  });
}
