import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isApiEnabled } from '../config/api';
import { mockDashboardData } from '../data/mockDashboard';
import { mockNotifications } from '../data/mockNotifications';
import {
  countActivePatients,
  listPatientsWithProgress,
  toPatientRow,
} from '../services/patientService';
import { listIncomingRequests, toPendingReviews } from '../services/assignmentService';
import { resolveTherapistProfileId } from '../services/therapistService';
import { displayName } from '../types/auth';
import type { PatientRow, PendingReview, Notification } from '../types/dashboard';
import type { Patient } from '../types/patients';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function emptySessionsTrend() {
  return WEEK_DAYS.map((day) => ({ day, sessions: 0 }));
}

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

      let reviewsPromise: Promise<PendingReview[]> = Promise.resolve([]);
      if (isApiEnabled() && user) {
        reviewsPromise = resolveTherapistProfileId(token, user.id, displayName(user))
          .then((profileId) => listIncomingRequests(token, profileId))
          .then(toPendingReviews)
          .catch(() => []);
      }

      const [data, reviews] = await Promise.all([patientsPromise, reviewsPromise]);
      setPatients(data);
      if (isApiEnabled()) {
        setPendingReviews(reviews);
      }
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
      pendingReviews: isApiEnabled() ? pendingReviews.length : mockDashboardData.stats.pendingReviews,
      alertsToday: isApiEnabled() ? 0 : mockDashboardData.stats.alertsToday,
    }),
    [patients, pendingReviews],
  );

  const dashboardPendingReviews: PendingReview[] = isApiEnabled()
    ? pendingReviews
    : mockDashboardData.pendingReviews;

  const notifications: Notification[] = isApiEnabled()
    ? mockNotifications.slice(0, 5)
    : mockDashboardData.notifications;

  const sessionsTrend = isApiEnabled()
    ? emptySessionsTrend()
    : mockDashboardData.sessionsTrend;

  return {
    patientRows,
    stats,
    pendingReviews: dashboardPendingReviews,
    notifications,
    sessionsTrend,
    isLoading,
    error,
    reload: load,
  };
}
