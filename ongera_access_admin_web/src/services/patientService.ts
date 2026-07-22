import { extractList } from '../lib/extractList';
import { apiFetch } from '../lib/apiClient';
import type {
  ApiLoginResponse,
  ApiPatientProgress,
  ApiPatientSummary,
  ApiRegisterRequest,
  ApiUpdatePatientRequest,
} from '../types/api';

export async function listPatients(token: string) {
  const data = await apiFetch<unknown>('/api/v1/patients', { token });
  return extractList<ApiPatientSummary>(data);
}

export async function getPatient(token: string, patientId: string) {
  const patients = await listPatients(token);
  const patient = patients.find((item) => item.id === patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }
  return patient;
}

export async function getPatientProgress(token: string, patientId: string) {
  try {
    const data = await apiFetch<unknown>(`/api/v1/patients/${patientId}/progress`, { token });
    return extractList<ApiPatientProgress>(data);
  } catch {
    return [] as ApiPatientProgress[];
  }
}

/**
 * Create a patient account. Uses POST /api/v1/auth/register because it is the
 * only endpoint that accepts caregiver + therapist_id and creates a PENDING
 * assignment request for the therapist to accept/reject.
 * The returned session token is intentionally ignored so the admin stays logged in.
 */
export async function createPatient(payload: Omit<ApiRegisterRequest, 'role'>) {
  return apiFetch<ApiLoginResponse>('/api/v1/auth/register', {
    method: 'POST',
    json: { ...payload, role: 'patient' },
  });
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

/**
 * Admin links a therapist to an existing patient. On current API builds this
 * creates / updates the assignment relationship; therapists still receive a
 * PENDING request when patients are created via createPatient(therapist_id).
 */
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
