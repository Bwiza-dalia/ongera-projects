import { extractList } from '../lib/extractList';
import { apiFetch } from '../lib/apiClient';
import type { ApiCreateUserRequest, ApiUser } from '../types/api';

export async function listUsers(token: string) {
  const data = await apiFetch<unknown>('/api/v1/users', { token });
  return extractList<ApiUser>(data);
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
