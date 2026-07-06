import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPatient, listPatients } from '../services/patientService';
import type { Patient } from '../types/patients';

export function usePatients() {
  const { token } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setPatients([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await listPatients(token);
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { patients, isLoading, error, reload: load };
}

export function usePatientDetail(patientId: string | null) {
  const { token } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientId || !token) {
      setPatient(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError('');

    getPatient(token, patientId)
      .then((data) => {
        if (active) setPatient(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load patient');
          setPatient(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [patientId, token]);

  return { patient, isLoading, error };
}
