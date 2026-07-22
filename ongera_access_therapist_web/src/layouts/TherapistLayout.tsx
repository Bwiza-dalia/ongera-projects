import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { displayName } from '../types/auth';
import './TherapistLayout.css';

export function TherapistLayout() {
  const { user } = useAuth();
  const therapistName = user ? displayName(user) : 'Therapist';

  return (
    <div className="therapist-layout">
      <Sidebar />
      <div className="therapist-layout__main">
        <TopBar therapistName={therapistName} />
        <main className="therapist-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
