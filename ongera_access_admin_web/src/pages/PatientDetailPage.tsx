import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/alerts/ConfirmDialog';
import { PatientCarePlanPanel } from '../components/patients/PatientCarePlanPanel';
import { PhoneInput } from '../components/ui/PhoneInput';
import { useAuth } from '../context/AuthContext';
import { caregiverDisplayName, readCaregiver } from '../lib/caregiverUtils';
import {
  formatJoinedDate,
  initialsFromName,
} from '../lib/patientAge';
import {
  latestPatientActivityAt,
  patientDisplayStatus,
  patientDisplayStatusLabel,
  patientTherapistStatus,
  resolvePatientName,
  therapistUserLabel,
} from '../lib/patientUtils';
import { isTherapistVerified } from '../lib/therapistStatus';
import {
  listAssignmentRequests,
  pendingRequestByPatientId,
  requestedTherapistUserId,
} from '../services/assignmentService';
import {
  listPatientCarePlanModules,
} from '../services/patientCarePlanService';
import {
  assignTherapist,
  getPatient,
  getPatientProgress,
  updatePatient,
} from '../services/patientService';
import { listTherapists } from '../services/therapistService';
import { deleteUser, listUsers } from '../services/userService';
import type {
  ApiAssignedModule,
  ApiAssignmentRequest,
  ApiPatientProgress,
  ApiPatientSummary,
  ApiTherapistProfile,
  ApiUser,
} from '../types/api';
import '../styles/admin-page.css';
import './PatientsPage.css';
import './PatientDetailPage.css';

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="patient-detail__field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = 'navy',
}: {
  label: string;
  value: string;
  tone?: 'navy' | 'mint' | 'blue' | 'amber';
}) {
  return (
    <article className={`patient-detail__stat patient-detail__stat--${tone}`}>
      <p className="patient-detail__stat-label">{label}</p>
      <p className="patient-detail__stat-value">{value}</p>
    </article>
  );
}

function summarizeProgress(entries: ApiPatientProgress[]) {
  const sessions = entries.reduce((sum, e) => sum + (e.total_sessions_completed ?? 0), 0);
  const questions = entries.reduce((sum, e) => sum + (e.total_questions_attempted ?? 0), 0);
  const correct = entries.reduce((sum, e) => sum + (e.total_correct ?? 0), 0);
  const streak = Math.max(0, ...entries.map((e) => e.consecutive_high_scores ?? 0));
  const scored = entries
    .map((e) => e.average_score)
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  let accuracy: number | null = null;
  if (questions > 0) accuracy = Math.round((correct / questions) * 100);
  else if (scored.length > 0) {
    accuracy = Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
  }
  const lastSession = entries
    .map((e) => e.last_session_at)
    .filter((v): v is string => Boolean(v))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return { sessions, questions, correct, streak, accuracy, lastSession, exerciseCount: entries.length };
}

