import { Link } from 'react-router-dom';
import type { PatientRow } from '../../types/dashboard';
import { Pagination, usePagination } from '../ui/Pagination';
import './PatientTable.css';

function statusLabel(status: PatientRow['status']) {
  switch (status) {
    case 'active':
      return ['Active', 'status-badge--active'];
    case 'inactive':
      return ['Inactive', 'status-badge--inactive'];
    case 'struggling':
      return ['Struggling', 'status-badge--struggling'];
    case 'new':
      return ['New', 'status-badge--new'];
  }
}

export function PatientTable({ patients }: { patients: PatientRow[] }) {
  const pagination = usePagination(patients, 6);

  return (
    <section className="patient-table-card">
      <header className="patient-table-card__header">
        <h2 className="patient-table-card__title">Patients</h2>
        <Link to="/patients" className="patient-table-card__action">
          View all
        </Link>
      </header>

      <div className="patient-table-card__scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Last session</th>
              <th>Accuracy</th>
              <th>Module</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((p) => {
              const [label, badgeClass] = statusLabel(p.status);
              return (
                <tr key={p.id}>
                  <td className="patient-table__name">{p.name}</td>
                  <td>
                    <span className={`status-badge ${badgeClass}`}>{label}</span>
                  </td>
                  <td>{p.lastSession ?? '—'}</td>
                  <td>
                    {p.accuracy != null ? (
                      <span className={p.accuracy < 50 ? 'patient-table__accuracy--low' : 'patient-table__accuracy--good'}>
                        {p.accuracy}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{p.module ?? '—'}</td>
                  <td>{p.streakDays > 0 ? `${p.streakDays}d` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pagination.page}
        pageCount={pagination.pageCount}
        rangeStart={pagination.rangeStart}
        rangeEnd={pagination.rangeEnd}
        total={pagination.total}
        onPageChange={pagination.setPage}
        itemLabel="patients"
      />
    </section>
  );
}
