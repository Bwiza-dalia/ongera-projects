import { apiFetch } from '../lib/apiClient';
import type { ApiEnumOption, ApiEnumResponse } from '../types/api';

export async function getEnumValues(token: string, name: string): Promise<ApiEnumOption[]> {
  const data = await apiFetch<ApiEnumResponse>(`/api/v1/enums/${name}`, { token });
  return Array.isArray(data.values) ? data.values : [];
}
