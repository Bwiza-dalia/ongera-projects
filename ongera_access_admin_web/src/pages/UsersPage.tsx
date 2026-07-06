import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUser, deleteUser, listUsers } from '../services/userService';
import type { ApiCreateUserRequest, ApiUser } from '../types/api';
import '../styles/admin-page.css';

const ROLES: ApiCreateUserRequest['role'][] = ['patient', 'therapist', 'admin'];

export function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<ApiCreateUserRequest>({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'patient',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setUsers(await listUsers(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await createUser(token, form);
      setSuccess('User created.');
      setForm({ email: '', first_name: '', last_name: '', password: '', role: 'patient' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(userId: string) {
    if (!token || !window.confirm('Delete this user?')) return;
    setError('');
    setSuccess('');
    try {
      await deleteUser(token, userId);
      setSuccess('User deleted.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__hero">
        <h1>Users</h1>
        <p>Create and remove platform accounts.</p>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="admin-page__panel">
        <h2>Create user</h2>
        <form onSubmit={handleCreate}>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="user-email">
              Email
            </label>
            <input
              id="user-email"
              className="admin-page__input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="user-first">
              First name
            </label>
            <input
              id="user-first"
              className="admin-page__input"
              required
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="user-last">
              Last name
            </label>
            <input
              id="user-last"
              className="admin-page__input"
              required
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="user-password">
              Password
            </label>
            <input
              id="user-password"
              className="admin-page__input"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="user-role">
              Role
            </label>
            <select
              id="user-role"
              className="admin-page__select"
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as ApiCreateUserRequest['role'] }))
              }
              disabled={submitting}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="admin-page__btn admin-page__btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create user'}
          </button>
        </form>
      </section>

      <section className="admin-page__table-wrap">
        {loading ? (
          <p className="admin-page__empty">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="admin-page__empty">No users yet.</p>
        ) : (
          <table className="admin-page__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.first_name} {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className="admin-page__badge">{user.role}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-page__btn admin-page__btn--danger"
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </button>
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
