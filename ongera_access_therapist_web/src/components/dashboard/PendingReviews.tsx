import { Link } from 'react-router-dom';
import type { PendingReview } from '../../types/dashboard';
import './ListPanel.css';

export function PendingReviews({ reviews }: { reviews: PendingReview[] }) {
  const items = reviews.slice(0, 6);

  return (
    <section className="list-panel" aria-labelledby="requests-panel-title">
      <header className="list-panel__header">
        <h2 id="requests-panel-title" className="list-panel__title">
          Pending requests
        </h2>
        <span className="list-panel__count">{reviews.length}</span>
      </header>

      <ul className="list-panel__list">
        {items.length === 0 ? (
          <li className="list-panel__item">
            <p className="list-panel__item-desc">No pending patient requests.</p>
          </li>
        ) : (
          items.map((review) => (
            <li key={review.id} className="list-panel__item list-panel__item--doc">
              <span className="list-panel__doc-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.75" />
                </svg>
              </span>
              <div className="list-panel__item-main">
                <p className="list-panel__item-title">{review.patientName}</p>
                <p className="list-panel__item-desc">
                  {review.reason}
                  {review.module ? ` · ${review.module}` : ''}
                </p>
                <p className="list-panel__item-time list-panel__item-time--inline">
                  {review.createdAt}
                </p>
              </div>
              <Link
                to="/care-plans?tab=requests"
                className="list-panel__icon-link"
                aria-label={`View request from ${review.patientName}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
                </svg>
              </Link>
            </li>
          ))
        )}
      </ul>

      <Link to="/care-plans?tab=requests" className="list-panel__footer-btn">
        Review requests
      </Link>
    </section>
  );
}
