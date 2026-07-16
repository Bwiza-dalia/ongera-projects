import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { buildPatientsNeedingAttention } from '../lib/patientAttention';
import { listIncomingRequests, toPendingReviews } from '../services/assignmentService';
import {
  countActivePatients,
  listPatientsWithProgress,
  toPatientRow,
} from '../services/patientService';
import { resolveTherapistProfileId } from '../services/therapistService';
import { displayName } from '../types/auth';
import type { PatientRow, PendingReview } from '../types/dashboard';
import type { Patient } from '../types/patients';

export function useDashboardData() {
  const { token, user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || !user) {
      setPatients([]);
      setPendingReviews([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const patientsPromise = listPatientsWithProgress(token);
      const reviewsPromise = resolveTherapistProfileId(token, user.id, displayName(user))
        .then((profileId) => listIncomingRequests(token, profileId))
        .then(toPendingReviews)
        .catch(() => [] as PendingReview[]);

      const [data, reviews] = await Promise.all([patientsPromise, reviewsPromise]);
      setPatients(data);
      setPendingReviews(reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setPatients([]);
      setPendingReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    load();
  }, [load]);

  const patientRows: PatientRow[] = useMemo(
    () => patients.map(toPatientRow),
    [patients],
  );

  const stats = useMemo(() => {
    const rows = patients.map(toPatientRow);
    const withAccuracy = rows.filter((p) => p.accuracy != null);
    const avgAccuracy =
      withAccuracy.length > 0
        ? Math.round(
            withAccuracy.reduce((sum, p) => sum + (p.accuracy ?? 0), 0) / withAccuracy.length,
          )
        : null;

    return {
      totalPatients: patients.length,
      activePatients: countActivePatients(patients),
      pendingRequests: pendingReviews.length,
      needingAttention: buildPatientsNeedingAttention(rows).length,
      avgAccuracy,
    };
  }, [patients, pendingReviews]);

  return {
    patientRows,
    pendingReviews,
    stats,
    isLoading,
    error,
    reload: load,
  };
}
