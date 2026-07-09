import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isApiEnabled } from '../config/api';
import { mockDashboardData } from '../data/mockDashboard';
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
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>(
    isApiEnabled() ? [] : mockDashboardData.pendingReviews,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setPatients([]);
      setPendingReviews([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const patientsPromise = listPatientsWithProgress(token);

      let reviewsPromise: Promise<PendingReview[]> = Promise.resolve(
        isApiEnabled() ? [] : mockDashboardData.pendingReviews,
      );
      if (isApiEnabled() && user) {
        reviewsPromise = resolveTherapistProfileId(token, user.id, displayName(user))
          .then((profileId) => listIncomingRequests(token, profileId))
          .then(toPendingReviews)
          .catch(() => []);
      }

      const [data, reviews] = await Promise.all([patientsPromise, reviewsPromise]);
      setPatients(data);
      setPendingReviews(reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setPatients([]);
      if (isApiEnabled()) {
        setPendingReviews([]);
      }
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

  const stats = useMemo(
    () => ({
      totalPatients: patients.length,
      activePatients: countActivePatients(patients),
    }),
    [patients],
  );

  return {
    patientRows,
    pendingReviews,
    stats,
    isLoading,
    error,
    reload: load,
  };
}
