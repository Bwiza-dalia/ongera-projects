import { asArray } from '../lib/asArray';
import { apiFetch } from '../lib/apiClient';
import type { ApiTherapistProfile } from '../types/api';

export async function listTherapists(token: string) {
  return asArray(await apiFetch<ApiTherapistProfile[]>('/api/v1/therapists', { token }));
}

export async function verifyTherapist(token: string, therapistProfileId: string) {
  return apiFetch<ApiTherapistProfile>(`/api/v1/therapists/${therapistProfileId}/verify`, {
    method: 'PATCH',
    token,
  });
}
