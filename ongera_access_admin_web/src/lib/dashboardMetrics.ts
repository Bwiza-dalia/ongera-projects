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
  patients: number;
  therapists: number;
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

export function buildEnrollmentSeries(
  patients: ApiPatientSummary[],
  therapists: ApiTherapistProfile[],
  months = 6,
): EnrollmentPoint[] {
  const buckets = buildMonthBuckets(months);
  const series = buckets.map((bucket) => ({
    label: bucket.label,
    patients: 0,
    therapists: 0,
  }));

  for (const patient of patients) {
    const index = countByMonth(patient.created_at, buckets);
    if (index >= 0) series[index].patients += 1;
  }

  for (const therapist of therapists) {
    const index = countByMonth(therapist.created_at, buckets);
    if (index >= 0) series[index].therapists += 1;
  }

  return series;
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

export function enrollmentTrendLabel(series: EnrollmentPoint[]): string {
  if (series.length < 2) return 'No prior month data';

  const current = series[series.length - 1];
  const previous = series[series.length - 2];
  const currentTotal = current.patients + current.therapists;
  const previousTotal = previous.patients + previous.therapists;

  if (previousTotal === 0) {
    return currentTotal > 0
      ? `+${currentTotal} this month (${current.patients} patients, ${current.therapists} therapists)`
      : 'No new enrollments this month';
  }

  const change = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  if (change > 0) return `+${change}% enrollments vs last month`;
  if (change < 0) return `${change}% enrollments vs last month`;
  return 'Same enrollment pace as last month';
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
