import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PatientCarePlanPanel } from '../../components/patients/PatientCarePlan';
import {
  demoPatientToPatient,
  getDemoPendingRequests,
  getDemoRequestHistory,
  isDemoId,
} from '../../data/mockCarePlans';
import { useAssignmentRequests } from '../../hooks/useAssignmentRequests';
import { useModuleCatalog } from '../../hooks/useModules';
import { usePatientDetail, usePatients } from '../../hooks/usePatients';
import {
  createPrescriptionUpload,
  listPrescriptionsWithDemo,
  markPrescriptionSent,
  readPrescriptionFile,
  savePrescription,
} from '../../services/prescriptionService';
import type { CarePlanDraftPrefill, PrescriptionUpload } from '../../types/prescription';
import type { PatientCarePlan } from '../../types/carePlan';
import './CarePlansPage.css';

type Tab = 'requests' | 'prescriptions' | 'build';

function matchPatientByName(patients: { id: string; name: string }[], name?: string) {
  if (!name) return null;
  const q = name.trim().toLowerCase();
  return patients.find((p) => p.name.toLowerCase() === q) ?? null;
}

export function CarePlansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'requests';
  const patientId = searchParams.get('patient');
  const prescriptionId = searchParams.get('prescription');

  const { catalog } = useModuleCatalog();
  const { patients } = usePatients();
  const { patient, isLoading: patientLoading } = usePatientDetail(patientId);
  const { pending, requests, isLoading, error, actingId, reload, approve, reject } =
    useAssignmentRequests();

  const [prescriptions, setPrescriptions] = useState<PrescriptionUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedRx, setSelectedRx] = useState<PrescriptionUpload | null>(null);
  const [rxPatientId, setRxPatientId] = useState('');
  const [draftPrefill, setDraftPrefill] = useState<CarePlanDraftPrefill | null>(null);
  const [dismissedDemoRequestIds, setDismissedDemoRequestIds] = useState<string[]>([]);

  const allModules = useMemo(
    () => catalog.domains.flatMap((d) => d.modules.map((m) => ({ ...m, domainName: d.name }))),
    [catalog],
  );

  const reloadPrescriptions = useCallback(() => {
    setPrescriptions(listPrescriptionsWithDemo());
  }, []);

  const displayPending = useMemo(() => {
    if (pending.length > 0) return pending;
    if (isLoading) return [];
    return getDemoPendingRequests(dismissedDemoRequestIds);
  }, [pending, isLoading, dismissedDemoRequestIds]);

  const displayRequestHistory = useMemo(() => {
    const apiHistory = requests.filter((r) => r.status.toUpperCase() !== 'PENDING');
    if (apiHistory.length > 0) return apiHistory;
    if (isLoading || pending.length > 0) return [];
    return getDemoRequestHistory(dismissedDemoRequestIds).filter(
      (r) => r.status.toUpperCase() !== 'PENDING',
    );
  }, [requests, isLoading, pending.length, dismissedDemoRequestIds]);

  const usingDemoRequests = !isLoading && pending.length === 0 && displayPending.length > 0;

  const patientOptions = useMemo(() => {
    const byId = new Map(patients.map((p) => [p.id, p]));
    for (const demo of ['demo-patient-alice', 'demo-patient-paul', 'demo-patient-marie']) {
      if (!byId.has(demo)) {
        const p = demoPatientToPatient(demo);
        if (p) byId.set(demo, p);
      }
    }
    return Array.from(byId.values());
  }, [patients]);

  const buildPatient = useMemo(() => {
    if (!patientId) return null;
    if (isDemoId(patientId)) return demoPatientToPatient(patientId);
    return patient;
  }, [patientId, patient]);

  useEffect(() => {
    reloadPrescriptions();
  }, [reloadPrescriptions]);

  useEffect(() => {
    if (!prescriptionId) {
      setSelectedRx(null);
      return;
    }
    const rx = listPrescriptionsWithDemo().find((p) => p.id === prescriptionId) ?? null;
    setSelectedRx(rx);
    if (rx?.patientId) setRxPatientId(rx.patientId);
  }, [prescriptionId]);

  useEffect(() => {
    if (tab !== 'prescriptions' || prescriptionId || prescriptions.length === 0) return;
    const first = prescriptions[0];
    setSelectedRx(first);
    setRxPatientId(first.patientId ?? '');
    const params = new URLSearchParams(searchParams);
    params.set('prescription', first.id);
    setSearchParams(params, { replace: true });
  }, [tab, prescriptionId, prescriptions, setSearchParams]);

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

  function resolveModulePrefill(extracted: PrescriptionUpload['extracted']): CarePlanDraftPrefill {
    const byType = extracted.suggestedModuleType
      ? allModules.find((m) => m.domain === extracted.suggestedModuleType)
      : undefined;
    const byName = extracted.suggestedModuleName
      ? allModules.find((m) =>
          m.name.toLowerCase().includes(extracted.suggestedModuleName!.toLowerCase().slice(0, 8)),
        )
      : undefined;
    const mod = byName ?? byType;

    return {
      moduleId: mod?.id,
      moduleName: mod?.name ?? extracted.suggestedModuleName,
      startDate: extracted.startDate,
      sessionsPerWeek: extracted.sessionsPerWeek,
      clinicalNotes: extracted.clinicalNotes,
    };
  }

  async function handleAcceptRequest(reqPatientId: string, reqId: string, patientName: string) {
    if (!window.confirm(`Accept ${patientName} and build their care plan?`)) return;
    if (isDemoId(reqId)) {
      setDismissedDemoRequestIds((ids) => [...ids, reqId]);
    } else {
      await approve(reqId);
    }
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
    if (isDemoId(reqId)) {
      setDismissedDemoRequestIds((ids) => [...ids, reqId]);
      return;
    }
    await reject(reqId);
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError('');
    try {
      const file = files[0];
      const { extracted } = await readPrescriptionFile(file);
      const upload = createPrescriptionUpload(file, extracted);
      savePrescription(upload);
      reloadPrescriptions();
      setSelectedRx(upload);
      setTab('prescriptions');
      const params = new URLSearchParams();
      params.set('tab', 'prescriptions');
      params.set('prescription', upload.id);
      setSearchParams(params);

      const matched = matchPatientByName(patientOptions, extracted.patientName);
      if (matched) setRxPatientId(matched.id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to read prescription');
    } finally {
      setUploading(false);
    }
  }

  function startPlanFromPrescription() {
    if (!selectedRx) return;
    const patientForPlan = rxPatientId || selectedRx.patientId;
    if (!patientForPlan) {
      setUploadError('Select which patient this prescription is for.');
      return;
    }

    const prefill: CarePlanDraftPrefill = {
      ...resolveModulePrefill(selectedRx.extracted),
      sourceType: 'prescription',
      sourceId: selectedRx.id,
    };

    savePrescription({
      ...selectedRx,
      patientId: patientForPlan,
      status: 'ready',
    });
    reloadPrescriptions();
    setDraftPrefill(prefill);

    const params = new URLSearchParams();
    params.set('tab', 'build');
    params.set('patient', patientForPlan);
    params.set('prescription', selectedRx.id);
    setSearchParams(params);
  }

  function handlePlanSent(plan: PatientCarePlan) {
    if (plan.sourceType === 'prescription' && plan.sourceId) {
      markPrescriptionSent(plan.sourceId, plan.patientId);
      reloadPrescriptions();
    }
    setDraftPrefill(null);
  }

  return (
    <div className="care-plans-page">
      <header className="care-plans-page__hero">
        <div>
          <h1>Care plans</h1>
          <p>
            Accept patient requests, upload prescriptions, extract clinical details, and send
            personalized therapy plans.
          </p>
        </div>
        <label className="care-plans-page__upload-btn">
          <input
            type="file"
            accept=".txt,.md,.json,.csv,.pdf,.png,.jpg,.jpeg,image/*,application/pdf,text/*"
            hidden
            disabled={uploading}
            onChange={(e) => {
              void handleUpload(e.target.files);
              e.target.value = '';
            }}
          />
          {uploading ? 'Uploading…' : 'Upload prescription'}
        </label>
      </header>

      {uploadError && (
        <p className="care-plans-page__error" role="alert">
          {uploadError}
        </p>
      )}

      <div className="care-plans-page__tabs" role="tablist">
        {(
          [
            ['requests', `Requests (${displayPending.length})`],
            ['prescriptions', `Prescriptions (${prescriptions.filter((p) => p.status !== 'sent').length})`],
            ['build', 'Build & send'],
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

          {usingDemoRequests && (
            <div className="care-plans-page__demo-banner">
              Sample requests for preview. Real patient link requests will replace these when they
              arrive.
            </div>
          )}

          {isLoading ? (
            <p className="care-plans-page__empty">Loading requests…</p>
          ) : displayPending.length === 0 ? (
            <div className="care-plans-page__empty-card">
              <p>No pending patient requests.</p>
              <span>When a patient selects you, their link request appears here.</span>
            </div>
          ) : (
            <div className="care-plans-page__list">
              {displayPending.map((req) => (
                <article key={req.id} className="care-plans-page__card">
                  <div>
                    <h2>{req.patientName}</h2>
                    <p>Link / prescription request · {req.createdAtLabel}</p>
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
                      onClick={() => handleAcceptRequest(req.patientId, req.id, req.patientName)}
                    >
                      {actingId === req.id ? 'Accepting…' : 'Accept & build plan'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {displayRequestHistory.length > 0 && (
            <div className="care-plans-page__history">
              <h3>Recent</h3>
              <ul>
                {displayRequestHistory.map((r) => (
                    <li key={r.id}>
                      <span>{r.patientName}</span>
                      <span className={`care-plans-page__status care-plans-page__status--${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {tab === 'prescriptions' && (
        <section className="care-plans-page__panel care-plans-page__split">
          <div>
            <h2>Uploaded prescriptions</h2>
            {prescriptions.length === 0 ? (
              <p className="care-plans-page__empty">
                No uploads yet. Use &quot;Upload prescription&quot; for PDF, image, or text files.
              </p>
            ) : (
              <ul className="care-plans-page__rx-list">
                {prescriptions.map((rx) => (
                  <li key={rx.id}>
                    <button
                      type="button"
                      className={
                        selectedRx?.id === rx.id
                          ? 'care-plans-page__rx-item care-plans-page__rx-item--active'
                          : 'care-plans-page__rx-item'
                      }
                      onClick={() => {
                        setSelectedRx(rx);
                        setRxPatientId(rx.patientId ?? '');
                        const params = new URLSearchParams(searchParams);
                        params.set('prescription', rx.id);
                        setSearchParams(params);
                      }}
                    >
                      <strong>{rx.fileName}</strong>
                      <span>{rx.patientName ?? 'Patient not linked'}</span>
                      <span className={`care-plans-page__status care-plans-page__status--${rx.status}`}>
                        {rx.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedRx && (
            <div className="care-plans-page__extract">
              <h2>Extracted information</h2>
              <p className="care-plans-page__hint">
                Review auto-extracted fields from the prescription. Edit by adjusting the care plan
                in the next step.
              </p>
              <dl className="care-plans-page__extract-grid">
                <div>
                  <dt>Patient name (from file)</dt>
                  <dd>{selectedRx.extracted.patientName ?? '—'}</dd>
                </div>
                <div>
                  <dt>Suggested module</dt>
                  <dd>{selectedRx.extracted.suggestedModuleName ?? '—'}</dd>
                </div>
                <div>
                  <dt>Sessions / week</dt>
                  <dd>{selectedRx.extracted.sessionsPerWeek ?? '—'}</dd>
                </div>
                <div>
                  <dt>Start date</dt>
                  <dd>{selectedRx.extracted.startDate ?? '—'}</dd>
                </div>
              </dl>
              {selectedRx.extracted.clinicalNotes && (
                <div className="care-plans-page__notes">
                  <p className="care-plans-page__notes-label">Clinical notes</p>
                  <p>{selectedRx.extracted.clinicalNotes}</p>
                </div>
              )}

              <div className="care-plans-page__field">
                <label className="care-plans-page__label" htmlFor="rx-patient">
                  Assign to patient
                </label>
                <select
                  id="rx-patient"
                  className="care-plans-page__select"
                  value={rxPatientId}
                  onChange={(e) => setRxPatientId(e.target.value)}
                >
                  <option value="">Select patient…</option>
                  {patientOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="care-plans-page__btn care-plans-page__btn--primary"
                onClick={startPlanFromPrescription}
              >
                Build plan from prescription
              </button>
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
              <p className="care-plans-page__hint">
                Or accept a request / process an uploaded prescription.
              </p>
              <button type="button" className="care-plans-page__btn" onClick={() => setTab('requests')}>
                View requests
              </button>
            </div>
          ) : patientLoading && !isDemoId(patientId) ? (
            <p className="care-plans-page__empty">Loading patient…</p>
          ) : !buildPatient ? (
            <p className="care-plans-page__error">Patient not found.</p>
          ) : (
            <PatientCarePlanPanel
              patient={buildPatient}
              draftPrefill={draftPrefill}
              onPlanSent={handlePlanSent}
              onChangePatient={() => {
                const params = new URLSearchParams();
                params.set('tab', 'build');
                setSearchParams(params);
              }}
              demoMode={isDemoId(patientId ?? '')}
            />
          )}
        </section>
      )}
    </div>
  );
}
