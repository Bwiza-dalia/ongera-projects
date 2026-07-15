import { resolvePatientName } from './patientUtils';
import { timeAgo } from './timeAgo';
import type { ApiPatientSummary, ApiTherapistProfile, ApiUser } from '../types/api';

export interface DashboardActivity {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  sortKey: number;
}

export interface DashboardTask {
  id: string;
  title: string;
  detail: string;
  to: string;
}

export interface GrowthPoint {
  label: string;
  value: number;
}

export interface EnrollmentPoint {
  label: string;
  /** Cumulative patients in the network at the end of this month. */
  patients: number;
  /** Cumulative therapists in the network at the end of this month. */
  therapists: number;
  /** Patients who joined during this month. */
  patientsNew?: number;
  /** Therapists who joined during this month. */
  therapistsNew?: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildMonthBuckets(months: number) {
  const now = new Date();
  const buckets: { label: string; start: Date; end: Date }[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    buckets.push({
      label: MONTH_LABELS[date.getMonth()],
      start,
      end,
    });
  }

  return buckets;
}

function countByMonth(createdAt: string | undefined, buckets: ReturnType<typeof buildMonthBuckets>) {
  if (!createdAt) return -1;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return -1;

  for (let i = 0; i < buckets.length; i += 1) {
    if (created >= buckets[i].start && created <= buckets[i].end) return i;
  }
  return -1;
}

function createdOnOrBefore(createdAt: string | undefined, end: Date): boolean {
  // Undated records are treated as already part of the network, so the final
  // point always matches the real total shown in the KPI cards.
  if (!createdAt) return true;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return true;
  return created.getTime() <= end.getTime();
}

function createdWithin(createdAt: string | undefined, start: Date, end: Date): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return created >= start && created <= end;
}

/**
 * Cumulative size of the care network at the end of each month — the running
 * total of patients and therapists, ending at the current totals. This tells a
 * clearer "growth" story than counting only that month's new signups.
 */
export function buildNetworkGrowthSeries(
  patients: ApiPatientSummary[],
  therapists: ApiTherapistProfile[],
  months = 6,
): EnrollmentPoint[] {
  const buckets = buildMonthBuckets(months);

  return buckets.map((bucket) => ({
    label: bucket.label,
    patients: patients.filter((p) => createdOnOrBefore(p.created_at, bucket.end)).length,
    therapists: therapists.filter((t) => createdOnOrBefore(t.created_at, bucket.end)).length,
    patientsNew: patients.filter((p) => createdWithin(p.created_at, bucket.start, bucket.end)).length,
    therapistsNew: therapists.filter((t) => createdWithin(t.created_at, bucket.start, bucket.end))
      .length,
  }));
}

/** Short summary of current network size and new members this month. */
export function networkGrowthLabel(series: EnrollmentPoint[]): string {
  if (series.length === 0) return 'No network data yet';
  const last = series[series.length - 1];
  const total = last.patients + last.therapists;
  if (total === 0) return 'No members yet';
  const joined = (last.patientsNew ?? 0) + (last.therapistsNew ?? 0);
  const base = `${total} in care network · ${last.patients} patients, ${last.therapists} therapists`;
  return joined > 0 ? `${base} · +${joined} this month` : base;
}

export function buildGrowthSeries(users: ApiUser[], months = 6): GrowthPoint[] {
  const buckets = buildMonthBuckets(months);
  const series = buckets.map((bucket) => ({ label: bucket.label, value: 0 }));

  for (const user of users) {
    const index = countByMonth(user.created_at, buckets);
    if (index >= 0) series[index].value += 1;
  }

  return series;
}

export function userRoleSummary(users: ApiUser[]): string {
  const patients = users.filter((u) => u.role === 'patient').length;
  const therapists = users.filter((u) => u.role === 'therapist').length;
  const admins = users.filter((u) => u.role === 'admin').length;
  const parts = [`${patients} patients`, `${therapists} therapists`];
  if (admins > 0) parts.push(`${admins} admins`);
  return parts.join(' · ');
}

export function buildRecentActivity(
  users: ApiUser[],
  patients: ApiPatientSummary[],
  therapists: ApiTherapistProfile[],
): DashboardActivity[] {
  const userById = new Map(users.map((u) => [u.id, u]));
  const events: DashboardActivity[] = [];

  for (const user of users) {
    if (!user.created_at) continue;
    events.push({
      id: `user-${user.id}`,
      title: 'New account created',
      detail: `${user.first_name} ${user.last_name} · ${user.role}`,
      timeLabel: timeAgo(user.created_at),
      sortKey: new Date(user.created_at).getTime(),
    });
  }

  for (const patient of patients) {
    if (!patient.created_at) continue;
    events.push({
      id: `patient-${patient.id}`,
      title: 'New patient registered',
      detail: resolvePatientName(patient, userById),
      timeLabel: timeAgo(patient.created_at),
      sortKey: new Date(patient.created_at).getTime(),
    });
  }

  for (const therapist of therapists) {
    if (!therapist.created_at) continue;
    const user = userById.get(therapist.user_id);
    const name = user ? `${user.first_name} ${user.last_name}` : 'Therapist';
    events.push({
      id: `therapist-${therapist.id}`,
      title: therapist.is_verified ? 'Therapist profile active' : 'Therapist awaiting verification',
      detail: `${name}${therapist.specialty ? ` · ${therapist.specialty}` : ''}`,
      timeLabel: timeAgo(therapist.created_at),
      sortKey: new Date(therapist.created_at).getTime(),
    });
  }

  return events.sort((a, b) => b.sortKey - a.sortKey).slice(0, 8);
}

export function buildPendingTasks(
  users: ApiUser[],
  patients: ApiPatientSummary[],
  therapists: ApiTherapistProfile[],
): DashboardTask[] {
  const userById = new Map(users.map((u) => [u.id, u]));
  const tasks: DashboardTask[] = [];

  for (const therapist of therapists.filter((t) => !t.is_verified)) {
    const user = userById.get(therapist.user_id);
    const name = user ? `${user.first_name} ${user.last_name}` : 'Therapist';
    tasks.push({
      id: `verify-${therapist.id}`,
      title: `Verify ${name}`,
      detail: therapist.affiliation ?? 'Review therapist application',
      to: '/therapists',
    });
  }

  for (const patient of patients.filter((p) => !p.therapist_id)) {
    tasks.push({
      id: `assign-${patient.id}`,
      title: `Assign therapist to ${resolvePatientName(patient, userById)}`,
      detail: 'No therapist linked yet',
      to: '/patients',
    });
  }

  return tasks.slice(0, 8);
}

export function growthTrendLabel(series: GrowthPoint[]): string {
  if (series.length < 2) return 'No prior month data';

  const current = series[series.length - 1]?.value ?? 0;
  const previous = series[series.length - 2]?.value ?? 0;

  if (previous === 0) {
    return current > 0 ? `+${current} this month` : 'No signups this month';
  }

  const change = Math.round(((current - previous) / previous) * 100);
  if (change > 0) return `+${change}% from last month`;
  if (change < 0) return `${change}% from last month`;
  return 'Same as last month';
}
