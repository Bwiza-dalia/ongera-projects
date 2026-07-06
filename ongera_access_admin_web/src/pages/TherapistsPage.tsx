import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listTherapists, verifyTherapist } from '../services/therapistService';
import { listUsers } from '../services/userService';
import type { ApiTherapistProfile, ApiUser } from '../types/api';
import '../styles/admin-page.css';

export function TherapistsPage() {
  const { token } = useAuth();
  const [therapists, setTherapists] = useState<ApiTherapistProfile[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [t, u] = await Promise.all([listTherapists(token), listUsers(token)]);
      setTherapists(t);
      setUsers(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load therapists');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleVerify(profileId: string) {
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await verifyTherapist(token, profileId);
      setSuccess('Therapist verified.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify therapist');
    }
  }

  function therapistName(userId: string) {
    const user = userById.get(userId);
    if (!user) return userId.slice(0, 8) + '…';
    return `${user.first_name} ${user.last_name}`;
  }

  return (
    <div className="admin-page">
      <header className="admin-page__hero">
        <h1>Therapists</h1>
        <p>Review therapist profiles and verify accounts.</p>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="admin-page__table-wrap">
        {loading ? (
          <p className="admin-page__empty">Loading therapists…</p>
        ) : therapists.length === 0 ? (
          <p className="admin-page__empty">No therapist profiles yet.</p>
        ) : (
          <table className="admin-page__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Affiliation</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {therapists.map((t) => (
                <tr key={t.id}>
                  <td>{therapistName(t.user_id)}</td>
                  <td>{t.affiliation ?? '—'}</td>
                  <td>
                    <span
                      className={
                        t.is_verified
                          ? 'admin-page__badge admin-page__badge--verified'
                          : 'admin-page__badge'
                      }
                    >
                      {t.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {!t.is_verified && (
                      <button
                        type="button"
                        className="admin-page__btn admin-page__btn--primary"
                        onClick={() => handleVerify(t.id)}
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
