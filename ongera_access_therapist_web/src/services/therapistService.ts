import { asArray } from '../lib/asArray';
import { apiFetch } from '../lib/apiClient';
import type { ApiTherapistProfile, ApiTherapistPublic } from '../types/api';

const PROFILE_CACHE_KEY = 'ongera_therapist_profile_id';

export async function resolveTherapistProfileId(
  token: string,
  userId: string,
  searchName: string,
): Promise<string> {
  const cached = sessionStorage.getItem(`${PROFILE_CACHE_KEY}_${userId}`);
  if (cached) return cached;

  const query = searchName.trim() || 'a';
  const results = asArray(
    await apiFetch<ApiTherapistPublic[]>(
      `/api/v1/therapists/search?q=${encodeURIComponent(query)}`,
      { token },
    ),
  );

  const match = results.find((t) => t.user_id === userId);
  if (!match) {
    throw new Error('Therapist profile not found. Contact an admin to verify your account.');
  }

  sessionStorage.setItem(`${PROFILE_CACHE_KEY}_${userId}`, match.id);
  return match.id;
}

export async function getTherapistProfile(token: string, profileId: string) {
  return apiFetch<ApiTherapistProfile>(`/api/v1/therapists/${profileId}`, { token });
}
