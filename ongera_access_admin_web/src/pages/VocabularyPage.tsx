import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createVocabularyItem, listVocabulary } from '../services/catalogService';
import type { ApiVocabularyItem } from '../types/api';
import '../styles/admin-page.css';

const DIFFICULTY_OPTIONS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Intermediate' },
  { value: 3, label: 'Advanced' },
] as const;

export function VocabularyPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ApiVocabularyItem[]>([]);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [form, setForm] = useState({
    word: '',
    english_translation: '',
    difficulty_level: 1,
    semantic_hint: '',
    phonemic_hint: '',
    syllable_breakdown: '',
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
          : await listVocabulary(token, filter);
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

  const grouped = useMemo(() => {
    const map = new Map<number, ApiVocabularyItem[]>();
    for (const item of items) {
      const level = item.difficulty_level ?? 1;
      const list = map.get(level) ?? [];
      list.push(item);
      map.set(level, list);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [items]);

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
        semantic_hint: form.semantic_hint.trim() || undefined,
        phonemic_hint: form.phonemic_hint.trim() || undefined,
        syllable_breakdown: form.syllable_breakdown.trim() || undefined,
        audio_model_url: form.audio_model_url.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
      });
      setSuccess('Vocabulary item created.');
      setForm({
        word: '',
        english_translation: '',
        difficulty_level: form.difficulty_level,
        semantic_hint: '',
        phonemic_hint: '',
        syllable_breakdown: '',
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

        await createVocabularyItem(token, {
          word,
          english_translation: english,
          difficulty_level: Number(row.difficulty_level ?? 1),
          semantic_hint: String(row.semantic_hint ?? '').trim() || undefined,
          phonemic_hint: String(row.phonemic_hint ?? '').trim() || undefined,
          syllable_breakdown: String(row.syllable_breakdown ?? '').trim() || undefined,
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
        <h1>Vocabulary library</h1>
        <p>Words and concepts used as targets and distractors in comprehension exercises.</p>
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
          Paste the market vocabulary JSON from your team (with an <code>items</code> array). Each
          item needs <code>word</code> and <code>english_translation</code>.
        </p>
        <div className="admin-page__field">
          <textarea
            className="admin-page__textarea admin-page__textarea--tall"
            placeholder='{ "items": [ { "word": "Inka", "english_translation": "Cow", ... } ] }'
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
                Word (Kinyarwanda)
              </label>
              <input
                id="v-word"
                className="admin-page__input"
                required
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
                value={form.english_translation}
                onChange={(e) => setForm((f) => ({ ...f, english_translation: e.target.value }))}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="v-level">
                Difficulty level
              </label>
              <select
                id="v-level"
                className="admin-page__select"
                value={form.difficulty_level}
                onChange={(e) =>
                  setForm((f) => ({ ...f, difficulty_level: Number(e.target.value) }))
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
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="v-semantic">
              Semantic hint
            </label>
            <input
              id="v-semantic"
              className="admin-page__input"
              value={form.semantic_hint}
              onChange={(e) => setForm((f) => ({ ...f, semantic_hint: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div className="admin-page__grid admin-page__grid--2">
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="v-phonemic">
                Phonemic hint
              </label>
              <input
                id="v-phonemic"
                className="admin-page__input"
                value={form.phonemic_hint}
                onChange={(e) => setForm((f) => ({ ...f, phonemic_hint: e.target.value }))}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="v-syllables">
                Syllable breakdown
              </label>
              <input
                id="v-syllables"
                className="admin-page__input"
                placeholder="I-n-ka"
                value={form.syllable_breakdown}
                onChange={(e) => setForm((f) => ({ ...f, syllable_breakdown: e.target.value }))}
                disabled={submitting}
              />
            </div>
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
          grouped.map(([level, levelItems]) => (
            <div key={level} className="admin-page__panel">
              <h2>
                Level {level} ({levelItems.length})
              </h2>
              <table className="admin-page__table">
                <thead>
                  <tr>
                    <th>Word</th>
                    <th>English</th>
                    <th>Hints</th>
                  </tr>
                </thead>
                <tbody>
                  {levelItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.word}</td>
                      <td>{item.english_translation ?? '—'}</td>
                      <td>{item.semantic_hint ?? item.phonemic_hint ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
