import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PatientProgress } from '../../components/patients/PatientProgress';
import { Pagination, usePagination } from '../../components/ui/Pagination';
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

  const pagination = usePagination(filtered, 10, `${search}|${statusFilter}`);

  if (selectedId) {
    return (
      <PatientDetailView
        patientId={selectedId}
        onBack={() => {
          setSelectedId(null);
          setSearchParams({});
        }}
      />
    );
  }

  return (
    <div className="patients-page">
      <header className="patients-page__hero">
        <h1 className="app-page-title">Patients</h1>
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
              {pagination.pageItems.map((p) => (
                <tr key={p.id}>
                  <td className="patients-page__name">{p.name}</td>
                  <td>
                    <span className={`patients-page__status patients-page__status--${p.status}`}>
                      {statusText(p.status)}
                    </span>
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
          <Pagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            total={pagination.total}
            onPageChange={pagination.setPage}
            itemLabel="patients"
          />
        </div>
      )}
    </div>
  );
}

function PatientDetailView({
  patientId,
  onBack,
}: {
  patientId: string;
  onBack: () => void;
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

  return <PatientDetail patient={patient} onBack={onBack} />;
}

function patientInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'P';
}

function PatientDetail({
  patient,
  onBack,
}: {
  patient: Patient;
  onBack: () => void;
}) {
  const moduleLabel = displayModule(patient);
  const hasCaregiver = Boolean(
    patient.caregiverName || patient.caregiverEmail || patient.caregiverPhone,
  );

  const profileRows: Array<{ label: string; value: string }> = [
    { label: 'Status', value: statusText(patient.status) },
    ...(moduleLabel ? [{ label: 'Module', value: moduleLabel }] : []),
    ...(patient.level ? [{ label: 'Level', value: String(patient.level) }] : []),
    { label: 'Linked', value: patient.linkedSince },
    ...(patient.lastSession ? [{ label: 'Last session', value: patient.lastSession }] : []),
    ...(patient.accuracy != null ? [{ label: 'Accuracy', value: `${patient.accuracy}%` }] : []),
    ...(patient.totalSessions > 0
      ? [{ label: 'Sessions', value: String(patient.totalSessions) }]
      : []),
    ...(patient.totalHintsUsed > 0
      ? [{ label: 'Hints used', value: String(patient.totalHintsUsed) }]
      : []),
  ];

  return (
    <div className="patients-page patients-page--detail">
      <button type="button" className="patients-page__back" onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        All patients
      </button>

      <div className="patients-page__profile-layout">
        <aside className="patients-page__profile-col">
          <section className="patient-profile-card">
            <div className="patient-profile-card__identity">
              <span className="patient-profile-card__avatar" aria-hidden="true">
                {patientInitials(patient.name)}
              </span>
              <h1 className="patient-profile-card__name">{patient.name}</h1>
              <p className="patient-profile-card__role">
                {[moduleLabel, patient.level ? `Level ${patient.level}` : null]
                  .filter(Boolean)
                  .join(' · ') || 'Patient'}
              </p>
              <span
                className={`patients-page__status patients-page__status--large patients-page__status--${patient.status}`}
              >
                {statusText(patient.status)}
              </span>
            </div>

            <div className="patient-profile-card__actions patient-profile-card__actions--single">
              <Link
                to={`/care-plans?tab=build&patient=${patient.id}`}
                className="patient-profile-card__btn patient-profile-card__btn--accent"
              >
                Open care plan
              </Link>
            </div>

            <div className="patient-profile-card__about">
              <h2 className="patient-profile-card__heading">About</h2>
              <dl className="patient-profile-card__rows">
                {profileRows.map((row) => (
                  <div key={row.label} className="patient-profile-card__row">
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {hasCaregiver && (
            <section className="patient-profile-card" aria-labelledby="caregiver-heading">
              <h2 id="caregiver-heading" className="patient-profile-card__heading">
                Caregiver
              </h2>
              <ul className="patient-profile-card__contacts">
                {patient.caregiverName && (
                  <li className="patient-profile-card__contact">
                    <span className="patient-profile-card__contact-avatar" aria-hidden="true">
                      {patientInitials(patient.caregiverName)}
                    </span>
                    <div>
                      <p className="patient-profile-card__contact-name">{patient.caregiverName}</p>
                      <p className="patient-profile-card__contact-meta">
                        {patient.caregiverRelationship ?? 'Caregiver'}
                      </p>
                    </div>
                  </li>
                )}
                {patient.caregiverPhone && (
                  <li className="patient-profile-card__contact-line">
                    <span>Phone</span>
                    <a href={`tel:${patient.caregiverPhone}`}>{patient.caregiverPhone}</a>
                  </li>
                )}
                {patient.caregiverEmail && (
                  <li className="patient-profile-card__contact-line">
                    <span>Email</span>
                    <a href={`mailto:${patient.caregiverEmail}`}>{patient.caregiverEmail}</a>
                  </li>
                )}
              </ul>
            </section>
          )}
        </aside>

        <div className="patients-page__main-col">
          <PatientProgress patient={patient} sections={['chart']} />

          <section className="patients-page__tab-card">
            <div className="patients-page__tab-body">
              <PatientProgress
                patient={patient}
                sections={['kpis', 'sessions', 'exercises']}
                embedded
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
