import { apiFetch } from '../lib/apiClient';
import type { ApiProgressReport, ApiWeeklyReport } from '../types/api';

export async function getPatientWeeklyReport(
  token: string,
  patientId: string,
  weekStart: string,
): Promise<ApiWeeklyReport> {
  const qs = new URLSearchParams({ week_start: weekStart });
  return apiFetch<ApiWeeklyReport>(
    `/api/v1/patients/${patientId}/reports/weekly?${qs.toString()}`,
    { token },
  );
}

export async function getPatientProgressReport(
  token: string,
  patientId: string,
): Promise<ApiProgressReport> {
  return apiFetch<ApiProgressReport>(
    `/api/v1/patients/${patientId}/reports/progress`,
    { token },
  );
}
