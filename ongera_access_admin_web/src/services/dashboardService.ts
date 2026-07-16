import {
  buildMonthlyNewSeries,
  buildNetworkGrowthSeries,
  buildPendingTasks,
  buildRecentActivity,
  monthOverMonthTrend,
  userRoleSummary,
  type DashboardActivity,
  type DashboardTask,
  type EnrollmentPoint,
  type KpiTrend,
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

export interface DashboardKpiSeries {
  users: number[];
  patients: number[];
  therapists: number[];
  modules: number[];
}

export interface DashboardKpiTrends {
  users: KpiTrend;
  patients: KpiTrend;
  therapists: KpiTrend;
  modules: KpiTrend;
}

export interface DashboardData {
  counts: DashboardCounts;
  activity: DashboardActivity[];
  tasks: DashboardTask[];
  enrollment: EnrollmentPoint[];
  userSummary: string;
  sparklines: DashboardKpiSeries;
  trends: DashboardKpiTrends;
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

  const sparklines: DashboardKpiSeries = {
    users: buildMonthlyNewSeries(users),
    patients: buildMonthlyNewSeries(patients),
    therapists: buildMonthlyNewSeries(therapists),
    modules: buildMonthlyNewSeries(modules),
  };

  return {
    counts,
    activity: buildRecentActivity(users, patients, therapists),
    tasks: buildPendingTasks(users, patients, therapists),
    enrollment: buildNetworkGrowthSeries(patients, therapists),
    userSummary: userRoleSummary(users),
    sparklines,
    trends: {
      users: monthOverMonthTrend(sparklines.users),
      patients: monthOverMonthTrend(sparklines.patients),
      therapists: monthOverMonthTrend(sparklines.therapists),
      modules: monthOverMonthTrend(sparklines.modules),
    },
  };
}

/** @deprecated Use getDashboardData */
export async function getDashboardCounts(token: string) {
  const { counts } = await getDashboardData(token);
  return counts;
}
