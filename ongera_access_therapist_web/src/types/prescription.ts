/** Prefill when opening the care-plan builder after accepting a request. */
export interface CarePlanDraftPrefill {
  moduleId?: string;
  moduleName?: string;
  startDate?: string;
  sessionsPerWeek?: number;
  clinicalNotes?: string;
  sourceType?: 'request' | 'manual';
  sourceId?: string;
}
