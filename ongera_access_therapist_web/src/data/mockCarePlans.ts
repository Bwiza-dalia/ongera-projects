import type { AssignmentRequest } from '../services/assignmentService';
import type { PrescriptionUpload } from '../types/prescription';
import type { Patient } from '../types/patients';

const DEMO_SEED_KEY = 'ongera_care_plans_demo_seeded';

export const demoAssignmentRequests: AssignmentRequest[] = [
  {
    id: 'demo-request-1',
    patientId: 'demo-patient-alice',
    patientName: 'Alice Mukamana',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAtLabel: '2 hours ago',
  },
  {
    id: 'demo-request-2',
    patientId: 'demo-patient-emmanuel',
    patientName: 'Emmanuel Niyonzima',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAtLabel: 'Yesterday',
  },
  {
    id: 'demo-request-3',
    patientId: 'demo-patient-grace',
    patientName: 'Grace Ishimwe',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAtLabel: '4 days ago',
  },
];

export const demoPrescriptions: PrescriptionUpload[] = [
  {
    id: 'demo-rx-1',
    fileName: 'alice-mukamana-prescription.pdf',
    fileType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    patientName: 'Alice Mukamana',
    extracted: {
      patientName: 'Alice Mukamana',
      suggestedModuleType: 'speech',
      suggestedModuleName: 'Speech and Language',
      sessionsPerWeek: 5,
      startDate: '2026-07-14',
      clinicalNotes:
        'Post-stroke aphasia. Focus on naming and comprehension. Begin with market vocabulary at beginner level.',
      rawText: 'Patient: Alice Mukamana\nModule: Speech and Language\n5 sessions per week\nStart date: 2026-07-14',
    },
  },
  {
    id: 'demo-rx-2',
    fileName: 'paul-kabera-referral.txt',
    fileType: 'text/plain',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ready',
    patientId: 'demo-patient-paul',
    patientName: 'Paul Kabera',
    extracted: {
      patientName: 'Paul Kabera',
      suggestedModuleType: 'cognitive',
      suggestedModuleName: 'Cognitive',
      sessionsPerWeek: 3,
      startDate: '2026-07-10',
      clinicalNotes:
        'Mild cognitive impairment. Memory and attention exercises recommended. Caregiver reports difficulty with daily routines.',
      rawText: 'Patient: Paul Kabera\nModule: Cognitive\n3 sessions per week',
    },
  },
  {
    id: 'demo-rx-3',
    fileName: 'marie-uwase-plan.jpg',
    fileType: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'sent',
    patientId: 'demo-patient-marie',
    patientName: 'Marie Uwase',
    extracted: {
      patientName: 'Marie Uwase',
      suggestedModuleType: 'motion',
      suggestedModuleName: 'Motion',
      sessionsPerWeek: 4,
      startDate: '2026-07-01',
      clinicalNotes: 'Gait retraining and coordination. Plan sent to patient app.',
      rawText: 'Uploaded file: marie-uwase-plan.jpg',
    },
  },
];

export function isDemoId(id: string) {
  return id.startsWith('demo-');
}

export function isDemoSeeded() {
  try {
    return localStorage.getItem(DEMO_SEED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markDemoSeeded() {
  try {
    localStorage.setItem(DEMO_SEED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export const demoPatients = [
  { id: 'demo-patient-alice', name: 'Alice Mukamana', status: 'new' as const },
  { id: 'demo-patient-emmanuel', name: 'Emmanuel Niyonzima', status: 'new' as const },
  { id: 'demo-patient-paul', name: 'Paul Kabera', status: 'struggling' as const },
  { id: 'demo-patient-marie', name: 'Marie Uwase', status: 'active' as const },
];

export function demoPatientToPatient(id: string): Patient | null {
  const demo = demoPatients.find((p) => p.id === id);
  if (!demo) return null;

  return {
    id: demo.id,
    userId: demo.id,
    name: demo.name,
    status: demo.status,
    graduationStatus: demo.status === 'new' ? 'PENDING' : 'ACTIVE',
    linkedSince: 'Sample data',
    module: null,
    level: null,
    lastSession: null,
    accuracy: null,
    streakDays: 0,
    sessionsThisWeek: 0,
    totalSessions: 0,
    totalHintsUsed: 0,
    avgHintsPerSession: null,
  };
}

export function getDemoPendingRequests(dismissedIds: string[]): AssignmentRequest[] {
  return demoAssignmentRequests.filter(
    (r) => r.status === 'PENDING' && !dismissedIds.includes(r.id),
  );
}

export function getDemoRequestHistory(dismissedIds: string[]): AssignmentRequest[] {
  return demoAssignmentRequests.filter(
    (r) => r.status !== 'PENDING' || dismissedIds.includes(r.id),
  );
}
