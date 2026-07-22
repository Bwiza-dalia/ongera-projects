import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CreatePatientModal,
  type CreatePatientForm,
} from '../components/patients/CreatePatientModal';
import { Pagination, usePagination } from '../components/ui/Pagination';
import { ListStatCards } from '../components/ui/ListStatCards';
import { RowActionMenu } from '../components/ui/RowActionMenu';
import { useAuth } from '../context/AuthContext';
import { caregiverDisplayName, readCaregiver } from '../lib/caregiverUtils';
import {
  ageFromDateOfBirth,
  formatJoinedDate,
  initialsFromName,
} from '../lib/patientAge';
import {
  patientDisplayStatus,
  patientDisplayStatusClass,
  patientDisplayStatusLabel,
  latestPatientActivityAt,
  resolvePatientName,
  therapistUserLabel,
  type PatientDisplayStatus,
} from '../lib/patientUtils';
import { isTherapistVerified } from '../lib/therapistStatus';
import {
  listAssignmentRequests,
  pendingRequestByPatientId,
  requestedTherapistUserId,
} from '../services/assignmentService';
import { createPatient, getPatientProgress, listPatients } from '../services/patientService';
import { listTherapists } from '../services/therapistService';
import { listUsers } from '../services/userService';
import type {
  ApiAssignmentRequest,
  ApiPatientSummary,
  ApiTherapistProfile,
  ApiUser,
} from '../types/api';
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

type StatusFilter = 'all' | PatientDisplayStatus;

