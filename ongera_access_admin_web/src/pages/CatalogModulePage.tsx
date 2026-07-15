import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { asArray } from '../lib/asArray';
import { useAuth } from '../context/AuthContext';
import {
  createExercise,
  DISTRACTOR_FIELD_OPTIONS,
  getModule,
  type DistractorField,
} from '../services/catalogService';
import type { ApiExercise, ApiModuleWithExercises } from '../types/api';
import '../styles/admin-page.css';

export function CatalogModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { token } = useAuth();
  const [module, setModule] = useState<ApiModuleWithExercises | null>(null);
  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    distractor_count: 2,
    distractor_field: 'image_url' as DistractorField,
  });

  const load = useCallback(async () => {
    if (!token || !moduleId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getModule(token, moduleId);
      setModule(data);
      setExercises(asArray(data.exercises));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load module');
    } finally {
      setLoading(false);
    }
  }, [token, moduleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !moduleId) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await createExercise(token, moduleId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        distractor_count: form.distractor_count,
        distractor_field: form.distractor_field,
      });
      setSuccess('Exercise created.');
      setForm({ name: '', description: '', distractor_count: 2, distractor_field: 'image_url' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exercise');
    } finally {
      setSubmitting(false);
    }
  }

  if (!moduleId) {
    return <p className="admin-page__error">Missing module ID.</p>;
  }

  return (
    <div className="admin-page">
      <Link to="/catalog" className="admin-page__back">
        ← Back to catalog
      </Link>

      <header className="admin-page__hero">
        <h1>{module?.name ?? 'Module'}</h1>
        <p>{module?.description ?? 'Exercises in this module.'}</p>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="admin-page__panel">
        <h2>Add exercise</h2>
        <form onSubmit={handleCreate}>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="ex-name">
              Name
            </label>
            <input
              id="ex-name"
              className="admin-page__input"
              required
              maxLength={150}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="ex-desc">
              Description
            </label>
            <textarea
              id="ex-desc"
              className="admin-page__textarea"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__grid admin-page__grid--2">
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="ex-distractors">
                Wrong answers per question
              </label>
              <input
                id="ex-distractors"
                type="number"
                min={1}
                max={5}
                className="admin-page__input"
                value={form.distractor_count}
                onChange={(e) =>
                  setForm((f) => ({ ...f, distractor_count: Number(e.target.value) }))
                }
                disabled={submitting}
                required
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="ex-field">
                Answer shown as
              </label>
              <select
                id="ex-field"
                className="admin-page__select"
                value={form.distractor_field}
                onChange={(e) =>
                  setForm((f) => ({ ...f, distractor_field: e.target.value as DistractorField }))
                }
                disabled={submitting}
              >
                {DISTRACTOR_FIELD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="admin-page__btn admin-page__btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create exercise'}
          </button>
        </form>
      </section>

      <section className="admin-page__table-wrap">
        {loading ? (
          <p className="admin-page__empty">Loading exercises…</p>
        ) : exercises.length === 0 ? (
          <p className="admin-page__empty">No exercises yet.</p>
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
              {exercises.map((ex) => (
                <tr key={ex.id}>
                  <td>{ex.name}</td>
                  <td>{ex.description ?? '—'}</td>
                  <td>
                    <Link
                      to={`/catalog/${moduleId}/exercises/${ex.id}`}
                      className="admin-page__btn"
                    >
                      Questions
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
