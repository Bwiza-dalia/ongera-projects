import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { caregiverDisplayName, readCaregiver } from '../lib/caregiverUtils';
import { assignTherapist, listPatients } from '../services/patientService';
import { listTherapists } from '../services/therapistService';
import { listUsers } from '../services/userService';
import type { ApiPatientProfile, ApiTherapistProfile, ApiUser } from '../types/api';
import '../styles/admin-page.css';

function therapistLabel(profile: ApiPatientProfile) {
  if (profile.therapist) {
    return `${profile.therapist.first_name} ${profile.therapist.last_name}`.trim();
  }
  return null;
}

export function PatientsPage() {
  const { token } = useAuth();
  const [patients, setPatients] = useState<ApiPatientProfile[]>([]);
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

  function userLabel(userId: string) {
    const user = userById.get(userId);
    if (!user) return userId.slice(0, 8) + '…';
    return `${user.first_name} ${user.last_name}`;
  }

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
        <p>View patient profiles, caregiver info, and therapist assignment status.</p>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="admin-page__table-wrap">
        {loading ? (
          <p className="admin-page__empty">Loading patients…</p>
        ) : patients.length === 0 ? (
          <p className="admin-page__empty">No patient profiles yet.</p>
        ) : (
          <table className="admin-page__table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Caregiver</th>
                <th>Therapist status</th>
                <th>Current therapist</th>
                <th>Assign therapist</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                const caregiver = readCaregiver(p);
                return (
                  <tr key={p.id}>
                    <td>{userLabel(p.user_id)}</td>
                    <td>
                      {caregiverDisplayName(caregiver) ?? '—'}
                      {caregiver?.relationship ? ` (${caregiver.relationship})` : ''}
                    </td>
                    <td>{p.therapist_status ?? '—'}</td>
                    <td>{therapistLabel(p) ?? (p.therapist_id ? userLabel(p.therapist_id) : '—')}</td>
                    <td>
                      <select
                        className="admin-page__select"
                        defaultValue={p.therapist?.user_id ?? p.therapist_id ?? ''}
                        disabled={assigning === p.id}
                        onChange={(e) => handleAssign(p.id, e.target.value)}
                      >
                        <option value="">Select therapist…</option>
                        {verifiedTherapists.map((t) => (
                          <option key={t.id} value={t.user_id}>
                            {userLabel(t.user_id)}
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
