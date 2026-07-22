import { extractList } from '../lib/extractList';
import { apiFetch } from '../lib/apiClient';
import type { ApiAssignmentRequest } from '../types/api';

export async function listAssignmentRequests(token: string) {
  const data = await apiFetch<unknown>('/api/v1/assignment-requests', { token });
  return extractList<ApiAssignmentRequest>(data);
}

export function pendingRequestByPatientId(requests: ApiAssignmentRequest[]) {
  const map = new Map<string, ApiAssignmentRequest>();
  for (const req of requests) {
    if (req.status.toUpperCase() !== 'PENDING') continue;
    map.set(req.patient_id, req);
  }
  return map;
}

export function requestedTherapistUserId(req: ApiAssignmentRequest): string {
  return (req.therapist_user_id ?? req.therapist_id ?? '').trim();
}
