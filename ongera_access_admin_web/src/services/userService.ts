import { asArray } from '../lib/asArray';
import { apiFetch } from '../lib/apiClient';
import type { ApiCreateUserRequest, ApiUser } from '../types/api';

export async function listUsers(token: string) {
  return asArray(await apiFetch<ApiUser[]>('/api/v1/users', { token }));
}

export async function createUser(token: string, payload: ApiCreateUserRequest) {
  return apiFetch<ApiUser>('/api/v1/users', {
    method: 'POST',
    token,
    json: payload,
  });
}

export async function deleteUser(token: string, userId: string) {
  return apiFetch<void>(`/api/v1/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}
