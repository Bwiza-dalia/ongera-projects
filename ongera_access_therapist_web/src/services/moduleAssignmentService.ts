import { asArray } from '../lib/asArray';
import { ApiError, apiFetch } from '../lib/apiClient';
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

export async function unassignModule(token: string, patientId: string, moduleId: string) {
  return apiFetch<unknown>(`/api/v1/patients/${patientId}/modules/${moduleId}`, {
    method: 'DELETE',
    token,
  });
}

export interface AssignModulesResult {
  assigned: string[];
  alreadyAssigned: string[];
  failed: { moduleId: string; message: string }[];
}

/**
 * Assigns several modules to a patient. A 409 means the module is already
 * assigned, which we treat as success rather than an error.
 */
export async function assignModules(
  token: string,
  patientId: string,
  moduleIds: string[],
): Promise<AssignModulesResult> {
  const result: AssignModulesResult = { assigned: [], alreadyAssigned: [], failed: [] };

  for (const moduleId of moduleIds) {
    try {
      await assignModule(token, patientId, moduleId);
      result.assigned.push(moduleId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        result.alreadyAssigned.push(moduleId);
      } else {
        result.failed.push({
          moduleId,
          message: err instanceof Error ? err.message : 'Failed to assign module',
        });
      }
    }
  }

  return result;
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
