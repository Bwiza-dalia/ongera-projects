import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PatientCarePlanPanel } from '../../components/patients/PatientCarePlan';
import { RequestPatientInfo } from '../../components/requests/RequestPatientInfo';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { useAssignmentRequests } from '../../hooks/useAssignmentRequests';
import { usePatientDetail, usePatients } from '../../hooks/usePatients';
import type { CarePlanDraftPrefill } from '../../types/prescription';
import './CarePlansPage.css';

type Tab = 'requests' | 'build';

export function CarePlansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab: Tab = rawTab === 'build' ? 'build' : 'requests';
  const patientId = searchParams.get('patient');

  const { patients } = usePatients();
  const { patient, isLoading: patientLoading } = usePatientDetail(patientId);
  const { pending, requests, isLoading, error, actingId, reload, approve, reject } =
    useAssignmentRequests();

  const [draftPrefill, setDraftPrefill] = useState<CarePlanDraftPrefill | null>(null);

  const displayPending = pending;
  const displayRequestHistory = useMemo(
    () => requests.filter((r) => r.status.toUpperCase() !== 'PENDING'),
    [requests],
  );

  const pendingPagination = usePagination(displayPending, 6);
  const historyPagination = usePagination(displayRequestHistory, 8);

  const buildPatient = useMemo(() => {
    if (!patientId) return null;
    return patient;
  }, [patientId, patient]);

  useEffect(() => {
    if (rawTab === 'prescriptions') {
      const params = new URLSearchParams(searchParams);
      params.set('tab', 'requests');
      params.delete('prescription');
      setSearchParams(params, { replace: true });
    }
  }, [rawTab, searchParams, setSearchParams]);

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    if (next !== 'build') {
      params.delete('patient');
      params.delete('prescription');
      params.delete('request');
    }
    setSearchParams(params);
  }

  async function handleAcceptRequest(reqPatientId: string, reqId: string, patientName: string) {
    if (!window.confirm(`Accept ${patientName} and build their care plan?`)) return;
    await approve(reqId);
    setDraftPrefill({ sourceType: 'request', sourceId: reqId });
    const params = new URLSearchParams();
    params.set('tab', 'build');
    params.set('patient', reqPatientId);
    params.set('request', reqId);
    setSearchParams(params);
  }

  const requestNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of requests) {
      if (r.patientName && !/^Patient\s+[0-9a-f]{6,}$/i.test(r.patientName)) {
        map.set(r.patientId, r.patientName);
      }
    }
    return map;
  }, [requests]);

  function patientLabel(p: { id: string; name: string }) {
    if (!/^Patient\s+[0-9a-f]{6,}$/i.test(p.name)) return p.name;
    return requestNameById.get(p.id) ?? p.name;
  }

  function selectBuildPatient(id: string) {
    if (!id) return;
    setDraftPrefill(null);
    const params = new URLSearchParams();
    params.set('tab', 'build');
    params.set('patient', id);
    setSearchParams(params);
  }

  async function handleDeclineRequest(reqId: string) {
    await reject(reqId);
  }

  return (
    <div className="care-plans-page">
      <header className="care-plans-page__hero">
        <div>
          <h1 className="app-page-title">Care plans</h1>
        </div>
      </header>

      <div className="care-plans-page__tabs" role="tablist">
        {(
          [
            ['requests', `Requests (${displayPending.length})`],
            ['build', 'Build and send'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'care-plans-page__tab care-plans-page__tab--active' : 'care-plans-page__tab'}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <section className="care-plans-page__panel">
          {error && (
            <p className="care-plans-page__error" role="alert">
              {error}
              <button type="button" className="care-plans-page__link-btn" onClick={reload}>
                Retry
              </button>
            </p>
          )}

          {isLoading ? (
            <p className="care-plans-page__empty">Loading requests…</p>
          ) : displayPending.length === 0 ? (
            <div className="care-plans-page__empty-card">
              <p>No pending patient requests.</p>
            </div>
          ) : (
            <div className="care-plans-page__list">
              {pendingPagination.pageItems.map((req) => (
                <article key={req.id} className="care-plans-page__card care-plans-page__card--request">
                  <div className="care-plans-page__card-body">
                    <div className="care-plans-page__card-top">
                      <div>
                        <h2>{req.patientName}</h2>
                        <p>Link request · {req.createdAtLabel}</p>
                      </div>
                      <div className="care-plans-page__card-actions">
                        <button
                          type="button"
                          className="care-plans-page__btn care-plans-page__btn--ghost"
                          disabled={actingId === req.id}
                          onClick={() => handleDeclineRequest(req.id)}
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          className="care-plans-page__btn care-plans-page__btn--primary"
                          disabled={actingId === req.id}
                          onClick={() =>
                            handleAcceptRequest(req.patientId, req.id, req.patientName)
                          }
                        >
                          {actingId === req.id ? 'Accepting…' : 'Accept & build plan'}
                        </button>
                      </div>
                    </div>
                    <RequestPatientInfo info={req.patientInfo} patientName={req.patientName} />
                  </div>
                </article>
              ))}
              <Pagination
                page={pendingPagination.page}
                pageCount={pendingPagination.pageCount}
                rangeStart={pendingPagination.rangeStart}
                rangeEnd={pendingPagination.rangeEnd}
                total={pendingPagination.total}
                onPageChange={pendingPagination.setPage}
                itemLabel="requests"
              />
            </div>
          )}

          {displayRequestHistory.length > 0 && (
            <div className="care-plans-page__history">
              <h3>Recent</h3>
              <ul>
                {historyPagination.pageItems.map((r) => (
                  <li key={r.id}>
                    <span>{r.patientName}</span>
                    <span
                      className={`care-plans-page__status care-plans-page__status--${r.status.toLowerCase()}`}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
              <Pagination
                page={historyPagination.page}
                pageCount={historyPagination.pageCount}
                rangeStart={historyPagination.rangeStart}
                rangeEnd={historyPagination.rangeEnd}
                total={historyPagination.total}
                onPageChange={historyPagination.setPage}
                itemLabel="requests"
              />
            </div>
          )}
        </section>
      )}

      {tab === 'build' && (
        <section className="care-plans-page__panel care-plans-page__panel--build">
          {!patientId ? (
            <div className="care-plans-page__empty-card">
              <p>Select a patient to build a care plan.</p>
              <div className="care-plans-page__field care-plans-page__field--center">
                <label className="care-plans-page__label" htmlFor="build-patient">
                  Your patients
                </label>
                <select
                  id="build-patient"
                  className="care-plans-page__select"
                  value=""
                  onChange={(e) => selectBuildPatient(e.target.value)}
                >
                  <option value="">Select a patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {patientLabel(p)}
                    </option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="care-plans-page__hint">
                    No patients yet — accept a link request first.
                  </p>
                )}
              </div>
              <button type="button" className="care-plans-page__btn" onClick={() => setTab('requests')}>
                View requests
              </button>
            </div>
          ) : patientLoading ? (
            <p className="care-plans-page__empty">Loading patient…</p>
          ) : !buildPatient ? (
            <p className="care-plans-page__error">Patient not found.</p>
          ) : (
            <PatientCarePlanPanel
              patient={buildPatient}
              draftPrefill={draftPrefill}
              onPlanSent={() => setDraftPrefill(null)}
              onChangePatient={() => {
                const params = new URLSearchParams();
                params.set('tab', 'build');
                setSearchParams(params);
              }}
            />
          )}
        </section>
      )}
    </div>
  );
}
