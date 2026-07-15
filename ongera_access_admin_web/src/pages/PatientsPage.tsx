import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Pagination, usePagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { caregiverDisplayName, readCaregiver } from '../lib/caregiverUtils';
import {
  patientTherapistStatus,
  resolvePatientName,
  therapistUserLabel,
} from '../lib/patientUtils';
import { assignTherapist, listPatients, updatePatient } from '../services/patientService';
import { listTherapists } from '../services/therapistService';
import { createUser, listUsers } from '../services/userService';
import type { ApiPatientSummary, ApiTherapistProfile, ApiUser } from '../types/api';
import '../styles/admin-page.css';

const emptyForm = {
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

export function PatientsPage() {
  const { token } = useAuth();
  const [patients, setPatients] = useState<ApiPatientSummary[]>([]);
  const [therapists, setTherapists] = useState<ApiTherapistProfile[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const verifiedTherapists = useMemo(
    () => therapists.filter((t) => t.is_verified),
    [therapists],
  );

  const patientsPagination = usePagination(patients, 10);

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

  function updateField(key: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      // 1. Create the base patient account (POST /api/v1/users).
      const created = await createUser(token, {
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        role: 'patient',
        location: form.location.trim() || undefined,
        date_of_birth: form.date_of_birth || undefined,
      });

      // The user endpoint returns a User, not the patient profile. Reload the
      // patient list to find the profile id created alongside the account.
      const refreshedPatients = await listPatients(token);
      setPatients(refreshedPatients);
      const profile = refreshedPatients.find((p) => p.user_id === created.id);

      const hasCaregiver =
        form.caregiver_fullname.trim() ||
        form.caregiver_email.trim() ||
        form.caregiver_relationship.trim() ||
        form.caregiver_phone.trim();

      if (profile && hasCaregiver) {
        // 2. Attach caregiver details (PUT /api/v1/patients/{id}).
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
        // 3. Assign a verified therapist (PUT /api/v1/patients/{id}/therapist).
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create patient');
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

  return (
    <div className="admin-page">
      <header className="admin-page__hero">
        <h1>Patients</h1>
        <p>Create patient accounts and assign verified therapists.</p>
      </header>

      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-page__success">{success}</p>}

      <section className="admin-page__panel">
        <h2>Create patient</h2>
        <form onSubmit={handleCreate}>
          <div className="admin-page__grid admin-page__grid--2">
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-email">
                Email
              </label>
              <input
                id="patient-email"
                className="admin-page__input"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-password">
                Password
              </label>
              <PasswordInput
                id="patient-password"
                className="admin-page__input"
                wrapClassName="admin-page__password-wrap"
                toggleClassName="admin-page__toggle"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-first">
                First name
              </label>
              <input
                id="patient-first"
                className="admin-page__input"
                required
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-last">
                Last name
              </label>
              <input
                id="patient-last"
                className="admin-page__input"
                required
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-dob">
                Date of birth <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="patient-dob"
                className="admin-page__input"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => updateField('date_of_birth', e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="admin-page__field">
              <label className="admin-page__label" htmlFor="patient-location">
                Location <span className="admin-page__hint-inline">(optional)</span>
              </label>
              <input
                id="patient-location"
                className="admin-page__input"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="admin-page__subpanel">
            <p className="admin-page__subpanel-title">Caregiver (optional)</p>
            <div className="admin-page__grid admin-page__grid--2">
              <div className="admin-page__field">
                <label className="admin-page__label" htmlFor="caregiver-name">
                  Full name
                </label>
                <input
                  id="caregiver-name"
                  className="admin-page__input"
                  value={form.caregiver_fullname}
                  onChange={(e) => updateField('caregiver_fullname', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="admin-page__field">
                <label className="admin-page__label" htmlFor="caregiver-relationship">
                  Relationship
                </label>
                <input
                  id="caregiver-relationship"
                  className="admin-page__input"
                  value={form.caregiver_relationship}
                  onChange={(e) => updateField('caregiver_relationship', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="admin-page__field">
                <label className="admin-page__label" htmlFor="caregiver-email">
                  Email
                </label>
                <input
                  id="caregiver-email"
                  className="admin-page__input"
                  type="email"
                  value={form.caregiver_email}
                  onChange={(e) => updateField('caregiver_email', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="admin-page__field">
                <label className="admin-page__label" htmlFor="caregiver-phone">
                  Phone number
                </label>
                <input
                  id="caregiver-phone"
                  className="admin-page__input"
                  value={form.caregiver_phone}
                  onChange={(e) => updateField('caregiver_phone', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className="admin-page__field">
            <label className="admin-page__label" htmlFor="patient-therapist">
              Assign therapist <span className="admin-page__hint-inline">(optional)</span>
            </label>
            <select
              id="patient-therapist"
              className="admin-page__select"
              value={form.therapist_id}
              onChange={(e) => updateField('therapist_id', e.target.value)}
              disabled={submitting}
            >
              <option value="">No therapist yet</option>
              {verifiedTherapists.map((t) => (
                <option key={t.id} value={t.user_id}>
                  {therapistUserLabel(t.user_id, userById)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="admin-page__btn admin-page__btn--primary"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create patient'}
          </button>
        </form>
      </section>

      <section className="admin-page__table-wrap">
        {loading ? (
          <p className="admin-page__empty">Loading…</p>
        ) : patients.length === 0 ? (
          <p className="admin-page__empty">No patients yet.</p>
        ) : (
          <table className="admin-page__table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Caregiver</th>
                <th>Status</th>
                <th>Therapist</th>
                <th>Assign</th>
              </tr>
            </thead>
            <tbody>
              {patientsPagination.pageItems.map((p) => {
                const caregiver = readCaregiver(p);
                const therapistUserId = p.therapist_id ?? '';
                return (
                  <tr key={p.id}>
                    <td>{resolvePatientName(p, userById)}</td>
                    <td>{p.email ?? userById.get(p.user_id)?.email ?? '—'}</td>
                    <td>
                      {caregiverDisplayName(caregiver) ?? '—'}
                      {caregiver?.relationship ? ` (${caregiver.relationship})` : ''}
                    </td>
                    <td>{patientTherapistStatus(p)}</td>
                    <td>
                      {therapistUserId ? therapistUserLabel(therapistUserId, userById) : '—'}
                    </td>
                    <td>
                      <select
                        className="admin-page__select"
                        defaultValue={therapistUserId}
                        disabled={assigning === p.id}
                        onChange={(e) => handleAssign(p.id, e.target.value)}
                      >
                        <option value="">Select…</option>
                        {verifiedTherapists.map((t) => (
                          <option key={t.id} value={t.user_id}>
                            {therapistUserLabel(t.user_id, userById)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && patients.length > 0 && (
          <Pagination
            page={patientsPagination.page}
            pageCount={patientsPagination.pageCount}
            rangeStart={patientsPagination.rangeStart}
            rangeEnd={patientsPagination.rangeEnd}
            total={patientsPagination.total}
            onPageChange={patientsPagination.setPage}
            itemLabel="patients"
          />
        )}
      </section>
    </div>
  );
}
