import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Pagination, usePagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { createTherapist, listTherapists, verifyTherapist } from '../services/therapistService';
import { listUsers } from '../services/userService';
import type { ApiTherapistProfile, ApiUser } from '../types/api';
import '../styles/admin-page.css';

const emptyForm = {
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  location: '',
  affiliation: '',
  specialty: '',
};

export function TherapistsPage() {
  const { token } = useAuth();
  const [therapists, setTherapists] = useState<ApiTherapistProfile[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const therapistsPagination = usePagination(therapists, 10);

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

  function updateField(key: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await createTherapist({
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        location: form.location.trim() || undefined,
        affiliation: form.affiliation.trim() || undefined,
        specialty: form.specialty.trim() || undefined,
      });
      setSuccess('Therapist created. Verify the account below before they can accept patients.');
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create therapist');
    } finally {
      setSubmitting(false);
    }
  }

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
        <p>Create therapist accounts and verify them before they can accept patients.</p>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="admin-page__panel">
        <h2>Create therapist</h2>
        <form onSubmit={handleCreate}>
          <div className="admin-page__grid admin-page__grid--2">
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-email">
                Email
              </label>
              <input
                id="therapist-email"
                className="admin-page__input"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-password">
                Password
              </label>
              <PasswordInput
                id="therapist-password"
                className="admin-page__input"
                wrapClassName="admin-page__password-wrap"
                toggleClassName="admin-page__toggle"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-first">
                First name
              </label>
              <input
                id="therapist-first"
                className="admin-page__input"
                required
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-last">
                Last name
              </label>
              <input
                id="therapist-last"
                className="admin-page__input"
                required
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-affiliation">
                Affiliation <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="therapist-affiliation"
                className="admin-page__input"
                value={form.affiliation}
                onChange={(e) => updateField('affiliation', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-specialty">
                Specialty <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="therapist-specialty"
                className="admin-page__input"
                value={form.specialty}
                onChange={(e) => updateField('specialty', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="therapist-location">
                Location <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="therapist-location"
                className="admin-page__input"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="admin-page__btn admin-page__btn--primary"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create therapist'}
          </button>
        </form>
      </section>

      <section className="admin-page__table-wrap">
        {loading ? (
          <p className="admin-page__empty">Loading…</p>
        ) : therapists.length === 0 ? (
          <p className="admin-page__empty">No therapists yet.</p>
        ) : (
          <table className="admin-page__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Affiliation</th>
                <th>Specialty</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {therapistsPagination.pageItems.map((t) => {
                const user = userById.get(t.user_id);
                return (
                  <tr key={t.id}>
                    <td>{therapistName(t.user_id)}</td>
                    <td>{user?.email ?? '—'}</td>
                    <td>{t.affiliation ?? '—'}</td>
                    <td>{t.specialty ?? '—'}</td>
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
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && therapists.length > 0 && (
          <Pagination
            page={therapistsPagination.page}
            pageCount={therapistsPagination.pageCount}
            rangeStart={therapistsPagination.rangeStart}
            rangeEnd={therapistsPagination.rangeEnd}
            total={therapistsPagination.total}
            onPageChange={therapistsPagination.setPage}
            itemLabel="therapists"
          />
        )}
      </section>
    </div>
  );
}
