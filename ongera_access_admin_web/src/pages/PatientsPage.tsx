import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/alerts/ConfirmDialog';
import {
  CreatePatientModal,
  type CreatePatientForm,
} from '../components/patients/CreatePatientModal';
import { Pagination, usePagination } from '../components/ui/Pagination';
import { RowActionMenu } from '../components/ui/RowActionMenu';
import { useAuth } from '../context/AuthContext';
import { caregiverDisplayName, readCaregiver } from '../lib/caregiverUtils';
import {
  ageFromDateOfBirth,
  formatJoinedDate,
  initialsFromName,
} from '../lib/patientAge';
import {
  patientTherapistStatus,
  resolvePatientName,
  therapistUserLabel,
} from '../lib/patientUtils';
import { assignTherapist, listPatients, updatePatient } from '../services/patientService';
import { listTherapists } from '../services/therapistService';
import { createUser, deleteUser, listUsers } from '../services/userService';
import type { ApiPatientSummary, ApiTherapistProfile, ApiUser } from '../types/api';
import '../styles/admin-page.css';
import './PatientsPage.css';

const emptyForm: CreatePatientForm = {
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  date_of_birth: '',
  location: '',
  caregiver_fullname: '',
  caregiver_email: '',
  caregiver_relationship: '',
  caregiver_phone: '',
  therapist_id: '',
};

type StatusFilter = 'all' | 'ASSIGNED' | 'UNASSIGNED';

