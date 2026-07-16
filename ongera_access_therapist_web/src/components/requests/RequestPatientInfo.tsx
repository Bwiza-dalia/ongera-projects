import { useEffect, useId, useRef, useState } from 'react';
import type { AssignmentRequestPatientInfo } from '../../services/assignmentService';
import './RequestPatientInfo.css';

function ageDobLabel(info: AssignmentRequestPatientInfo) {
  if (info.age != null && info.dateOfBirthLabel) {
    return `${info.age} yrs · ${info.dateOfBirthLabel}`;
  }
  if (info.age != null) return `${info.age} yrs`;
  return info.dateOfBirthLabel;
}

function caregiverLabel(info: AssignmentRequestPatientInfo) {
  if (!info.caregiverName && !info.caregiverRelationship) return null;
  if (info.caregiverName && info.caregiverRelationship) {
    return `${info.caregiverName} (${info.caregiverRelationship})`;
  }
  return info.caregiverName ?? info.caregiverRelationship ?? null;
}

function summaryBits(info: AssignmentRequestPatientInfo) {
  const bits: string[] = [];
  if (info.age != null) bits.push(`${info.age} yrs`);
  if (info.location) bits.push(info.location);
  const caregiver = caregiverLabel(info);
  if (caregiver) bits.push(caregiver);
  return bits;
}

function detailRows(info: AssignmentRequestPatientInfo) {
  const rows: Array<{ label: string; value: string }> = [];
  const ageDob = ageDobLabel(info);
  if (ageDob) rows.push({ label: 'Age / DOB', value: ageDob });
  if (info.location) rows.push({ label: 'Location', value: info.location });
  if (info.email) rows.push({ label: 'Email', value: info.email });

  const caregiver = caregiverLabel(info);
  if (caregiver) rows.push({ label: 'Caregiver', value: caregiver });
  if (info.caregiverPhone) rows.push({ label: 'Caregiver phone', value: info.caregiverPhone });
  if (info.caregiverEmail) rows.push({ label: 'Caregiver email', value: info.caregiverEmail });
  if (info.note) rows.push({ label: 'Note', value: info.note });
  return rows;
}

export function RequestPatientInfo({
  info,
  patientName,
}: {
  info?: AssignmentRequestPatientInfo;
  patientName?: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!info) return null;

  const rows = detailRows(info);
  if (rows.length === 0) return null;

  const summary = summaryBits(info).join(' · ');

  return (
    <div className="request-patient-info">
      <div className="request-patient-info__summary">
        {summary && <p className="request-patient-info__summary-text">{summary}</p>}
        <button
          type="button"
          className="request-patient-info__view"
          onClick={() => setOpen(true)}
        >
          View
        </button>
      </div>

      {open && (
        <div
          className="request-patient-info__overlay"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="request-patient-info__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="request-patient-info__modal-head">
              <h3 id={titleId}>{patientName ? `${patientName}` : 'Patient details'}</h3>
              <button
                ref={closeRef}
                type="button"
                className="request-patient-info__modal-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <dl className="request-patient-info__details">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className={
                    row.label === 'Note'
                      ? 'request-patient-info__row request-patient-info__row--wide'
                      : 'request-patient-info__row'
                  }
                >
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