function summarizeCarePlan(modules: ApiAssignedModule[]) {
  const weeklyMinutes = modules.reduce((sum, mod) => sum + (mod.weekly_minutes_target ?? 0), 0);
  return {
    modules: modules.length,
    weeklyMinutes,
  };
}

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<ApiPatientSummary | null>(null);
  const [therapists, setTherapists] = useState<ApiTherapistProfile[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [assignmentRequests, setAssignmentRequests] = useState<ApiAssignmentRequest[]>([]);
  const [progress, setProgress] = useState<ApiPatientProgress[]>([]);
  const [modules, setModules] = useState<ApiAssignedModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignTherapistId, setAssignTherapistId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [locationDraft, setLocationDraft] = useState('');
  const [caregiverNameDraft, setCaregiverNameDraft] = useState('');
  const [caregiverRelationshipDraft, setCaregiverRelationshipDraft] = useState('');
  const [caregiverEmailDraft, setCaregiverEmailDraft] = useState('');
  const [caregiverPhoneDraft, setCaregiverPhoneDraft] = useState('');

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const pendingByPatientId = useMemo(
    () => pendingRequestByPatientId(assignmentRequests),
    [assignmentRequests],
  );
  const verifiedTherapists = useMemo(
    () => therapists.filter((t) => isTherapistVerified(t)),
    [therapists],
  );
  const progressStats = useMemo(() => summarizeProgress(progress), [progress]);
  const carePlanStats = useMemo(() => summarizeCarePlan(modules), [modules]);

  const load = useCallback(async () => {
    if (!token || !patientId) return;
    setLoading(true);
    setError('');
    try {
      const [p, t, u, requests, progressRows, careModules] = await Promise.all([
        getPatient(token, patientId),
        listTherapists(token),
        listUsers(token),
        listAssignmentRequests(token).catch(() => [] as ApiAssignmentRequest[]),
        getPatientProgress(token, patientId),
        listPatientCarePlanModules(token, patientId).catch(() => [] as ApiAssignedModule[]),
      ]);
      setPatient(p);
      setTherapists(t);
      setUsers(u);
      setAssignmentRequests(requests);
      setProgress(progressRows);
      setModules(careModules);

      const caregiver = readCaregiver(p);
      const patientUser = u.find((user) => user.id === p.user_id);
      setLocationDraft(patientUser?.location?.trim() ?? '');
      setCaregiverNameDraft(caregiverDisplayName(caregiver) ?? '');
      setCaregiverRelationshipDraft(caregiver?.relationship?.trim() ?? '');
      setCaregiverEmailDraft(caregiver?.email?.trim() ?? '');
      setCaregiverPhoneDraft(caregiver?.phone_number?.trim() ?? '');
      setAssignTherapistId(p.therapist_id ?? '');
    } catch (err) {
      setPatient(null);
      setError(err instanceof Error ? err.message : 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  }, [token, patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const name = patient ? resolvePatientName(patient, userById) : 'Patient';
  const user = patient ? userById.get(patient.user_id) : undefined;
  const email = user?.email?.trim() ?? '';
  const location = user?.location?.trim() ?? '';
  const joined = formatJoinedDate(patient?.created_at ?? user?.created_at);
  const caregiver = patient ? readCaregiver(patient) : undefined;
  const caregiverName = caregiverDisplayName(caregiver);
  const therapistUserId = patient?.therapist_id ?? '';
  const therapistName = therapistUserId
    ? therapistUserLabel(therapistUserId, userById)
    : '';
  const pendingRequest = patient ? pendingByPatientId.get(patient.id) : undefined;
  const hasPendingRequest = Boolean(pendingRequest);
  const linkStatus = patient
    ? patientTherapistStatus(patient, hasPendingRequest)
    : 'UNASSIGNED';
  const displayStatus = patient
    ? patientDisplayStatus(patient, {
        hasPendingRequest,
        lastActivityAt: latestPatientActivityAt(progress),
      })
    : 'UNASSIGNED';
  const statusClass =
    displayStatus === 'ASSIGNED_ACTIVE'
      ? 'patient-detail__badge patient-detail__badge--active'
      : displayStatus === 'ASSIGNED_INACTIVE'
        ? 'patient-detail__badge patient-detail__badge--inactive'
        : 'patient-detail__badge patient-detail__badge--unassigned';
  const statusLabel = patientDisplayStatusLabel(displayStatus);
  const lastSessionLabel = progressStats.lastSession
    ? formatJoinedDate(progressStats.lastSession)
    : 'No sessions yet';

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    if (!token || !patient || !assignTherapistId) return;
    setAssigning(true);
    setError('');
    setSuccess('');
    try {
      await assignTherapist(token, patient.id, assignTherapistId);
      const requests = await listAssignmentRequests(token).catch(() => [] as ApiAssignmentRequest[]);
      setAssignmentRequests(requests);
      const nextPending = requests.find(
        (r) =>
          r.patient_id === patient.id &&
          r.status.toUpperCase() === 'PENDING' &&
          requestedTherapistUserId(r) === assignTherapistId,
      );
      setSuccess(
        nextPending
          ? 'Link request sent. The therapist must accept it in Pending requests.'
          : 'Therapist assigned.',
      );
      setShowAssignForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign therapist');
    } finally {
      setAssigning(false);
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!token || !patient) return;
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      await updatePatient(token, patient.id, {
        location: locationDraft.trim() || undefined,
        caregiver_info: {
          fullname: caregiverNameDraft.trim() || undefined,
          relationship: caregiverRelationshipDraft.trim() || undefined,
          email: caregiverEmailDraft.trim() || undefined,
          phone_number: caregiverPhoneDraft.trim() || undefined,
        },
      });
      setSuccess('Patient updated.');
      setEditing(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!token || !patient) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await deleteUser(token, patient.user_id);
      setConfirmDelete(false);
      navigate('/patients', {
        replace: true,
        state: { success: 'Patient account deleted.' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete patient');
      setDeleting(false);
    }
  }

  function cancelEditing() {
    if (!patient) return;
    const caregiverInfo = readCaregiver(patient);
    const patientUser = userById.get(patient.user_id);
    setLocationDraft(patientUser?.location?.trim() ?? '');
    setCaregiverNameDraft(caregiverDisplayName(caregiverInfo) ?? '');
    setCaregiverRelationshipDraft(caregiverInfo?.relationship?.trim() ?? '');
    setCaregiverEmailDraft(caregiverInfo?.email?.trim() ?? '');
    setCaregiverPhoneDraft(caregiverInfo?.phone_number?.trim() ?? '');
    setEditing(false);
  }

  return (
    <div className="admin-page patient-detail">
      <Link to="/patients" className="patient-detail__back">
        ← Back to patients
      </Link>

      {loading ? (
        <p className="admin-page__empty" role="status">
          Loading patient…
        </p>
      ) : !patient ? (
        <div className="admin-page__empty-state">
          <h3>Patient not found</h3>
          <p>{error || 'This patient may have been removed.'}</p>
          <Link to="/patients" className="admin-page__btn admin-page__btn--primary">
            Back to patients
          </Link>
        </div>
      ) : (
        <>
          <div className="patient-detail__status" aria-live="polite" aria-atomic="true">
            {error && (
              <p className="admin-page__error" role="alert">
                {error}
              </p>
            )}
            {success && <p className="admin-page__success">{success}</p>}
          </div>

          <section className="patient-detail__profile" aria-labelledby="patient-name">
            <span className="patient-detail__avatar" aria-hidden="true">
              {initialsFromName(name)}
            </span>
            <div className="patient-detail__profile-body">
              <div className="patient-detail__name-row">
                <h1 id="patient-name">{name}</h1>
                <span className={statusClass}>{statusLabel}</span>
              </div>
              {email ? <p className="patient-detail__meta">{email}</p> : null}
            </div>
          </section>

          <section className="patient-detail__stats" aria-label="Patient statistics">
            <StatCard
              label="Accuracy"
              value={progressStats.accuracy != null ? `${progressStats.accuracy}%` : '—'}
              tone="mint"
            />
            <StatCard label="Sessions" value={String(progressStats.sessions)} tone="navy" />
            <StatCard label="Modules" value={String(carePlanStats.modules)} tone="blue" />
            <StatCard
              label="Weekly target"
              value={
                carePlanStats.weeklyMinutes > 0 ? `${carePlanStats.weeklyMinutes} min` : '—'
              }
              tone="amber"
            />
          </section>

          <div className="patient-detail__layout">
            <div className="patient-detail__main-col">
              <section className="patient-detail__card" aria-labelledby="patient-info-heading">
                <header className="patient-detail__card-head">
                  <h2 id="patient-info-heading">Personal information</h2>
                  <button
                    type="button"
                    className="patient-detail__card-action"
                    onClick={() => (editing ? cancelEditing() : setEditing(true))}
                    aria-expanded={editing}
                  >
                    {editing ? 'Cancel' : 'Update'}
                  </button>
                </header>

                {editing ? (
                  <form className="patient-detail__form" onSubmit={handleUpdate}>
                    <dl className="patient-detail__fields">
                      <FieldRow label="Full name" value={name} />
                      <FieldRow label="Email" value={email || '—'} />
                      <FieldRow label="Date of birth" value={user?.date_of_birth?.trim() || '—'} />
                      <FieldRow label="Joined" value={joined} />
                    </dl>

                    <label className="admin-page__label" htmlFor="patient-update-location">
                      Location
                    </label>
                    <input
                      id="patient-update-location"
                      className="admin-page__input"
                      value={locationDraft}
                      onChange={(e) => setLocationDraft(e.target.value)}
                      disabled={updating}
                    />

                    <h3 className="patient-detail__form-subheading">Caregiver</h3>
                    <div className="patient-detail__form-grid">
                      <div>
                        <label className="admin-page__label" htmlFor="patient-update-cg-name">
                          Name
                        </label>
                        <input
                          id="patient-update-cg-name"
                          className="admin-page__input"
                          value={caregiverNameDraft}
                          onChange={(e) => setCaregiverNameDraft(e.target.value)}
                          disabled={updating}
                        />
                      </div>
                      <div>
                        <label className="admin-page__label" htmlFor="patient-update-cg-rel">
                          Relationship
                        </label>
                        <input
                          id="patient-update-cg-rel"
                          className="admin-page__input"
                          value={caregiverRelationshipDraft}
                          onChange={(e) => setCaregiverRelationshipDraft(e.target.value)}
                          disabled={updating}
                        />
                      </div>
                      <div>
                        <label className="admin-page__label" htmlFor="patient-update-cg-email">
                          Email
                        </label>
                        <input
                          id="patient-update-cg-email"
                          type="email"
                          className="admin-page__input"
                          value={caregiverEmailDraft}
                          onChange={(e) => setCaregiverEmailDraft(e.target.value)}
                          disabled={updating}
                        />
                      </div>
                      <div>
                        <label className="admin-page__label" htmlFor="patient-update-cg-phone">
                          Phone
                        </label>
                        <PhoneInput
                          id="patient-update-cg-phone"
                          value={caregiverPhoneDraft}
                          onChange={setCaregiverPhoneDraft}
                          disabled={updating}
                        />
                      </div>
                    </div>

                    <div className="patient-detail__form-actions">
                      <button
                        type="submit"
                        className="admin-page__btn admin-page__btn--primary"
                        disabled={updating}
                      >
                        {updating ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <dl className="patient-detail__fields">
                    <FieldRow label="Full name" value={name} />
                    <FieldRow label="Email" value={email || '—'} />
                    <FieldRow label="Date of birth" value={user?.date_of_birth?.trim() || '—'} />
                    <FieldRow label="Location" value={location || '—'} />
                    <FieldRow label="Joined" value={joined} />
                  </dl>
                )}
              </section>

              {!editing && (
                <section
                  className="patient-detail__card"
                  aria-labelledby="patient-caregiver-heading"
                >
                  <header className="patient-detail__card-head">
                    <h2 id="patient-caregiver-heading">Caregiver</h2>
                  </header>
                  {caregiverName ? (
                    <dl className="patient-detail__fields">
                      <FieldRow label="Name" value={caregiverName} />
                      <FieldRow
                        label="Relationship"
                        value={caregiver?.relationship?.trim() || '—'}
                      />
                      <FieldRow label="Email" value={caregiver?.email?.trim() || '—'} />
                      <FieldRow label="Phone" value={caregiver?.phone_number?.trim() || '—'} />
                    </dl>
                  ) : (
                    <p className="patient-detail__empty">No caregiver on file.</p>
                  )}
                </section>
              )}

              <section
                id="care-plan"
                className="patient-detail__card"
                aria-labelledby="patient-careplan-heading"
              >
                <header className="patient-detail__card-head">
                  <h2 id="patient-careplan-heading">Care plan</h2>
                </header>
                <PatientCarePlanPanel patientId={patient.id} token={token} />
              </section>
            </div>

            <aside className="patient-detail__side-col">
              <section
                className="patient-detail__card"
                aria-labelledby="patient-therapist-heading"
              >
                <header className="patient-detail__card-head">
                  <h2 id="patient-therapist-heading">Therapist</h2>
                  {linkStatus !== 'PENDING' && (
                    <button
                      type="button"
                      className="patient-detail__card-action"
                      onClick={() => setShowAssignForm((open) => !open)}
                      aria-expanded={showAssignForm}
                    >
                      {showAssignForm
                        ? 'Cancel'
                        : therapistUserId
                          ? 'Change'
                          : 'Assign therapist'}
                    </button>
                  )}
                </header>

                {therapistUserId ? (
                  <div className="patient-detail__therapist">
                    <span className="patient-detail__therapist-avatar" aria-hidden="true">
                      {initialsFromName(therapistName)}
                    </span>
                    <div>
                      <p className="patient-detail__therapist-name">{therapistName}</p>
                      <p className="patient-detail__therapist-status">{statusLabel}</p>
                    </div>
                  </div>
                ) : (
                  <p className="patient-detail__empty">No therapist linked yet.</p>
                )}

                {linkStatus === 'PENDING' && (
                  <p className="patient-detail__hint patient-detail__hint--inline">
                    A link request is pending. Wait for the therapist to accept or reject it.
                  </p>
                )}

                {showAssignForm && linkStatus !== 'PENDING' && (
                  <form className="patient-detail__assign" onSubmit={handleAssign}>
                    <label className="admin-page__label" htmlFor="patient-detail-therapist">
                      {therapistUserId ? 'New therapist' : 'Select therapist'}
                    </label>
                    <select
                      id="patient-detail-therapist"
                      className="patients-assign patient-detail__select"
                      value={assignTherapistId}
                      disabled={assigning}
                      onChange={(e) => setAssignTherapistId(e.target.value)}
                    >
                      <option value="">Select…</option>
                      {verifiedTherapists.map((t) => (
                        <option key={t.id} value={t.user_id}>
                          {therapistUserLabel(t.user_id, userById)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="admin-page__btn admin-page__btn--primary patient-detail__assign-btn"
                      disabled={
                        assigning ||
                        !assignTherapistId ||
                        assignTherapistId === therapistUserId
                      }
                    >
                      {assigning
                        ? 'Saving…'
                        : therapistUserId
                          ? 'Save therapist'
                          : 'Assign therapist'}
                    </button>
                  </form>
                )}
              </section>

              <section className="patient-detail__card" aria-labelledby="patient-activity-heading">
                <header className="patient-detail__card-head">
                  <h2 id="patient-activity-heading">Activity</h2>
                </header>
                <dl className="patient-detail__fields">
                  <FieldRow
                    label="Exercises tracked"
                    value={String(progressStats.exerciseCount)}
                  />
                  <FieldRow label="Questions attempted" value={String(progressStats.questions)} />
                  <FieldRow label="Best streak" value={String(progressStats.streak)} />
                  <FieldRow label="Last session" value={lastSessionLabel} />
                </dl>
              </section>

              <section
                className="patient-detail__card patient-detail__card--danger"
                aria-labelledby="patient-danger-heading"
              >
                <header className="patient-detail__card-head">
                  <h2 id="patient-danger-heading">Account</h2>
                </header>
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--danger"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                >
                  Delete
                </button>
              </section>
            </aside>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete patient account?"
        message={`Delete ${name}? This permanently removes the account.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmDelete(false)}
      />
    </div>
  );
}
