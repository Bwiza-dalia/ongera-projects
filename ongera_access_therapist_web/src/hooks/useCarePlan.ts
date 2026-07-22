import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  deleteCarePlan,
  fetchActiveCarePlanFromApi,
  getCarePlan,
  saveCarePlan,
} from '../services/carePlanService';
import type { PatientCarePlan } from '../types/carePlan';

export function useCarePlan(patientId: string, patientName?: string) {
  const { token } = useAuth();
  const [plan, setPlan] = useState<PatientCarePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const local = getCarePlan(patientId);

      if (!token) {
        setPlan(local);
        return;
      }

      let apiPlan: PatientCarePlan | null = null;
      try {
        apiPlan = await fetchActiveCarePlanFromApi(token, patientId, patientName);
      } catch {
        apiPlan = null;
      }

      if (apiPlan) {
        // Prefer a locally authored active plan (includes schedule/notes) when present.
        if (local?.status === 'active' && local.modules.length > 0) {
          setPlan(local);
        } else {
          setPlan(apiPlan);
        }
        return;
      }

      // API has no assigned modules — drop a stale "active" local plan.
      if (local?.status === 'active') {
        deleteCarePlan(patientId);
        setPlan(null);
        return;
      }

      setPlan(local);
    } finally {
      setLoading(false);
    }
  }, [patientId, patientName, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function save(next: PatientCarePlan) {
    const saved = saveCarePlan(next);
    setPlan(saved);
    return saved;
  }

  return { plan, loading, reload, save };
}
