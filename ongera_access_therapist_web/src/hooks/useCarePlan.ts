import { useCallback, useEffect, useState } from 'react';
import { getCarePlan, saveCarePlan } from '../services/carePlanService';
import type { PatientCarePlan } from '../types/carePlan';

export function useCarePlan(patientId: string) {
  const [plan, setPlan] = useState<PatientCarePlan | null>(null);

  const reload = useCallback(() => {
    setPlan(getCarePlan(patientId));
  }, [patientId]);

  useEffect(() => {
    reload();
  }, [reload]);

  function save(next: PatientCarePlan) {
    const saved = saveCarePlan(next);
    setPlan(saved);
    return saved;
  }

  return { plan, reload, save };
}
