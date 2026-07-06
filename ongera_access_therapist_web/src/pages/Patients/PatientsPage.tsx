import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PatientCarePlanPanel } from '../../components/patients/PatientCarePlan';
import { getCarePlan } from '../../services/carePlanService';
import { displayModule } from '../../services/patientService';
import { usePatientDetail, usePatients } from '../../hooks/usePatients';
import type { Patient } from '../../types/patients';
import type { PatientStatus } from '../../types/dashboard';
import './PatientsPage.css';

const STATUS_FILTERS: Array<PatientStatus | 'all'> = [
  'all',
  'active',
  'struggling',
  'inactive',
  'new',
];

function statusText(status: PatientStatus) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'struggling':
      return 'Struggling';
    case 'new':
      return 'New';
  }
}

export function PatientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const planPatientId = searchParams.get('plan');
  const { patients, isLoading, error, reload } = usePatients();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(planPatientId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.module?.toLowerCase().includes(q) ||
        p.graduationStatus.toLowerCase().includes(q) ||
        statusText(p.status).toLowerCase().includes(q)
      );
    });
  }, [patients, search, statusFilter]);

  if (selectedId) {
    return (
      <PatientDetailView
        patientId={selectedId}
        onBack={() => {
          setSelectedId(null);
          setSearchParams({});
        }}
        initialTab={planPatientId ? 'plan' : 'overview'}
      />
    );
  }

  return (
    <div className="patients-page">
      <header className="patients-page__hero">
        <h1>Patients</h1>
        <p>
          {isLoading
            ? 'Loading your caseload…'
            : `${patients.length} patient${patients.length === 1 ? '' : 's'} on your caseload`}
        </p>
      </header>

      {error && (
        <div className="patients-page__error" role="alert">
          <p>{error}</p>
          <button type="button" className="patients-page__retry" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      <div className="patients-page__toolbar">
        <div className="patients-page__search-wrap">
          <label className="patients-page__search-label" htmlFor="patient-search">
            Search patients
          </label>
          <div className="patients-page__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <input
              id="patient-search"
              type="search"
              placeholder="Name, module, or status"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="patients-page__filters" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              className={
                statusFilter === status
                  ? 'patients-page__filter patients-page__filter--active'
                  : 'patients-page__filter'
              }
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
              disabled={isLoading}
            >
              {status === 'all' ? 'All' : statusText(status)}
            </button>
          ))}
        </div>
      </div>

      <p className="patients-page__count">
        Showing {filtered.length} patient{filtered.length === 1 ? '' : 's'}
      </p>

      {isLoading ? (
        <p className="patients-page__empty" role="status">
          Loading patients…
        </p>
      ) : filtered.length === 0 ? (
        <p className="patients-page__empty" role="status">
          {patients.length === 0
            ? 'No patients assigned to you yet.'
            : 'No patients match your search.'}
        </p>
      ) : (
        <div className="patients-page__table-wrap">
          <table className="patients-page__table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Status</th>
                <th scope="col">Module</th>
                <th scope="col">Last session</th>
                <th scope="col">Accuracy</th>
                <th scope="col">Streak</th>
                <th scope="col">
                  <span className="patients-page__sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="patients-page__name">{p.name}</td>
                  <td>
                    <span className="patients-page__status">{statusText(p.status)}</span>
                  </td>
                  <td>{displayModule(p) ?? '—'}</td>
                  <td>{p.lastSession ?? '—'}</td>
                  <td>{p.accuracy != null ? `${p.accuracy}%` : '—'}</td>
                  <td>{p.streakDays > 0 ? `${p.streakDays} days` : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="patients-page__view-btn"
                      onClick={() => setSelectedId(p.id)}
                      aria-label={`View ${p.name}`}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PatientDetailView({
  patientId,
  onBack,
  initialTab = 'overview',
}: {
  patientId: string;
  onBack: () => void;
  initialTab?: 'overview' | 'plan';
}) {
  const { patient, isLoading, error } = usePatientDetail(patientId);

  if (isLoading) {
    return (
      <div className="patients-page patients-page--detail">
        <button type="button" className="patients-page__back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          All patients
        </button>
        <p className="patients-page__empty" role="status">
          Loading patient…
        </p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="patients-page patients-page--detail">
        <button type="button" className="patients-page__back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          All patients
        </button>
        <p className="patients-page__error" role="alert">
          {error ?? 'Patient not found'}
        </p>
      </div>
    );
  }

  return <PatientDetail patient={patient} onBack={onBack} initialTab={initialTab} />;
}

function PatientDetail({
  patient,
  onBack,
  initialTab = 'overview',
}: {
  patient: Patient;
  onBack: () => void;
  initialTab?: 'overview' | 'plan';
}) {
  const [tab, setTab] = useState<'overview' | 'plan'>(initialTab);
  const carePlan = getCarePlan(patient.id);
  return (
    <div className="patients-page patients-page--detail">
      <button type="button" className="patients-page__back" onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        All patients
      </button>

      <header className="patients-page__detail-hero">
        <h1>{patient.name}</h1>
        <p className="patients-page__detail-meta">
          Linked {patient.linkedSince} · {patient.graduationStatus}
          {patient.therapistStatus && ` · Therapist: ${patient.therapistStatus}`}
          {carePlan?.status === 'active' && ` · Plan: ${carePlan.moduleName}`}
        </p>
        {patient.therapistName && (
          <p className="patients-page__detail-meta">Assigned therapist: {patient.therapistName}</p>
        )}
        <p className="patients-page__status patients-page__status--large">
          {statusText(patient.status)}
        </p>
      </header>

      <div className="patients-page__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'overview'}
          className={tab === 'overview' ? 'patients-page__tab patients-page__tab--active' : 'patients-page__tab'}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'plan'}
          className={tab === 'plan' ? 'patients-page__tab patients-page__tab--active' : 'patients-page__tab'}
          onClick={() => setTab('plan')}
        >
          Care plan
          {!carePlan && <span className="patients-page__tab-dot" />}
        </button>
      </div>

      {tab === 'plan' ? (
        <PatientCarePlanPanel patient={patient} />
      ) : (
        <>

      <section className="patients-page__panel" aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="patients-page__panel-title">
          Progress
        </h2>
        <dl className="patients-page__meta-grid">
          <div>
            <dt>Last session</dt>
            <dd>{patient.lastSession ?? 'None yet'}</dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>{patient.accuracy != null ? `${patient.accuracy}%` : '—'}</dd>
          </div>
          <div>
            <dt>Streak</dt>
            <dd>{patient.streakDays > 0 ? `${patient.streakDays} days` : '—'}</dd>
          </div>
          <div>
            <dt>Sessions this week</dt>
            <dd>{patient.sessionsThisWeek ?? '—'}</dd>
          </div>
          <div>
            <dt>Total sessions</dt>
            <dd>{patient.totalSessions}</dd>
          </div>
        </dl>
      </section>

      <section className="patients-page__panel" aria-labelledby="assignment-heading">
        <h2 id="assignment-heading" className="patients-page__panel-title">
          Module assignment
        </h2>
        <dl className="patients-page__meta-grid">
          <div>
            <dt>Module</dt>
            <dd>{carePlan?.moduleName ?? patient.module ?? 'Not assigned'}</dd>
          </div>
          <div>
            <dt>Level</dt>
            <dd>{patient.level ?? '—'}</dd>
          </div>
        </dl>
      </section>

      {(patient.caregiverName || patient.caregiverEmail || patient.caregiverPhone) && (
        <section className="patients-page__panel" aria-labelledby="caregiver-heading">
          <h2 id="caregiver-heading" className="patients-page__panel-title">
            Caregiver
          </h2>
          <dl className="patients-page__meta-grid">
            {patient.caregiverName && (
              <div>
                <dt>Name</dt>
                <dd>{patient.caregiverName}</dd>
              </div>
            )}
            {patient.caregiverRelationship && (
              <div>
                <dt>Relationship</dt>
                <dd>{patient.caregiverRelationship}</dd>
              </div>
            )}
            {patient.caregiverEmail && (
              <div>
                <dt>Email</dt>
                <dd>{patient.caregiverEmail}</dd>
              </div>
            )}
            {patient.caregiverPhone && (
              <div>
                <dt>Phone</dt>
                <dd>{patient.caregiverPhone}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {patient.progressEntries && patient.progressEntries.length > 0 && (
        <section className="patients-page__panel" aria-labelledby="exercises-heading">
          <h2 id="exercises-heading" className="patients-page__panel-title">
            Exercise progress
          </h2>
          <div className="patients-page__table-wrap">
            <table className="patients-page__table">
              <thead>
                <tr>
                  <th scope="col">Exercise</th>
                  <th scope="col">Level</th>
                  <th scope="col">Accuracy</th>
                  <th scope="col">Sessions</th>
                  <th scope="col">Last session</th>
                </tr>
              </thead>
              <tbody>
                {patient.progressEntries.map((entry) => (
                  <tr key={entry.exerciseId}>
                    <td>{entry.exerciseId.slice(0, 8)}…</td>
                    <td>{entry.currentLevel ?? '—'}</td>
                    <td>
                      {entry.averageScore != null ? `${Math.round(entry.averageScore)}%` : '—'}
                    </td>
                    <td>{entry.totalSessions}</td>
                    <td>{entry.lastSessionLabel ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
        </>
      )}
    </div>
  );
}
