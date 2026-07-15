import { extractList } from '../lib/extractList';
import { apiFetch } from '../lib/apiClient';
import type { ApiRegisterRequest, ApiTherapistProfile } from '../types/api';

export async function listTherapists(token: string) {
  const data = await apiFetch<unknown>('/api/v1/therapists', { token });
  return extractList<ApiTherapistProfile>(data);
}

/**
 * Create a therapist account. Uses POST /api/v1/auth/register because it is the
 * only endpoint that persists affiliation/specialty on the therapist profile.
 * The returned session token is intentionally ignored so the admin stays logged in.
 */
export async function createTherapist(
  payload: Omit<ApiRegisterRequest, 'role'>,
) {
  return apiFetch<unknown>('/api/v1/auth/register', {
    method: 'POST',
    json: { ...payload, role: 'therapist' },
  });
}

export async function verifyTherapist(token: string, therapistProfileId: string) {
  return apiFetch<ApiTherapistProfile>(`/api/v1/therapists/${therapistProfileId}/verify`, {
    method: 'PATCH',
    token,
  });
}
