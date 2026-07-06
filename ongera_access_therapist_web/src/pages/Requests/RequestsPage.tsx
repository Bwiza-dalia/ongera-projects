import { useNavigate } from 'react-router-dom';
import { useAssignmentRequests } from '../../hooks/useAssignmentRequests';
import './RequestsPage.css';

export function RequestsPage() {
  const navigate = useNavigate();
  const { pending, requests, isLoading, error, actingId, reload, approve, reject } =
    useAssignmentRequests();

  async function handleAccept(patientId: string, requestId: string, patientName: string) {
    if (!window.confirm(`Accept ${patientName} as your patient?`)) return;
    await approve(requestId);
    navigate(`/patients?plan=${patientId}`);
  }

  return (
    <div className="requests-page">
      <header className="requests-page__hero">
        <div>
          <h1>Patient requests</h1>
          <p>Accept prescriptions and link requests from patients who chose you as their therapist.</p>
        </div>
      </header>

      {error && (
        <div className="requests-page__error" role="alert">
          <p>{error}</p>
          <button type="button" className="requests-page__retry" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      <div className="requests-page__stats">
        <div className="requests-page__stat">
          <p className="requests-page__stat-label">Pending</p>
          <p className="requests-page__stat-value">{isLoading ? '…' : pending.length}</p>
        </div>
        <div className="requests-page__stat">
          <p className="requests-page__stat-label">Total requests</p>
          <p className="requests-page__stat-value">{isLoading ? '…' : requests.length}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="requests-page__empty">Loading requests…</p>
      ) : pending.length === 0 ? (
        <div className="requests-page__empty-card">
          <p>No pending requests right now.</p>
          <span>When a patient selects you, their request will appear here for you to accept.</span>
        </div>
      ) : (
        <div className="requests-page__list">
          {pending.map((req) => (
            <article key={req.id} className="requests-page__card">
              <div className="requests-page__card-main">
                <h2>{req.patientName}</h2>
                <p>Prescription / link request · {req.createdAtLabel}</p>
              </div>
              <div className="requests-page__card-actions">
                <button
                  type="button"
                  className="requests-page__btn requests-page__btn--ghost"
                  disabled={actingId === req.id}
                  onClick={() => reject(req.id)}
                >
                  Decline
                </button>
                <button
                  type="button"
                  className="requests-page__btn requests-page__btn--primary"
                  disabled={actingId === req.id}
                  onClick={() => handleAccept(req.patientId, req.id, req.patientName)}
                >
                  {actingId === req.id ? 'Accepting…' : 'Accept & build plan'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {requests.length > pending.length && (
        <section className="requests-page__history">
          <h2>Recent history</h2>
          <ul>
            {requests
              .filter((r) => r.status.toUpperCase() !== 'PENDING')
              .map((r) => (
                <li key={r.id}>
                  <span>{r.patientName}</span>
                  <span
                    className={`requests-page__status requests-page__status--${r.status.toLowerCase()}`}
                  >
                    {r.status}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
