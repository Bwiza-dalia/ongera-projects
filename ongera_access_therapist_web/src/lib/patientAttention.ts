import type { PatientRow } from '../types/dashboard';

export interface PatientAttentionItem {
  patientId: string;
  patientName: string;
  reason: string;
  detail?: string;
  priority: 'high' | 'medium';
  lastSession: string | null;
}

function attentionForPatient(patient: PatientRow): PatientAttentionItem | null {
  switch (patient.status) {
    case 'struggling':
      return {
        patientId: patient.id,
        patientName: patient.name,
        reason: 'Accuracy below 50%',
        detail:
          patient.accuracy != null
            ? `${patient.accuracy}% average${patient.module ? ` · ${patient.module}` : ''}`
            : patient.module ?? undefined,
        priority: 'high',
        lastSession: patient.lastSession,
      };
    case 'inactive':
      return {
        patientId: patient.id,
        patientName: patient.name,
        reason: 'No session in 4+ days',
        detail: patient.lastSession ? `Last session ${patient.lastSession}` : 'No sessions logged yet',
        priority: 'high',
        lastSession: patient.lastSession,
      };
    case 'new':
      if (!patient.module) {
        return {
          patientId: patient.id,
          patientName: patient.name,
          reason: 'Needs care plan',
          detail: 'No module assigned yet',
          priority: 'high',
          lastSession: patient.lastSession,
        };
      }
      return {
        patientId: patient.id,
        patientName: patient.name,
        reason: 'New patient',
        detail: `Assigned to ${patient.module}`,
        priority: 'medium',
        lastSession: patient.lastSession,
      };
    default:
      return null;
  }
}

const PRIORITY_ORDER = { high: 0, medium: 1 } as const;

export function buildPatientsNeedingAttention(
  patients: PatientRow[],
  limit = 5,
): PatientAttentionItem[] {
  return patients
    .map(attentionForPatient)
    .filter((item): item is PatientAttentionItem => item !== null)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, limit);
}

export function countPatientsNeedingAttention(patients: PatientRow[]): number {
  return patients.filter((patient) => attentionForPatient(patient) !== null).length;
}
