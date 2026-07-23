import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mapApiWeeklyReport, buildCaseloadWeekStats } from '../lib/mapWeeklyReport';
import { listPatientsWithProgress } from '../services/patientService';
import { getPatientWeeklyReport } from '../services/reportService';
import type { Patient } from '../types/patients';
import type { WeekRange, WeeklyReport } from '../types/reports';

export function useWeeklyCaseloadReports(week: WeekRange) {
  const { token } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setPatients([]);
      setReports([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const patientList = await listPatientsWithProgress(token);
      setPatients(patientList);

      const weekly = await Promise.all(
        patientList.map(async (patient) => {
          try {
            const apiReport = await getPatientWeeklyReport(
              token,
              patient.id,
              week.startKey,
            );
            return mapApiWeeklyReport(patient, week, apiReport);
          } catch {
            // Patient still appears in the caseload table with zero activity if the
            // weekly endpoint fails (e.g. no data for that week).
            return mapApiWeeklyReport(patient, week, null);
          }
        }),
      );

      weekly.sort((a, b) => {
        if (b.sessionsCompleted !== a.sessionsCompleted) {
          return b.sessionsCompleted - a.sessionsCompleted;
        }
        return a.patientName.localeCompare(b.patientName);
      });
      setReports(weekly);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weekly reports');
      setPatients([]);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, week]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => buildCaseloadWeekStats(reports), [reports]);

  return {
    patients,
    reports,
    stats,
    isLoading,
    error,
    reload: load,
  };
}
