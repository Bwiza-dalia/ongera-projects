import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CreateExerciseModal,
  type CreateExerciseForm,
} from '../components/catalog/CreateExerciseModal';
import { ExerciseActionMenu } from '../components/catalog/ExerciseActionMenu';
import { initialsFromName } from '../lib/patientAge';
import { useAuth } from '../context/AuthContext';
import {
  createExercise,
  getModuleWithExercises,
  type DistractorField,
} from '../services/catalogService';
import type { ApiExercise } from '../types/api';
import '../styles/admin-page.css';
import './CatalogPage.css';

const emptyForm = (moduleId: string): CreateExerciseForm => ({
  module_id: moduleId,
  name: '',
  description: '',
  distractor_count: 2,
  distractor_field: 'image_url',
});

type ExerciseRow = ApiExercise & {
  questionTotal: number;
};

export function CatalogModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { token } = useAuth();
  const [moduleName, setModuleName] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateExerciseForm>(emptyForm(moduleId ?? ''));

  const load = useCallback(async () => {
    if (!token || !moduleId) return;
    setLoading(true);
    setError('');
    try {
      // Same enrichment path as therapist getModule.
      const data = await getModuleWithExercises(token, moduleId);
      setModuleName(data.name);
      setModuleDescription(data.description?.trim() ?? '');
      const totals = data.exerciseQuestionTotals ?? {};
      setExercises(
        data.exercises.map((ex) => ({
          ...ex,
          questionTotal: totals[ex.id] ?? 0,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load module');
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, [token, moduleId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (moduleId) setForm(emptyForm(moduleId));
  }, [moduleId]);

  function openModal() {
    if (!moduleId) return;
    setFormError('');
    setForm(emptyForm(moduleId));
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setFormError('');
    if (moduleId) setForm(emptyForm(moduleId));
  }

  function updateField(key: keyof CreateExerciseForm, value: string | number) {
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === 'distractor_field' ? { distractor_field: value as DistractorField } : {}),
    }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !moduleId) return;
    setSubmitting(true);
    setFormError('');
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
      setForm(emptyForm(moduleId));
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create exercise');
    } finally {
      setSubmitting(false);
    }
  }

  if (!moduleId) {
    return <p className="admin-page__error">Missing module ID.</p>;
  }

  return (
    <div className="admin-page catalog-page">
      <Link to="/catalog" className="admin-page__back">
        ← Back to modules
      </Link>

      <header className="catalog-page__hero">
        <div>
          <h1>{moduleName || 'Module'}</h1>
          {moduleDescription ? <p className="catalog-module-page__desc">{moduleDescription}</p> : null}
        </div>
        <button type="button" className="admin-page__cta" onClick={openModal}>
          + Create exercise
        </button>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="catalog-table-card">
        <div className="catalog-table-card__header">
          <h2 className="catalog-table-card__title">Exercises</h2>
        </div>

        {loading ? (
          <p className="admin-page__empty">Loading exercises…</p>
        ) : exercises.length === 0 ? (
          <div className="admin-page__empty-state">
            <h3>No exercises yet</h3>
            <p>Create the first exercise for this module.</p>
            <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openModal}>
              + Create exercise
            </button>
          </div>
        ) : (
          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th>Description</th>
                  <th>Questions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex) => {
                  const viewHref = `/catalog/${moduleId}/exercises/${ex.id}?mode=browse`;
                  const createHref = `/catalog/${moduleId}/exercises/${ex.id}?mode=create`;
                  return (
                    <tr key={ex.id}>
                      <td>
                        <Link to={viewHref} className="catalog-module catalog-module--link">
                          <span className="catalog-module__avatar" aria-hidden="true">
                            {initialsFromName(ex.name)}
                          </span>
                          <p className="catalog-module__name">{ex.name}</p>
                        </Link>
                      </td>
                      <td>
                        {ex.description?.trim() ? (
                          <p className="catalog-desc">{ex.description}</p>
                        ) : (
                          <span className="catalog-muted">—</span>
                        )}
                      </td>
                      <td>{ex.questionTotal}</td>
                      <td>
                        <ExerciseActionMenu viewHref={viewHref} createHref={createHref} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CreateExerciseModal
        open={modalOpen}
        form={form}
        submitting={submitting}
        error={formError}
        onClose={closeModal}
        onChange={updateField}
        onSubmit={handleCreate}
      />
    </div>
  );
}
