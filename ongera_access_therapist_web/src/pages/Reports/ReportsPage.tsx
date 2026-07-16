import './ReportsPage.css';

export function ReportsPage() {
  return (
    <div className="reports-page">
      <header className="reports-page__hero">
        <h1 className="app-page-title">Reports</h1>
        <p className="app-page-subtitle">Weekly patient progress reports.</p>
      </header>

      <div className="reports-page__empty-card" role="status">
        <p>No reports available yet.</p>
      </div>
    </div>
  );
}
