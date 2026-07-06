export type PatientStatus = 'active' | 'inactive' | 'struggling' | 'new';

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  pendingReviews: number;
  alertsToday: number;
}

export interface PendingReview {
  id: string;
  patientName: string;
  reason: string;
  module?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  patientName: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  read: boolean;
}

export interface PatientRow {
  id: string;
  name: string;
  status: PatientStatus;
  lastSession: string | null;
  accuracy: number | null;
  module: string | null;
  streakDays: number;
}

export interface DashboardData {
  therapist: { name: string; specialty: string };
  stats: DashboardStats;
  accuracyTrend: { day: string; accuracy: number }[];
  sessionsTrend: { day: string; sessions: number }[];
  pendingReviews: PendingReview[];
  notifications: Notification[];
  patients: PatientRow[];
}
