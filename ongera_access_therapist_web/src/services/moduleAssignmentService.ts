import { asArray } from '../lib/asArray';
import { apiFetch } from '../lib/apiClient';
import type { ApiAssignedModule, ApiPatientModuleAssignment } from '../types/api';

export async function listPatientModules(token: string, patientId: string) {
  return asArray(
    await apiFetch<ApiPatientModuleAssignment[]>(`/api/v1/patients/${patientId}/modules`, {
      token,
    }),
  );
}

export async function assignModule(token: string, patientId: string, moduleId: string) {
  return apiFetch<ApiPatientModuleAssignment>(`/api/v1/patients/${patientId}/modules`, {
    method: 'POST',
    token,
    json: { module_id: moduleId },
  });
}

export function primaryAssignedModule(
  assignments: ApiPatientModuleAssignment[],
): ApiAssignedModule | null {
  if (assignments.length === 0) return null;

  const sorted = [...assignments].sort((a, b) => {
    const aTime = a.assigned_at ? new Date(a.assigned_at).getTime() : 0;
    const bTime = b.assigned_at ? new Date(b.assigned_at).getTime() : 0;
    return bTime - aTime;
  });

  const latest = sorted[0];
  if (latest.modules?.length) return latest.modules[0];

  if (latest.module_id) {
    return {
      module_id: latest.module_id,
      name: 'Assigned module',
    };
  }

  return null;
}
