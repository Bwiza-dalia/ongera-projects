import type { PatientStatus } from './dashboard';

export interface PatientProgressEntry {
  exerciseId: string;
  currentLevel: string | null;
  averageScore: number | null;
  lastSessionAt: string | null;
  lastSessionLabel: string | null;
  totalSessions: number;
  streakDays: number;
}

export interface Patient {
  id: string;
  userId: string;
  name: string;
  status: PatientStatus;
  graduationStatus: string;
  therapistStatus?: string;
  therapistName?: string | null;
  linkedSince: string;
  module: string | null;
  level: string | null;
  lastSession: string | null;
  accuracy: number | null;
  streakDays: number;
  sessionsThisWeek: number | null;
  totalSessions: number;
  caregiverName?: string;
  caregiverEmail?: string;
  caregiverPhone?: string;
  caregiverRelationship?: string;
  progressEntries?: PatientProgressEntry[];
}
