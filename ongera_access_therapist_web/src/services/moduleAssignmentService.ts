import { asArray } from '../lib/asArray';
import { ApiError, apiFetch } from '../lib/apiClient';
import type { ModuleAssignmentPlan } from './carePlanService';
import type { ApiAssignedModule, ApiPatientModuleAssignment } from '../types/api';

/** Matches the API's ExercisePlanItem (snake_case, numeric levels). */
interface ApiExercisePlanItem {
  exercise_id: string;
  priority: number;
  starting_level: number;
}

function toRequestBody(moduleId: string, plan?: ModuleAssignmentPlan) {
  const exercisePlan: ApiExercisePlanItem[] = (plan?.exercisePlan ?? []).map((item) => ({
    exercise_id: item.exerciseId,
    priority: item.priority,
    starting_level: item.startingLevel,
  }));

  return {
    module_id: moduleId,
    ...(exercisePlan.length ? { exercise_plan: exercisePlan } : {}),
    ...(plan?.weeklyMinutesTarget != null
      ? { weekly_minutes_target: Math.max(0, Math.round(plan.weeklyMinutesTarget)) }
      : {}),
  };
}

export async function listPatientModules(token: string, patientId: string) {
  return asArray(
    await apiFetch<ApiPatientModuleAssignment[]>(`/api/v1/patients/${patientId}/modules`, {
      token,
    }),
  );
}

export async function assignModule(
  token: string,
  patientId: string,
  moduleId: string,
  plan?: ModuleAssignmentPlan,
) {
  return apiFetch<ApiPatientModuleAssignment>(`/api/v1/patients/${patientId}/modules`, {
    method: 'POST',
    token,
    json: toRequestBody(moduleId, plan),
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
  /** Modules that already existed and had their plan updated (re-sent). */
  updated: string[];
  /** Previously-assigned modules removed because they left the plan. */
  removed: string[];
  failed: { moduleId: string; message: string }[];
}

/** Flattens the modules API response into the set of assigned module IDs. */
export function assignedModuleIds(assignments: ApiPatientModuleAssignment[]): string[] {
  const ids = new Set<string>();
  for (const assignment of assignments) {
    if (assignment.modules?.length) {
      for (const mod of assignment.modules) {
        if (mod.module_id) ids.add(mod.module_id);
      }
    } else if (assignment.module_id) {
      ids.add(assignment.module_id);
    }
  }
  return Array.from(ids);
}

/**
 * Sends the therapist's plan to the API, one module at a time, including the
 * per-exercise priority/level and weekly minutes target.
 *
 * The API's POST endpoint creates a plan and returns 409 when the module is
 * already assigned. To make edits/re-sends actually take effect we unassign the
 * existing module and re-create it with the latest plan.
 */
export async function assignModules(
  token: string,
  patientId: string,
  plans: ModuleAssignmentPlan[],
): Promise<AssignModulesResult> {
  const result: AssignModulesResult = { assigned: [], updated: [], removed: [], failed: [] };

  for (const plan of plans) {
    const { moduleId } = plan;
    try {
      await assignModule(token, patientId, moduleId, plan);
      result.assigned.push(moduleId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        try {
          await unassignModule(token, patientId, moduleId);
          await assignModule(token, patientId, moduleId, plan);
          result.updated.push(moduleId);
        } catch (retryErr) {
          result.failed.push({
            moduleId,
            message: retryErr instanceof Error ? retryErr.message : 'Failed to update module plan',
          });
        }
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

/**
 * Makes the patient's server-side assignment match the therapist's plan exactly:
 * creates/updates every module in the plan, and unassigns any module that used
 * to be assigned but is no longer part of the plan. Uses only the /modules
 * assignment endpoints (POST to create/update, DELETE to remove).
 */
export async function syncPatientPlan(
  token: string,
  patientId: string,
  plans: ModuleAssignmentPlan[],
): Promise<AssignModulesResult> {
  let currentIds: string[] = [];
  try {
    currentIds = assignedModuleIds(await listPatientModules(token, patientId));
  } catch {
    // No existing assignments readable — proceed as a fresh assignment.
    currentIds = [];
  }

  const result = await assignModules(token, patientId, plans);

  const desiredIds = new Set(plans.map((plan) => plan.moduleId));
  for (const moduleId of currentIds) {
    if (desiredIds.has(moduleId)) continue;
    try {
      await unassignModule(token, patientId, moduleId);
      result.removed.push(moduleId);
    } catch (err) {
      result.failed.push({
        moduleId,
        message: err instanceof Error ? err.message : 'Failed to remove module',
      });
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

  // Without an API module name, don't invent a label.
  return null;
}

/** Comma-separated module names from API assignments only. */
export function assignedModulesLabel(assignments: ApiPatientModuleAssignment[]): string | null {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const assignment of assignments) {
    for (const mod of assignment.modules ?? []) {
      const key = mod.module_id || mod.name;
      if (!mod.name || seen.has(key)) continue;
      seen.add(key);
      names.push(mod.name);
    }
  }

  return names.length > 0 ? names.join(', ') : null;
}
