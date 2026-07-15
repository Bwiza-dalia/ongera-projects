import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createModule, listModules } from '../services/catalogService';
import type { ApiModule } from '../types/api';
import '../styles/admin-page.css';

export function CatalogPage() {
  const { token } = useAuth();
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setModules(await listModules(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modules');
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
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await createModule(token, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      setSuccess('Module created.');
      setForm({ name: '', description: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create module');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__hero">
        <h1>Catalog</h1>
        <p>Modules, exercises, and words.</p>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="admin-page__panel">
        <h2>Create module</h2>
        <form onSubmit={handleCreate}>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="mod-name">
              Name
            </label>
            <input
              id="mod-name"
              className="admin-page__input"
              required
              maxLength={150}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="mod-desc">
              Description
            </label>
            <textarea
              id="mod-desc"
              className="admin-page__textarea"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <button type="submit" className="admin-page__btn admin-page__btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create module'}
          </button>
        </form>
      </section>

      <section className="admin-page__table-wrap">
        {loading ? (
          <p className="admin-page__empty">Loading modules…</p>
        ) : modules.length === 0 ? (
          <p className="admin-page__empty">No modules yet. Create one above.</p>
        ) : (
          <table className="admin-page__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod.id}>
                  <td>{mod.name}</td>
                  <td>{mod.description ?? '—'}</td>
                  <td>
                    <Link to={`/catalog/${mod.id}`} className="admin-page__btn">
                      Open
                    </Link>
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
