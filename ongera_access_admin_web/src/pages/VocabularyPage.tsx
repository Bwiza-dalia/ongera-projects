import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreateVocabularyModal,
  type CreateVocabularyForm,
} from '../components/vocabulary/CreateVocabularyModal';
import { ImportVocabularyModal } from '../components/vocabulary/ImportVocabularyModal';
import { Pagination, usePagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { createVocabularyItem, listVocabulary, uploadVocabularyImage } from '../services/catalogService';
import type { ApiVocabularyItem } from '../types/api';
import '../styles/admin-page.css';
import './VocabularyPage.css';

const emptyForm: CreateVocabularyForm = {
  word: '',
  english_translation: '',
  difficulty_level: 1,
  audio_model_url: '',
  image_url: '',
};

export function VocabularyPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ApiVocabularyItem[]>([]);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [importError, setImportError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data =
        filter === 'all'
          ? await listVocabulary(token)
          : await listVocabulary(token, filter as 1 | 2 | 3);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.word.toLowerCase().includes(query) ||
        (item.english_translation ?? '').toLowerCase().includes(query),
    );
  }, [items, search]);

  const pagination = usePagination(filteredItems, 10, `${search}|${filter}`);

  function openCreate() {
    setFormError('');
    setCreateOpen(true);
  }

  function closeCreate() {
    if (submitting || uploadingImage) return;
    setCreateOpen(false);
    setFormError('');
    setForm(emptyForm);
  }

  function openImport() {
    setImportError('');
    setImportOpen(true);
  }

  function closeImport() {
    if (importing) return;
    setImportOpen(false);
    setImportError('');
    setImportJson('');
  }

  function updateField(key: keyof CreateVocabularyForm, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleUploadImage(file: File) {
    if (!token) return;
    setUploadingImage(true);
    setFormError('');
    try {
      const { url } = await uploadVocabularyImage(token, file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setFormError('');
    setError('');
    setSuccess('');
    try {
      await createVocabularyItem(token, {
        word: form.word.trim(),
        english_translation: form.english_translation.trim(),
        difficulty_level: form.difficulty_level,
        audio_model_url: form.audio_model_url.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
      });
      setSuccess('Vocabulary item created.');
      setForm(emptyForm);
      setCreateOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create vocabulary item');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkImport() {
    if (!token) return;
    setImporting(true);
    setImportError('');
    setError('');
    setSuccess('');
    try {
      const parsed = JSON.parse(importJson) as unknown;
      const rawItems = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown }).items)
          ? (parsed as { items: unknown[] }).items
          : null;

      if (!rawItems?.length) {
        throw new Error('Paste JSON with an "items" array or a raw array of vocabulary objects.');
      }

      let created = 0;
      for (const entry of rawItems) {
        if (!entry || typeof entry !== 'object') continue;
        const row = entry as Record<string, unknown>;
        const word = String(row.word ?? '').trim();
        const english = String(row.english_translation ?? '').trim();
        if (!word || !english) continue;

        const level = Number(row.difficulty_level ?? 1);
        if (level < 1 || level > 3) continue;

        await createVocabularyItem(token, {
          word,
          english_translation: english,
          difficulty_level: level as 1 | 2 | 3,
          audio_model_url: String(row.audio_model_url ?? '').trim() || undefined,
          image_url: String(row.image_url ?? '').trim() || undefined,
        });
        created++;
      }

      if (created === 0) {
        throw new Error('No valid items found. Each entry needs word and english_translation.');
      }

      setSuccess(`Imported ${created} vocabulary item${created === 1 ? '' : 's'}.`);
      setImportJson('');
      setImportOpen(false);
      await load();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import vocabulary');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="admin-page vocab-page">
      <header className="admin-page__hero admin-page__hero--row">
        <h1>Vocabulary</h1>
        <div className="vocab-page__actions">
          <button type="button" className="vocab-page__cta-secondary" onClick={openImport}>
            Import JSON
          </button>
          <button type="button" className="admin-page__cta" onClick={openCreate}>
            + Create item
          </button>
        </div>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="vocab-table-card">
        <div className="vocab-table-card__header">
          <h2 className="vocab-table-card__title">All words</h2>
          <div className="vocab-table-card__controls">
            <label className="vocab-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Search words…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search vocabulary"
              />
            </label>
            <select
              className="vocab-filter"
              value={filter}
              onChange={(e) => {
                const value = e.target.value;
                setFilter(value === 'all' ? 'all' : Number(value));
              }}
              aria-label="Filter by level"
            >
              <option value="all">All levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="admin-page__empty">Loading vocabulary…</p>
        ) : items.length === 0 ? (
          <div className="admin-page__empty-state">
            <h3>No vocabulary items yet</h3>
            <p>Create a word or import a JSON list to get started.</p>
            <div className="vocab-page__actions vocab-page__actions--center">
              <button type="button" className="admin-page__btn" onClick={openImport}>
                Import JSON
              </button>
              <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openCreate}>
                + Create item
              </button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="admin-page__empty">No words match your filters.</p>
        ) : (
          <>
            <div className="vocab-table-wrap">
              <table className="vocab-table">
                <caption className="admin-page__sr-only">
                  Vocabulary words with image, Kinyarwanda, English translation, and audio
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Image</th>
                    <th scope="col">Kinyarwanda</th>
                    <th scope="col">English</th>
                    <th scope="col">Audio</th>
                    <th scope="col">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.pageItems.map((item) => {
                    const level = item.difficulty_level ?? 1;
                    const english = item.english_translation?.trim() || '';
                    const imageAlt = english
                      ? `Image for ${item.word} (${english})`
                      : `Image for ${item.word}`;
                    return (
                      <tr key={item.id}>
                        <td className="vocab-table__image">
                          {item.image_url ? (
                            <img
                              className="vocab-thumb"
                              src={item.image_url}
                              alt={imageAlt}
                              loading="lazy"
                            />
                          ) : (
                            <span className="vocab-thumb vocab-thumb--empty">
                              <span className="admin-page__sr-only">No image for {item.word}</span>
                              <span aria-hidden="true">{item.word.slice(0, 1).toUpperCase()}</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <p className="vocab-word__text">{item.word}</p>
                        </td>
                        <td>
                          {english ? english : <span className="vocab-muted">—</span>}
                        </td>
                        <td>
                          {item.audio_model_url ? (
                            <audio
                              className="vocab-audio"
                              src={item.audio_model_url}
                              controls
                              preload="none"
                              aria-label={`Audio pronunciation for ${item.word}`}
                            >
                              Your browser does not support audio playback.
                            </audio>
                          ) : (
                            <span className="vocab-muted">No audio</span>
                          )}
                        </td>
                        <td>
                          <span className={`vocab-level vocab-level--${level}`}>Level {level}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              total={pagination.total}
              onPageChange={pagination.setPage}
              itemLabel="words"
            />
          </>
        )}
      </section>

      <CreateVocabularyModal
        open={createOpen}
        form={form}
        submitting={submitting}
        uploadingImage={uploadingImage}
        error={formError}
        onClose={closeCreate}
        onChange={updateField}
        onSubmit={handleCreate}
        onUploadImage={handleUploadImage}
      />

      <ImportVocabularyModal
        open={importOpen}
        importJson={importJson}
        importing={importing}
        error={importError}
        onClose={closeImport}
        onChange={setImportJson}
        onImport={handleBulkImport}
      />
    </div>
  );
}
