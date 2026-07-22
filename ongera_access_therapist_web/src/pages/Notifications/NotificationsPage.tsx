import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { buildPatientsNeedingAttention } from '../../lib/patientAttention';
import {
  listIncomingRequests,
  toPendingReviews,
} from '../../services/assignmentService';
import { listPatientsWithProgress } from '../../services/patientService';
import { resolveTherapistProfileId } from '../../services/therapistService';
import { displayName } from '../../types/auth';
import type { PendingReview } from '../../types/dashboard';
import './NotificationsPage.css';

type NoticeKind = 'request' | 'attention';

interface NoticeItem {
  id: string;
  kind: NoticeKind;
  title: string;
  message: string;
  patientName: string;
  href: string;
  createdAt: string | null;
  priority: 'high' | 'medium';
}

export function NotificationsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | NoticeKind>('all');

  const load = useCallback(async () => {
    if (!token || !user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const patientsPromise = listPatientsWithProgress(token);
      const reviewsPromise = resolveTherapistProfileId(token, user.id, displayName(user))
        .then((profileId) => listIncomingRequests(token, profileId))
        .then(toPendingReviews)
        .catch(() => [] as PendingReview[]);

      const [patients, reviews] = await Promise.all([patientsPromise, reviewsPromise]);

      const requestNotices: NoticeItem[] = reviews.map((review) => ({
        id: `request:${review.id}`,
        kind: 'request',
        title: 'Pending patient request',
        message: review.reason || 'A patient requested to join your caseload.',
        patientName: review.patientName,
        href: '/care-plans?tab=requests',
        createdAt: review.createdAt,
        priority: 'high',
      }));

      const attentionNotices: NoticeItem[] = buildPatientsNeedingAttention(patients, 20).map(
        (item) => ({
          id: `attention:${item.patientId}:${item.reason}`,
          kind: 'attention',
          title: item.reason,
          message: item.detail || `${item.patientName} needs follow-up.`,
          patientName: item.patientName,
          href: `/patients?patient=${item.patientId}`,
          createdAt: item.lastSession,
          priority: item.priority,
        }),
      );

      setItems([...requestNotices, ...attentionNotices]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.kind === filter);
  }, [items, filter]);

  return (
    <div className="notifications-page">
      <header className="notifications-page__hero">
        <h1 className="app-page-title">Notifications</h1>
      </header>

      {error && (
        <div className="notifications-page__empty-card" role="alert">
          <p>{error}</p>
          <button type="button" className="notifications-page__retry" onClick={load}>
            Try again
          </button>
        </div>
      )}

      <div className="notifications-page__filters" role="group" aria-label="Filter notifications">
        {(
          [
            ['all', 'All'],
            ['request', 'Requests'],
            ['attention', 'Attention'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={
              filter === value
                ? 'notifications-page__filter notifications-page__filter--active'
                : 'notifications-page__filter'
            }
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            disabled={isLoading}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="notifications-page__empty-card" role="status">
          <p>Loading notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="notifications-page__empty-card" role="status">
          <p>No notifications yet.</p>
          <span>Pending requests and patients needing attention will appear here.</span>
        </div>
      ) : (
        <ul className="notifications-page__list">
          {filtered.map((item) => (
            <li key={item.id} className="notifications-page__item">
              <div className="notifications-page__item-main">
                <p className="notifications-page__item-title">
                  {item.patientName}
                  <span className="notifications-page__item-sep"> · </span>
                  <span className="notifications-page__item-emph">{item.title}</span>
                </p>
                <p className="notifications-page__item-message">{item.message}</p>
                {item.createdAt && (
                  <p className="notifications-page__item-time">{item.createdAt}</p>
                )}
              </div>
              <Link to={item.href} className="notifications-page__open">
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
