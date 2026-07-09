import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { caregiverDisplayName, readCaregiver } from '../lib/caregiverUtils';
import {
  patientTherapistStatus,
  resolvePatientName,
  therapistUserLabel,
} from '../lib/patientUtils';
import { assignTherapist, listPatients } from '../services/patientService';
import { listTherapists } from '../services/therapistService';
import { listUsers } from '../services/userService';
import type { ApiPatientSummary, ApiTherapistProfile, ApiUser } from '../types/api';
import '../styles/admin-page.css';

export function PatientsPage() {
  const { token } = useAuth();
  const [patients, setPatients] = useState<ApiPatientSummary[]>([]);
  const [therapists, setTherapists] = useState<ApiTherapistProfile[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const verifiedTherapists = useMemo(
    () => therapists.filter((t) => t.is_verified),
    [therapists],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [p, t, u] = await Promise.all([
        listPatients(token),
        listTherapists(token),
        listUsers(token),
      ]);
      setPatients(p);
      setTherapists(t);
      setUsers(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAssign(patientId: string, therapistUserId: string) {
    if (!token || !therapistUserId) return;
    setAssigning(patientId);
    setError('');
    setSuccess('');
    try {
      await assignTherapist(token, patientId, therapistUserId);
      setSuccess('Therapist assigned.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign therapist');
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__hero">
        <h1>Patients</h1>
        <p>Assign verified therapists to patient profiles.</p>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="admin-page__table-wrap">
        {loading ? (
          <p className="admin-page__empty">Loading…</p>
        ) : patients.length === 0 ? (
          <p className="admin-page__empty">No patients yet.</p>
        ) : (
          <table className="admin-page__table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Caregiver</th>
                <th>Status</th>
                <th>Therapist</th>
                <th>Assign</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                const caregiver = readCaregiver(p);
                const therapistUserId = p.therapist_id ?? '';
                return (
                  <tr key={p.id}>
                    <td>{resolvePatientName(p, userById)}</td>
                    <td>{p.email ?? userById.get(p.user_id)?.email ?? '—'}</td>
                    <td>
                      {caregiverDisplayName(caregiver) ?? '—'}
                      {caregiver?.relationship ? ` (${caregiver.relationship})` : ''}
                    </td>
                    <td>{patientTherapistStatus(p)}</td>
                    <td>
                      {therapistUserId ? therapistUserLabel(therapistUserId, userById) : '—'}
                    </td>
                    <td>
                      <select
                        className="admin-page__select"
                        defaultValue={therapistUserId}
                        disabled={assigning === p.id}
                        onChange={(e) => handleAssign(p.id, e.target.value)}
                      >
                        <option value="">Select…</option>
                        {verifiedTherapists.map((t) => (
                          <option key={t.id} value={t.user_id}>
                            {therapistUserLabel(t.user_id, userById)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
