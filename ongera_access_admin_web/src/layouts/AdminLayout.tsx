import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import './AdminLayout.css';

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-layout__main">
        <TopBar />
        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
