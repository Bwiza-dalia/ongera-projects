import { asArray } from '../lib/asArray';
import { apiFetch } from '../lib/apiClient';
import { caregiverDisplayName, readCaregiver } from '../lib/caregiverUtils';
import { formatRelativeDate, formatShortDate } from '../lib/formatDate';
import { ageFromDateOfBirth } from '../lib/patientAge';
import type {
  ApiAssignmentRequest,
  ApiAssignmentRequestDetail,
  ApiCaregiver,
  ApiPatientProfile,
} from '../types/api';
import type { PendingReview } from '../types/dashboard';

export interface AssignmentRequestPatientInfo {
  email?: string;
  dateOfBirth?: string;
  dateOfBirthLabel?: string;
  age?: number | null;
  location?: string;
  caregiverName?: string;
  caregiverRelationship?: string;
  caregiverEmail?: string;
  caregiverPhone?: string;
  note?: string;
}

export interface AssignmentRequest {
  id: string;
  patientId: string;
  patientName: string;
  status: string;
  createdAt: string;
  createdAtLabel: string;
  patientInfo?: AssignmentRequestPatientInfo;
}

function pickNote(req: ApiAssignmentRequestDetail): string | undefined {
  const value = req.note ?? req.request_note ?? req.reason ?? req.message;
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function caregiverFromRequest(req: ApiAssignmentRequestDetail): ApiCaregiver | undefined {
  if (req.caregiver) return req.caregiver;
  if (!req.caregiver_info) return undefined;
  return {
    fullname: req.caregiver_info.fullname ?? req.caregiver_info.name,
    email: req.caregiver_info.email,
    phone_number: req.caregiver_info.phone_number ?? req.caregiver_info.phone,
    relationship: req.caregiver_info.relationship,
  };
}

function buildPatientInfo(input: {
  email?: string;
  dateOfBirth?: string;
  location?: string;
  caregiver?: ApiCaregiver;
  note?: string;
}): AssignmentRequestPatientInfo | undefined {
  const age = ageFromDateOfBirth(input.dateOfBirth);
  const info: AssignmentRequestPatientInfo = {
    email: input.email?.trim() || undefined,
    dateOfBirth: input.dateOfBirth,
    dateOfBirthLabel: formatShortDate(input.dateOfBirth) ?? undefined,
    age,
    location: input.location?.trim() || undefined,
    caregiverName: caregiverDisplayName(input.caregiver),
    caregiverRelationship: input.caregiver?.relationship?.trim() || undefined,
    caregiverEmail: input.caregiver?.email?.trim() || undefined,
    caregiverPhone: input.caregiver?.phone_number?.trim() || undefined,
    note: input.note?.trim() || undefined,
  };

  const hasAny = Boolean(
    info.email ||
      info.dateOfBirthLabel ||
      info.age != null ||
      info.location ||
      info.caregiverName ||
      info.caregiverRelationship ||
      info.caregiverEmail ||
      info.caregiverPhone ||
      info.note,
  );
  return hasAny ? info : undefined;
}

function mergePatientInfo(
  base?: AssignmentRequestPatientInfo,
  extra?: AssignmentRequestPatientInfo,
): AssignmentRequestPatientInfo | undefined {
  if (!base) return extra;
  if (!extra) return base;
  return {
    email: base.email ?? extra.email,
    dateOfBirth: base.dateOfBirth ?? extra.dateOfBirth,
    dateOfBirthLabel: base.dateOfBirthLabel ?? extra.dateOfBirthLabel,
    age: base.age ?? extra.age,
    location: base.location ?? extra.location,
    caregiverName: base.caregiverName ?? extra.caregiverName,
    caregiverRelationship: base.caregiverRelationship ?? extra.caregiverRelationship,
    caregiverEmail: base.caregiverEmail ?? extra.caregiverEmail,
    caregiverPhone: base.caregiverPhone ?? extra.caregiverPhone,
    note: base.note ?? extra.note,
  };
}

function mapRequest(req: ApiAssignmentRequestDetail): AssignmentRequest {
  const first = req.patient_first_name ?? '';
  const last = req.patient_last_name ?? '';
  const name = `${first} ${last}`.trim() || 'Name unavailable';
  const note = pickNote(req);

  return {
    id: req.id,
    patientId: req.patient_id,
    patientName: name,
    status: req.status,
    createdAt: req.created_at ?? '',
    createdAtLabel: formatRelativeDate(req.created_at) ?? '',
    patientInfo: buildPatientInfo({
      email: req.patient_email ?? req.email,
      dateOfBirth: req.patient_date_of_birth ?? req.date_of_birth,
      location: req.patient_location ?? req.location,
      caregiver: caregiverFromRequest(req),
      note,
    }),
  };
}

function patientInfoFromProfile(profile: ApiPatientProfile): AssignmentRequestPatientInfo | undefined {
  return buildPatientInfo({
    email: profile.email ?? profile.user?.email,
    dateOfBirth: profile.date_of_birth ?? profile.user?.date_of_birth,
    location: profile.location ?? profile.user?.location,
    caregiver: readCaregiver(profile),
  });
}

async function enrichFromPatientProfile(
  token: string,
  request: AssignmentRequest,
): Promise<AssignmentRequest> {
  try {
    const profile = await apiFetch<ApiPatientProfile>(`/api/v1/patients/${request.patientId}`, {
      token,
    });
    return {
      ...request,
      patientInfo: mergePatientInfo(request.patientInfo, patientInfoFromProfile(profile)),
    };
  } catch {
    return request;
  }
}

export async function listIncomingRequests(token: string, therapistProfileId: string) {
  const data = asArray(
    await apiFetch<ApiAssignmentRequestDetail[]>(
      `/api/v1/therapists/${therapistProfileId}/requests`,
      { token },
    ),
  );
  const mapped = data.map(mapRequest);

  // Pending requests may only include names; try to load a richer preview when allowed.
  return Promise.all(
    mapped.map((req) =>
      req.status.toUpperCase() === 'PENDING' ? enrichFromPatientProfile(token, req) : req,
    ),
  );
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
      reason: r.patientInfo?.note?.trim() || 'Assignment request',
      createdAt: r.createdAtLabel,
    }));
}
