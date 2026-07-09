export type PrescriptionStatus = 'pending' | 'ready' | 'sent';

export interface ExtractedPrescriptionInfo {
  patientName?: string;
  suggestedModuleType?: 'speech' | 'cognitive' | 'motion';
  suggestedModuleName?: string;
  sessionsPerWeek?: number;
  startDate?: string;
  clinicalNotes?: string;
  rawText?: string;
}

export interface PrescriptionUpload {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  status: PrescriptionStatus;
  patientId?: string;
  patientName?: string;
  extracted: ExtractedPrescriptionInfo;
}

export interface CarePlanDraftPrefill {
  moduleId?: string;
  moduleName?: string;
  startDate?: string;
  sessionsPerWeek?: number;
  clinicalNotes?: string;
  sourceType?: 'request' | 'prescription';
  sourceId?: string;
}
