import {
  buildEnrollmentSeries,
  buildPendingTasks,
  buildRecentActivity,
  userRoleSummary,
  type DashboardActivity,
  type DashboardTask,
  type EnrollmentPoint,
} from '../lib/dashboardMetrics';
import { listModules } from './catalogService';
import { listPatients } from './patientService';
import { listTherapists } from './therapistService';
import { listUsers } from './userService';

export interface DashboardCounts {
  users: number;
  patients: number;
  therapists: number;
  modules: number;
  verifiedTherapists: number;
}

export interface DashboardData {
  counts: DashboardCounts;
  activity: DashboardActivity[];
  tasks: DashboardTask[];
  enrollment: EnrollmentPoint[];
  userSummary: string;
}

export async function getDashboardData(token: string): Promise<DashboardData> {
  const [users, patients, therapists, modules] = await Promise.all([
    listUsers(token),
    listPatients(token),
    listTherapists(token),
    listModules(token),
  ]);

  const counts: DashboardCounts = {
    users: users.length,
    patients: patients.length,
    therapists: therapists.length,
    modules: modules.length,
    verifiedTherapists: therapists.filter((t) => t.is_verified).length,
  };

  return {
    counts,
    activity: buildRecentActivity(users, patients, therapists),
    tasks: buildPendingTasks(users, patients, therapists),
    enrollment: buildEnrollmentSeries(patients, therapists),
    userSummary: userRoleSummary(users),
  };
}

/** @deprecated Use getDashboardData */
export async function getDashboardCounts(token: string) {
  const { counts } = await getDashboardData(token);
  return counts;
}
