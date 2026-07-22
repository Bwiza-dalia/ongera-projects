import { asArray } from '../lib/asArray';
import { apiFetch } from '../lib/apiClient';
import type {
  ApiAssignedModule,
  ApiPatientModuleAssignment,
  ApiPatientModuleListResponse,
} from '../types/api';

/** Normalize GET /patients/{id}/modules into a flat module list. */
export async function listPatientCarePlanModules(
  token: string,
  patientId: string,
): Promise<ApiAssignedModule[]> {
  const data = await apiFetch<ApiPatientModuleListResponse | ApiPatientModuleAssignment[] | ApiAssignedModule[]>(
    `/api/v1/patients/${patientId}/modules`,
    { token },
  );

  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    const first = data[0] as ApiPatientModuleAssignment | ApiAssignedModule;
    if ('modules' in first && Array.isArray(first.modules)) {
      return asArray(
        (data as ApiPatientModuleAssignment[]).flatMap((row) => asArray(row.modules)),
      );
    }
    if ('module_id' in first) {
      return data as ApiAssignedModule[];
    }
    return [];
  }

  return asArray(data.modules);
}

/** DELETE /patients/{id}/modules — removes the entire therapy plan. */
export async function clearPatientTherapyPlan(token: string, patientId: string) {
  return apiFetch<unknown>(`/api/v1/patients/${patientId}/modules`, {
    method: 'DELETE',
    token,
  });
}
