import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/alerts/ConfirmDialog';
import {
  CreateTherapistModal,
  type CreateTherapistForm,
} from '../components/therapists/CreateTherapistModal';
import { TherapistActionMenu } from '../components/therapists/TherapistActionMenu';
import { Pagination, usePagination } from '../components/ui/Pagination';
import { ListStatCards } from '../components/ui/ListStatCards';
import { useAuth } from '../context/AuthContext';
import { initialsFromName } from '../lib/patientAge';
import {
  therapistAccountStatus,
  therapistStatusLabel,
} from '../lib/therapistStatus';
import {
  approveTherapist,
  createTherapist,
  listTherapists,
  rejectTherapist,
} from '../services/therapistService';
import { deleteUser, listUsers } from '../services/userService';
import type { ApiTherapistProfile, ApiUser, TherapistAccountStatus } from '../types/api';
import '../styles/admin-page.css';
import './TherapistsPage.css';

const emptyForm: CreateTherapistForm = {
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  location: '',
  affiliation: '',
  specialty: '',
};

type StatusFilter = 'all' | TherapistAccountStatus;

export function TherapistsPage() {
  const { token } = useAuth();
  const [therapists, setTherapists] = useState<ApiTherapistProfile[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [actingProfileId, setActingProfileId] = useState<string | null>(null);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [confirm, setConfirm] = useState<null | {
    profileId: string;
    userId: string;
    name: string;
    action: 'reject' | 'deactivate';
  }>(null);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const filteredTherapists = useMemo(() => {
    const q = query.trim().toLowerCase();
    return therapists.filter((t) => {
      const status = therapistAccountStatus(t);
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (!q) return true;
      const user = userById.get(t.user_id);
      const name = user ? `${user.first_name} ${user.last_name}`.toLowerCase() : '';
      const email = (user?.email ?? '').toLowerCase();
      const affiliation = (t.affiliation ?? '').toLowerCase();
      const specialty = (t.specialty ?? '').toLowerCase();
      const location = (user?.location ?? '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        affiliation.includes(q) ||
        specialty.includes(q) ||
        location.includes(q)
      );
    });
  }, [therapists, query, statusFilter, userById]);

  const therapistsPagination = usePagination(
    filteredTherapists,
    10,
    `${query}|${statusFilter}`,
  );

  const statusCounts = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let rejected = 0;
    for (const t of therapists) {
      const status = therapistAccountStatus(t);
      if (status === 'VERIFIED') verified += 1;
      else if (status === 'REJECTED') rejected += 1;
      else pending += 1;
    }
    return { total: therapists.length, pending, verified, rejected };
  }, [therapists]);

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

  function openModal() {
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setFormError('');
    setForm(emptyForm);
  }

  function updateField(key: keyof CreateTherapistForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function therapistName(userId: string) {
    const user = userById.get(userId);
    if (!user) return 'Name unavailable';
    return `${user.first_name} ${user.last_name}`.trim();
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFormError('');
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
      setSuccess('Therapist created. Review and approve before they can accept patients.');
      setForm(emptyForm);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create therapist');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(profileId: string) {
    if (!token) return;
    setActingProfileId(profileId);
    setError('');
    setSuccess('');
    try {
      await approveTherapist(token, profileId);
      setSuccess('Therapist approved.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve therapist');
    } finally {
      setActingProfileId(null);
    }
  }

  async function handleConfirmAction() {
    if (!token || !confirm) return;
    setActingUserId(confirm.userId);
    setActingProfileId(confirm.profileId);
    setError('');
    setSuccess('');
    try {
      if (confirm.action === 'reject') {
        await rejectTherapist(token, confirm.profileId);
        setSuccess('Therapist rejected. They can still log in but cannot receive patients.');
      } else {
        await deleteUser(token, confirm.userId);
        setSuccess('Therapist account deactivated.');
      }
      setConfirm(null);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : confirm.action === 'reject'
            ? 'Failed to reject therapist'
            : 'Failed to deactivate therapist',
      );
    } finally {
      setActingUserId(null);
      setActingProfileId(null);
    }
  }

  function statusBadgeClass(status: TherapistAccountStatus) {
    if (status === 'VERIFIED') return 'therapists-status therapists-status--verified';
    if (status === 'REJECTED') return 'therapists-status therapists-status--rejected';
    return 'therapists-status therapists-status--pending';
  }

  return (
    <div className="admin-page therapists-page">
      <header className="admin-page__hero admin-page__hero--row">
        <div>
          <h1>Therapists</h1>
        </div>
        <button type="button" className="admin-page__cta" onClick={openModal}>
          + Create therapist
        </button>
      </header>

      <ListStatCards
        label="Therapist statistics"
        items={[
          {
            id: 'total',
            label: 'Total therapists',
            value: statusCounts.total,
            active: statusFilter === 'all',
            onSelect: () => setStatusFilter('all'),
          },
          {
            id: 'pending',
            label: 'Pending',
            value: statusCounts.pending,
            active: statusFilter === 'PENDING',
            onSelect: () => setStatusFilter('PENDING'),
          },
          {
            id: 'verified',
            label: 'Verified',
            value: statusCounts.verified,
            active: statusFilter === 'VERIFIED',
            onSelect: () => setStatusFilter('VERIFIED'),
          },
          {
            id: 'rejected',
            label: 'Rejected',
            value: statusCounts.rejected,
            active: statusFilter === 'REJECTED',
            onSelect: () => setStatusFilter('REJECTED'),
          },
        ]}
      />

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <div className="therapists-layout">
        <aside className="therapists-filters" aria-label="Therapist filters">
          <h2 className="therapists-filters__title">Filters</h2>

          <div className="therapists-filters__group">
            <label className="therapists-filters__label" htmlFor="therapists-status-filter">
              Status
            </label>
            <select
              id="therapists-status-filter"
              className="therapists-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </aside>

        <section className="therapists-table-card">
          <div className="therapists-table-card__header">
            <h2 className="therapists-table-card__title">All therapists</h2>
            <label className="therapists-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Search therapists…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search therapists"
              />
            </label>
          </div>

          {loading ? (
            <p className="admin-page__empty">Loading…</p>
          ) : therapists.length === 0 ? (
            <div className="admin-page__empty-state">
              <h3>No therapists yet</h3>
              <p>Create the first therapist account to get started.</p>
              <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openModal}>
                + Create therapist
              </button>
            </div>
          ) : filteredTherapists.length === 0 ? (
            <p className="admin-page__empty">No therapists match your filters.</p>
          ) : (
            <>
              <div className="therapists-table-wrap">
                <table className="therapists-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Affiliation</th>
                      <th>Specialty</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {therapistsPagination.pageItems.map((t) => {
                      const user = userById.get(t.user_id);
                      const name = therapistName(t.user_id);
                      const status = therapistAccountStatus(t);
                      return (
                        <tr key={t.id}>
                          <td>
                            <div className="therapists-person">
                              <span className="therapists-avatar" aria-hidden="true">
                                {initialsFromName(name)}
                              </span>
                              <p className="therapists-person__name">{name}</p>
                            </div>
                          </td>
                          <td>
                            {t.affiliation?.trim() ? (
                              t.affiliation
                            ) : (
                              <span className="therapists-muted">—</span>
                            )}
                          </td>
                          <td>
                            {t.specialty?.trim() ? (
                              t.specialty
                            ) : (
                              <span className="therapists-muted">—</span>
                            )}
                          </td>
                          <td>
                            {user?.location?.trim() ? (
                              user.location
                            ) : (
                              <span className="therapists-muted">—</span>
                            )}
                          </td>
                          <td>
                            <span className={statusBadgeClass(status)}>
                              {therapistStatusLabel(status)}
                            </span>
                          </td>
                          <td>
                            <TherapistActionMenu
                              status={status}
                              disabled={
                                actingProfileId === t.id || actingUserId === t.user_id
                              }
                              onApprove={() => handleApprove(t.id)}
                              onReject={() =>
                                setConfirm({
                                  profileId: t.id,
                                  userId: t.user_id,
                                  name,
                                  action: 'reject',
                                })
                              }
                              onDeactivate={() =>
                                setConfirm({
                                  profileId: t.id,
                                  userId: t.user_id,
                                  name,
                                  action: 'deactivate',
                                })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={therapistsPagination.page}
                pageCount={therapistsPagination.pageCount}
                rangeStart={therapistsPagination.rangeStart}
                rangeEnd={therapistsPagination.rangeEnd}
                total={therapistsPagination.total}
                onPageChange={therapistsPagination.setPage}
                itemLabel="therapists"
              />
            </>
          )}
        </section>
      </div>

      <CreateTherapistModal
        open={modalOpen}
        form={form}
        submitting={submitting}
        error={formError}
        onClose={closeModal}
        onChange={updateField}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.action === 'reject' ? 'Reject therapist?' : 'Deactivate therapist account?'
        }
        message={
          confirm?.action === 'reject'
            ? `Reject ${confirm.name}? Their account stays active, but they will not appear in search and cannot be assigned patients.`
            : `Deactivate ${confirm?.name ?? 'this therapist'}? Soft suspend is not available yet — this permanently removes the account.`
        }
        confirmLabel={confirm?.action === 'reject' ? 'Reject' : 'Deactivate'}
        danger
        busy={Boolean(actingUserId || actingProfileId)}
        onConfirm={handleConfirmAction}
        onCancel={() => !(actingUserId || actingProfileId) && setConfirm(null)}
      />
    </div>
  );
}
