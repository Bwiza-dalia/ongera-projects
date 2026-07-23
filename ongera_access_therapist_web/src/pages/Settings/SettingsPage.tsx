import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatShortDate } from '../../lib/formatDate';
import {
  getTherapistProfile,
  resolveTherapistProfileId,
} from '../../services/therapistService';
import { displayName } from '../../types/auth';
import type { ApiTherapistProfile } from '../../types/api';
import './SettingsPage.css';

export function SettingsPage() {
  const { token, user, refreshSession } = useAuth();
  const [profile, setProfile] = useState<ApiTherapistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || !user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await refreshSession();
      const profileId = await resolveTherapistProfileId(
        token,
        user.id,
        displayName(user),
      );
      const next = await getTherapistProfile(token, profileId);
      setProfile(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, refreshSession]);

  useEffect(() => {
    void load();
  }, [load]);

  const status = profile?.status ?? user?.therapistStatus ?? '—';
  const verified =
    profile?.is_verified === true ||
    String(status).toUpperCase() === 'VERIFIED' ||
    user?.isVerified === true;

  return (
    <div className="settings-page">
      <header className="settings-page__hero">
        <h1 className="app-page-title">Settings</h1>
      </header>

      {error && (
        <div className="settings-page__error" role="alert">
          <p>{error}</p>
          <button type="button" className="settings-page__retry" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="settings-page__card" role="status">
          <p>Loading profile…</p>
        </div>
      ) : (
        <section className="settings-page__card" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="settings-page__card-title">
            Therapist profile
          </h2>
          <dl className="settings-page__grid">
            <div>
              <dt>Name</dt>
              <dd>{user ? displayName(user) : '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt>Affiliation</dt>
              <dd>{profile?.affiliation || user?.affiliation || '—'}</dd>
            </div>
            <div>
              <dt>Specialty</dt>
              <dd>{profile?.specialty || user?.specialty || '—'}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{user?.location || '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span
                  className={
                    verified
                      ? 'settings-page__badge settings-page__badge--ok'
                      : 'settings-page__badge'
                  }
                >
                  {String(status)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{formatShortDate(profile?.created_at) ?? '—'}</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