export function PatientsPage() {
  const { token } = useAuth();
  const [patients, setPatients] = useState<ApiPatientSummary[]>([]);
  const [therapists, setTherapists] = useState<ApiTherapistProfile[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [therapistFilter, setTherapistFilter] = useState('all');
  const [confirmDeactivate, setConfirmDeactivate] = useState<null | {
    userId: string;
    name: string;
  }>(null);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const verifiedTherapists = useMemo(
    () => therapists.filter((t) => t.is_verified),
    [therapists],
  );

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      const status = patientTherapistStatus(p);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (therapistFilter !== 'all' && (p.therapist_id ?? '') !== therapistFilter) return false;

      if (!q) return true;
      const name = resolvePatientName(p, userById).toLowerCase();
      const email = (p.email ?? userById.get(p.user_id)?.email ?? '').toLowerCase();
      const caregiver = caregiverDisplayName(readCaregiver(p))?.toLowerCase() ?? '';
      const therapist = p.therapist_id
        ? therapistUserLabel(p.therapist_id, userById).toLowerCase()
        : '';
      const location = (userById.get(p.user_id)?.location ?? '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        caregiver.includes(q) ||
        therapist.includes(q) ||
        location.includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [patients, query, statusFilter, therapistFilter, userById]);

  const resetKey = `${query}|${statusFilter}|${therapistFilter}`;
  const patientsPagination = usePagination(filteredPatients, 10, resetKey);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [p, t, u] = await Promise.all([
        listPatients(token),
        listTherapists(token),
        listUsers(token),
      ]);
      setPatients(p);
      setTherapists(t);
      setUsers(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
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

  function updateField(key: keyof CreatePatientForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFormError('');
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const created = await createUser(token, {
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        role: 'patient',
        location: form.location.trim() || undefined,
        date_of_birth: form.date_of_birth || undefined,
      });

      const refreshedPatients = await listPatients(token);
      setPatients(refreshedPatients);
      const profile = refreshedPatients.find((p) => p.user_id === created.id);

      const hasCaregiver =
        form.caregiver_fullname.trim() ||
        form.caregiver_email.trim() ||
        form.caregiver_relationship.trim() ||
        form.caregiver_phone.trim();

      if (profile && hasCaregiver) {
        await updatePatient(token, profile.id, {
          caregiver_info: {
            fullname: form.caregiver_fullname.trim() || undefined,
            email: form.caregiver_email.trim() || undefined,
            relationship: form.caregiver_relationship.trim() || undefined,
            phone_number: form.caregiver_phone.trim() || undefined,
          },
          location: form.location.trim() || undefined,
        });
      }

      if (profile && form.therapist_id) {
        await assignTherapist(token, profile.id, form.therapist_id);
      }

      if (!profile && (hasCaregiver || form.therapist_id)) {
        setSuccess(
          'Patient account created, but the profile could not be located to save caregiver/therapist details. Update them from the table below.',
        );
      } else {
        setSuccess('Patient created.');
      }

      setForm(emptyForm);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create patient');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign(patientId: string, therapistUserId: string) {
    if (!token || !therapistUserId) return;
    setAssigning(patientId);
    setError('');
    setSuccess('');
    try {
      await assignTherapist(token, patientId, therapistUserId);
      setSuccess('Therapist assigned.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign therapist');
    } finally {
      setAssigning(null);
    }
  }

  async function handleDeactivate() {
    if (!token || !confirmDeactivate) return;
    setActingUserId(confirmDeactivate.userId);
    setError('');
    setSuccess('');
    try {
      await deleteUser(token, confirmDeactivate.userId);
      setSuccess('Patient account deactivated.');
      setConfirmDeactivate(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate patient');
    } finally {
      setActingUserId(null);
    }
  }

  return (
    <div className="admin-page patients-page">
      <header className="admin-page__hero admin-page__hero--row">
        <h1>Patients</h1>
        <button type="button" className="admin-page__cta" onClick={openModal}>
          + Create patient
        </button>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="patients-table-card">
        <div className="patients-table-card__header">
          <h2 className="patients-table-card__title">All patients</h2>
          <div className="patients-table-card__controls">
            <label className="patients-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Search patients…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search patients"
              />
            </label>
            <select
              className="patients-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filter by status"
            >
              <option value="all">Status</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNASSIGNED">Unassigned</option>
            </select>
            <select
              className="patients-filter"
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
              aria-label="Filter by therapist"
            >
              <option value="all">Therapist</option>
              {verifiedTherapists.map((t) => (
                <option key={t.id} value={t.user_id}>
                  {therapistUserLabel(t.user_id, userById)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="admin-page__empty">Loading…</p>
        ) : patients.length === 0 ? (
          <div className="admin-page__empty-state">
            <h3>No patients yet</h3>
            <p>Create the first patient account to get started.</p>
            <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openModal}>
              + Create patient
            </button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <p className="admin-page__empty">No patients match your filters.</p>
        ) : (
          <>
            <div className="patients-table-wrap">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Caregiver</th>
                    <th>Therapist</th>
                    <th>Location</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Assign</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsPagination.pageItems.map((p) => {
                    const name = resolvePatientName(p, userById);
                    const user = userById.get(p.user_id);
                    const caregiver = readCaregiver(p);
                    const caregiverName = caregiverDisplayName(caregiver);
                    const therapistUserId = p.therapist_id ?? '';
                    const status = patientTherapistStatus(p);
                    const age = ageFromDateOfBirth(user?.date_of_birth);

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="patients-person">
                            <span className="patients-avatar" aria-hidden="true">
                              {initialsFromName(name)}
                            </span>
                            <p className="patients-person__name">{name}</p>
                          </div>
                        </td>
                        <td>{age != null ? age : <span className="patients-muted">—</span>}</td>
                        <td>
                          {caregiverName ? (
                            <div>
                              <p className="patients-stack__primary">{caregiverName}</p>
                              <p className="patients-stack__secondary">
                                {caregiver?.relationship || 'Caregiver'}
                              </p>
                            </div>
                          ) : (
                            <span className="patients-muted">—</span>
                          )}
                        </td>
                        <td>
                          {therapistUserId ? (
                            therapistUserLabel(therapistUserId, userById)
                          ) : (
                            <span className="patients-muted">—</span>
                          )}
                        </td>
                        <td>
                          {user?.location?.trim() ? (
                            user.location
                          ) : (
                            <span className="patients-muted">—</span>
                          )}
                        </td>
                        <td>{formatJoinedDate(p.created_at ?? user?.created_at)}</td>
                        <td>
                          <span
                            className={
                              status === 'ASSIGNED'
                                ? 'patients-status patients-status--assigned'
                                : 'patients-status patients-status--unassigned'
                            }
                          >
                            {status === 'ASSIGNED' ? 'Assigned' : 'Unassigned'}
                          </span>
                        </td>
                        <td>
                          <select
                            key={`${p.id}-${therapistUserId}`}
                            className="patients-assign"
                            defaultValue={therapistUserId}
                            disabled={assigning === p.id}
                            onChange={(e) => handleAssign(p.id, e.target.value)}
                            aria-label={`Assign therapist for ${name}`}
                          >
                            <option value="">Select…</option>
                            {verifiedTherapists.map((t) => (
                              <option key={t.id} value={t.user_id}>
                                {therapistUserLabel(t.user_id, userById)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <RowActionMenu
                            disabled={actingUserId === p.user_id}
                            items={[
                              {
                                label: 'Deactivate',
                                danger: true,
                                onSelect: () =>
                                  setConfirmDeactivate({ userId: p.user_id, name }),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={patientsPagination.page}
              pageCount={patientsPagination.pageCount}
              rangeStart={patientsPagination.rangeStart}
              rangeEnd={patientsPagination.rangeEnd}
              total={patientsPagination.total}
              onPageChange={patientsPagination.setPage}
              itemLabel="patients"
            />
          </>
        )}
      </section>

      <CreatePatientModal
        open={modalOpen}
        form={form}
        submitting={submitting}
        error={formError}
        verifiedTherapists={verifiedTherapists}
        userById={userById}
        onClose={closeModal}
        onChange={updateField}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={Boolean(confirmDeactivate)}
        title="Deactivate patient account?"
        message={`Deactivate ${confirmDeactivate?.name ?? 'this patient'}? Soft suspend is not available yet — this permanently removes the account.`}
        confirmLabel="Deactivate"
        danger
        busy={Boolean(actingUserId)}
        onConfirm={handleDeactivate}
        onCancel={() => !actingUserId && setConfirmDeactivate(null)}
      />
    </div>
  );
}
