import { extractList } from '../lib/extractList';
import { apiFetch } from '../lib/apiClient';
import type { ApiTherapistProfile } from '../types/api';

export async function listTherapists(token: string) {
  const data = await apiFetch<unknown>('/api/v1/therapists', { token });
  return extractList<ApiTherapistProfile>(data);
}

export async function verifyTherapist(token: string, therapistProfileId: string) {
  return apiFetch<ApiTherapistProfile>(`/api/v1/therapists/${therapistProfileId}/verify`, {
    method: 'PATCH',
    token,
  });
}
