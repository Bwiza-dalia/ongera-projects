import { asArray } from '../lib/asArray';
import { apiFetch } from '../lib/apiClient';
import { formatRelativeDate } from '../lib/formatDate';
import type { ApiAssignmentRequest, ApiAssignmentRequestDetail } from '../types/api';
import type { PendingReview } from '../types/dashboard';

export interface AssignmentRequest {
  id: string;
  patientId: string;
  patientName: string;
  status: string;
  createdAt: string;
  createdAtLabel: string;
}

function mapRequest(req: ApiAssignmentRequestDetail): AssignmentRequest {
  const first = req.patient_first_name ?? '';
  const last = req.patient_last_name ?? '';
  const name = `${first} ${last}`.trim() || `Patient ${req.patient_id.slice(0, 8)}`;

  return {
    id: req.id,
    patientId: req.patient_id,
    patientName: name,
    status: req.status,
    createdAt: req.created_at ?? '',
    createdAtLabel: formatRelativeDate(req.created_at) ?? 'Recently',
  };
}

export async function listIncomingRequests(token: string, therapistProfileId: string) {
  const data = asArray(
    await apiFetch<ApiAssignmentRequestDetail[]>(
      `/api/v1/therapists/${therapistProfileId}/requests`,
      { token },
    ),
  );
  return data.map(mapRequest);
}

export async function approveRequest(token: string, requestId: string) {
  return apiFetch<ApiAssignmentRequest>(`/api/v1/assignment-requests/${requestId}/approve`, {
    method: 'PATCH',
    token,
  });
}

export async function rejectRequest(token: string, requestId: string) {
  return apiFetch<ApiAssignmentRequest>(`/api/v1/assignment-requests/${requestId}/reject`, {
    method: 'PATCH',
    token,
  });
}

export function toPendingReviews(requests: AssignmentRequest[]): PendingReview[] {
  return requests
    .filter((r) => r.status.toUpperCase() === 'PENDING')
    .map((r) => ({
      id: r.id,
      patientName: r.patientName,
      reason: 'Patient link request',
      createdAt: r.createdAtLabel,
    }));
}