export function PatientsPage() {
  const { token } = useAuth();
  const location = useLocation();
  const [patients, setPatients] = useState<ApiPatientSummary[]>([]);
  const [therapists, setTherapists] = useState<ApiTherapistProfile[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [assignmentRequests, setAssignmentRequests] = useState<ApiAssignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [therapistFilter, setTherapistFilter] = useState('all');
  const [lastActivityByPatientId, setLastActivityByPatientId] = useState<Map<string, string | null>>(
    () => new Map(),
  );

  useEffect(() => {
    const message = (location.state as { success?: string } | null)?.success;
    if (message) {
      setSuccess(message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const pendingByPatientId = useMemo(
    () => pendingRequestByPatientId(assignmentRequests),
    [assignmentRequests],
  );

  const verifiedTherapists = useMemo(
    () => therapists.filter((t) => isTherapistVerified(t)),
    [therapists],
  );

  function displayStatusFor(patient: ApiPatientSummary): PatientDisplayStatus {
    return patientDisplayStatus(patient, {
      hasPendingRequest: pendingByPatientId.has(patient.id),
      lastActivityAt: lastActivityByPatientId.get(patient.id) ?? null,
    });
  }

  function therapistIdFor(patient: ApiPatientSummary): string {
    const pending = pendingByPatientId.get(patient.id);
    if (pending) return requestedTherapistUserId(pending);
    return patient.therapist_id ?? '';
  }

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      const status = displayStatusFor(p);
      const therapistUserId = therapistIdFor(p);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (therapistFilter !== 'all' && therapistUserId !== therapistFilter) return false;

      if (!q) return true;
      const name = resolvePatientName(p, userById).toLowerCase();
      const email = (p.email ?? userById.get(p.user_id)?.email ?? '').toLowerCase();
      const caregiver = caregiverDisplayName(readCaregiver(p))?.toLowerCase() ?? '';
      const therapist = therapistUserId
        ? therapistUserLabel(therapistUserId, userById).toLowerCase()
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
  }, [
    patients,
    query,
    statusFilter,
    therapistFilter,
    userById,
    pendingByPatientId,
    lastActivityByPatientId,
  ]);

  const resetKey = `${query}|${statusFilter}|${therapistFilter}`;
  const patientsPagination = usePagination(filteredPatients, 10, resetKey);

  const statusCounts = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let unassigned = 0;
    for (const patient of patients) {
      const status = displayStatusFor(patient);
      if (status === 'ASSIGNED_ACTIVE') active += 1;
      else if (status === 'ASSIGNED_INACTIVE') inactive += 1;
      else unassigned += 1;
    }
    return {
      total: patients.length,
      active,
      inactive,
      unassigned,
    };
  }, [patients, pendingByPatientId, lastActivityByPatientId]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [p, t, u, requests] = await Promise.all([
        listPatients(token),
        listTherapists(token),
        listUsers(token),
        listAssignmentRequests(token).catch(() => [] as ApiAssignmentRequest[]),
      ]);
      setPatients(p);
      setTherapists(t);
      setUsers(u);
      setAssignmentRequests(requests);

      const activityEntries = await Promise.all(
        p.map(async (patient) => {
          const progress = await getPatientProgress(token, patient.id);
          return [patient.id, latestPatientActivityAt(progress)] as const;
        }),
      );
      setLastActivityByPatientId(new Map(activityEntries));
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
      const hasCaregiver =
        form.caregiver_fullname.trim() ||
        form.caregiver_email.trim() ||
        form.caregiver_relationship.trim() ||
        form.caregiver_phone.trim();

      await createPatient({
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        location: form.location.trim() || undefined,
        date_of_birth: form.date_of_birth || undefined,
        therapist_id: form.therapist_id || undefined,
        caregiver: hasCaregiver
          ? {
              fullname: form.caregiver_fullname.trim() || undefined,
              email: form.caregiver_email.trim() || undefined,
              relationship: form.caregiver_relationship.trim() || undefined,
              phone_number: form.caregiver_phone.trim() || undefined,
            }
          : undefined,
      });

      setSuccess(
        form.therapist_id
          ? 'Patient created. The therapist must accept the link request in Pending requests.'
          : 'Patient created.',
      );
      setForm(emptyForm);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create patient');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-page patients-page">
      <header className="admin-page__hero admin-page__hero--row">
        <div>
          <h1>Patients</h1>
        </div>
        <button type="button" className="admin-page__cta" onClick={openModal}>
          + Create patient
        </button>
      </header>

      <ListStatCards
        label="Patient statistics"
        items={[
          {
            id: 'total',
            label: 'Total patients',
            value: statusCounts.total,
            active: statusFilter === 'all',
            onSelect: () => setStatusFilter('all'),
          },
          {
            id: 'active',
            label: 'Active now',
            value: statusCounts.active,
            active: statusFilter === 'ASSIGNED_ACTIVE',
            onSelect: () => setStatusFilter('ASSIGNED_ACTIVE'),
          },
          {
            id: 'inactive',
            label: 'Assigned – Inactive',
            value: statusCounts.inactive,
            active: statusFilter === 'ASSIGNED_INACTIVE',
            onSelect: () => setStatusFilter('ASSIGNED_INACTIVE'),
          },
          {
            id: 'unassigned',
            label: 'Unassigned',
            value: statusCounts.unassigned,
            active: statusFilter === 'UNASSIGNED',
            onSelect: () => setStatusFilter('UNASSIGNED'),
          },
        ]}
      />

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <div className="patients-layout">
        <aside className="patients-filters" aria-label="Patient filters">
          <h2 className="patients-filters__title">Filters</h2>

          <div className="patients-filters__group">
            <label className="patients-filters__label" htmlFor="patients-status-filter">
              Status
            </label>
            <select
              id="patients-status-filter"
              className="patients-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All statuses</option>
              <option value="ASSIGNED_ACTIVE">Assigned – Active</option>
              <option value="ASSIGNED_INACTIVE">Assigned – Inactive</option>
              <option value="UNASSIGNED">Unassigned</option>
            </select>
          </div>

          <div className="patients-filters__group">
            <label className="patients-filters__label" htmlFor="patients-therapist-filter">
              Therapist
            </label>
            <select
              id="patients-therapist-filter"
              className="patients-filter"
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
            >
              <option value="all">All therapists</option>
              {verifiedTherapists.map((t) => (
                <option key={t.id} value={t.user_id}>
                  {therapistUserLabel(t.user_id, userById)}
                </option>
              ))}
            </select>
          </div>
        </aside>

        <section className="patients-table-card">
          <div className="patients-table-card__header">
            <h2 className="patients-table-card__title">All patients</h2>
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientsPagination.pageItems.map((p) => {
                      const name = resolvePatientName(p, userById);
                      const user = userById.get(p.user_id);
                      const caregiver = readCaregiver(p);
                      const caregiverName = caregiverDisplayName(caregiver);
                      const therapistUserId = therapistIdFor(p);
                      const status = displayStatusFor(p);
                      const age = ageFromDateOfBirth(user?.date_of_birth);
                      const statusClass = patientDisplayStatusClass(status);
                      const statusLabel = patientDisplayStatusLabel(status);

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
                            <span className={statusClass}>{statusLabel}</span>
                          </td>
                          <td>
                            <RowActionMenu
                              items={[{ label: 'View', to: `/patients/${p.id}` }]}
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
      </div>

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
    </div>
  );
}
