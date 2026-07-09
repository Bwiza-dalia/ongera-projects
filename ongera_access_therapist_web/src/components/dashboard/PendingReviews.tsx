import { Link } from 'react-router-dom';
import type { PendingReview } from '../../types/dashboard';
import './ListPanel.css';

export function PendingReviews({ reviews }: { reviews: PendingReview[] }) {
  return (
    <section className="list-panel">
      <header className="list-panel__header">
        <h2 className="list-panel__title">Pending reviews</h2>
        <span className="list-panel__count">{reviews.length}</span>
      </header>

      <ul className="list-panel__list">
        {reviews.length === 0 ? (
          <li className="list-panel__item">
            <p className="list-panel__item-desc">No pending patient requests.</p>
          </li>
        ) : (
          reviews.map((review) => (
            <li key={review.id} className="list-panel__item">
              <div className="list-panel__item-main">
                <p className="list-panel__item-title">{review.patientName}</p>
                <p className="list-panel__item-desc">
                  {review.reason}
                  {review.module && ` · ${review.module}`}
                </p>
              </div>
              <span className="list-panel__item-time">{review.createdAt}</span>
            </li>
          ))
        )}
      </ul>

      <Link to="/care-plans?tab=requests" className="list-panel__footer-btn">
        See all
      </Link>
    </section>
  );
}
