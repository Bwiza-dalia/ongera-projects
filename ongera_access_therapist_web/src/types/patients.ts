import type { PatientStatus } from './dashboard';

export interface PatientProgressEntry {
  exerciseId: string;
  currentLevel: string | null;
  averageScore: number | null;
  lastSessionAt: string | null;
  lastSessionLabel: string | null;
  totalSessions: number;
  streakDays: number;
  totalQuestions: number;
  totalCorrect: number;
  /** Hints (cues) used across completed sessions for this exercise. */
  hintsUsed: number;
}

export interface PatientSession {
  id: string;
  exerciseId: string;
  difficultyLevel: number | null;
  status: string;
  totalQuestions: number;
  questionsCorrect: number;
  questionsWrong: number;
  score: number | null;
  hintsUsed: number;
  durationSeconds: number | null;
  completedAt: string | null;
  completedLabel: string | null;
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
  /** ISO timestamp of the most recent session, when known. */
  lastSessionAt: string | null;
  accuracy: number | null;
  streakDays: number;
  totalSessions: number;
  /** Total hints (API: cues) used across all completed sessions. */
  totalHintsUsed: number;
  /** Average hints per completed session, or null when no sessions. */
  avgHintsPerSession: number | null;
  caregiverName?: string;
  caregiverEmail?: string;
  caregiverPhone?: string;
  caregiverRelationship?: string;
  progressEntries?: PatientProgressEntry[];
  sessions?: PatientSession[];
}
