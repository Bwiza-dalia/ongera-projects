import { extractList } from '../lib/extractList';
import { apiFetch } from '../lib/apiClient';
import type { ApiPatientSummary, ApiUpdatePatientRequest } from '../types/api';

export async function listPatients(token: string) {
  const data = await apiFetch<unknown>('/api/v1/patients', { token });
  return extractList<ApiPatientSummary>(data);
}

export async function updatePatient(
  token: string,
  patientId: string,
  payload: ApiUpdatePatientRequest,
) {
  return apiFetch<ApiPatientSummary>(`/api/v1/patients/${patientId}`, {
    method: 'PUT',
    token,
    json: payload,
  });
}

export async function assignTherapist(
  token: string,
  patientId: string,
  therapistUserId: string,
) {
  return apiFetch<ApiPatientSummary>(`/api/v1/patients/${patientId}/therapist`, {
    method: 'PUT',
    token,
    json: { therapist_id: therapistUserId },
  });
}
