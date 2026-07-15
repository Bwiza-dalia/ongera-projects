import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createVocabularyItem, listVocabulary, uploadVocabularyImage } from '../services/catalogService';
import type { ApiVocabularyItem } from '../types/api';
import '../styles/admin-page.css';

const DIFFICULTY_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
] as const;

const VOCAB_PAGE_SIZE = 10;

export function VocabularyPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ApiVocabularyItem[]>([]);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [pageByLevel, setPageByLevel] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [form, setForm] = useState({
    word: '',
    english_translation: '',
    difficulty_level: 1 as 1 | 2 | 3,
    audio_model_url: '',
    image_url: '',
  });

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

  const grouped = useMemo(() => {
    const map = new Map<number, ApiVocabularyItem[]>();
    for (const item of filteredItems) {
      const level = item.difficulty_level ?? 1;
      const list = map.get(level) ?? [];
      list.push(item);
      map.set(level, list);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [filteredItems]);

  useEffect(() => {
    setPageByLevel({});
  }, [search, filter]);

  function setLevelPage(level: number, page: number) {
    setPageByLevel((prev) => ({ ...prev, [level]: page }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
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
      setForm({
        word: '',
        english_translation: '',
        difficulty_level: form.difficulty_level,
        audio_model_url: '',
        image_url: '',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vocabulary item');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkImport() {
    if (!token) return;
    setImporting(true);
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import vocabulary');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="admin-page">
      <Link to="/catalog" className="admin-page__back">
        ← Back to catalog
      </Link>

      <header className="admin-page__hero">
        <h1>Vocabulary</h1>
        <p>Words used to build questions.</p>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="admin-page__panel">
        <h2>Filter</h2>
        <div className="admin-page__filters">
          <button
            type="button"
            className={filter === 'all' ? 'admin-page__filter admin-page__filter--active' : 'admin-page__filter'}
            onClick={() => setFilter('all')}
          >
            All levels
          </button>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={
                filter === opt.value
                  ? 'admin-page__filter admin-page__filter--active'
                  : 'admin-page__filter'
              }
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="admin-page__panel">
        <h2>Bulk import (JSON)</h2>
        <p className="admin-page__hint">
          Needs <code>word</code> + <code>english_translation</code>. Optional:{' '}
          <code>difficulty_level</code> (1–3), <code>image_url</code>, <code>audio_model_url</code>.
        </p>
        <div className="admin-page__field">
          <textarea
            className="admin-page__textarea admin-page__textarea--tall"
            placeholder='{ "items": [ { "word": "Intu", "english_translation": "House", "difficulty_level": 1 } ] }'
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            disabled={importing}
            rows={8}
          />
        </div>
        <button
          type="button"
          className="admin-page__btn admin-page__btn--primary"
          disabled={importing || !importJson.trim()}
          onClick={handleBulkImport}
        >
          {importing ? 'Importing…' : 'Import JSON'}
        </button>
      </section>

      <section className="admin-page__panel">
        <h2>Add vocabulary item</h2>
        <form onSubmit={handleCreate}>
          <div className="admin-page__grid admin-page__grid--2">
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="v-word">
                Word
              </label>
              <input
                id="v-word"
                className="admin-page__input"
                required
                maxLength={200}
                value={form.word}
                onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="v-english">
                English translation
              </label>
              <input
                id="v-english"
                className="admin-page__input"
                required
                maxLength={200}
                value={form.english_translation}
                onChange={(e) => setForm((f) => ({ ...f, english_translation: e.target.value }))}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="v-level">
                Level
              </label>
              <select
                id="v-level"
                className="admin-page__select"
                value={form.difficulty_level}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    difficulty_level: Number(e.target.value) as 1 | 2 | 3,
                  }))
                }
                disabled={submitting}
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="v-image">
                Image URL
              </label>
              <input
                id="v-image"
                className="admin-page__input"
                type="url"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                disabled={submitting}
              />
              <label className="admin-page__upload-label">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingImage || submitting}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file || !token) return;
                    setUploadingImage(true);
                    setError('');
                    try {
                      const { url } = await uploadVocabularyImage(token, file);
                      setForm((f) => ({ ...f, image_url: url }));
                      setSuccess('Image uploaded.');
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Image upload failed');
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
                {uploadingImage ? 'Uploading…' : 'Upload image'}
              </label>
            </div>
          </div>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="v-audio">
              Audio model URL
            </label>
            <input
              id="v-audio"
              className="admin-page__input"
              type="url"
              value={form.audio_model_url}
              onChange={(e) => setForm((f) => ({ ...f, audio_model_url: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            className="admin-page__btn admin-page__btn--primary"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create item'}
          </button>
        </form>
      </section>

      <section className="admin-page__table-wrap">
        {loading ? (
          <p className="admin-page__empty">Loading vocabulary…</p>
        ) : items.length === 0 ? (
          <p className="admin-page__empty">No vocabulary items yet.</p>
        ) : (
          <>
            <div className="admin-page__panel">
              <input
                className="admin-page__input admin-page__input--search"
                placeholder="Search words…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {grouped.length === 0 ? (
              <p className="admin-page__empty">No words match your search.</p>
            ) : (
              grouped.map(([level, levelItems]) => {
                const pageCount = Math.max(1, Math.ceil(levelItems.length / VOCAB_PAGE_SIZE));
                const currentPage = Math.min(pageByLevel[level] ?? 1, pageCount);
                const start = (currentPage - 1) * VOCAB_PAGE_SIZE;
                const pageItems = levelItems.slice(start, start + VOCAB_PAGE_SIZE);

                return (
                  <div key={level} className="admin-page__panel">
                    <h2>
                      Level {level} ({levelItems.length})
                    </h2>
                    <table className="admin-page__table">
                      <thead>
                        <tr>
                          <th>Word</th>
                          <th>English</th>
                          <th>Image</th>
                          <th>Audio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((item) => (
                          <tr key={item.id}>
                            <td>{item.word}</td>
                            <td>{item.english_translation ?? '—'}</td>
                            <td>
                              {item.image_url ? (
                                <img
                                  className="admin-page__thumb"
                                  src={item.image_url}
                                  alt=""
                                  loading="lazy"
                                />
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              {item.audio_model_url ? (
                                <audio
                                  className="admin-page__audio"
                                  src={item.audio_model_url}
                                  controls
                                  preload="none"
                                />
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {pageCount > 1 && (
                      <div className="admin-page__pagination">
                        <button
                          type="button"
                          className="admin-page__btn"
                          onClick={() => setLevelPage(level, Math.max(1, currentPage - 1))}
                          disabled={currentPage <= 1}
                        >
                          ← Prev
                        </button>
                        <span className="admin-page__pagination-info">
                          Page {currentPage} of {pageCount} · showing {start + 1}–
                          {Math.min(start + VOCAB_PAGE_SIZE, levelItems.length)} of{' '}
                          {levelItems.length}
                        </span>
                        <button
                          type="button"
                          className="admin-page__btn"
                          onClick={() => setLevelPage(level, Math.min(pageCount, currentPage + 1))}
                          disabled={currentPage >= pageCount}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </section>
    </div>
  );
}
