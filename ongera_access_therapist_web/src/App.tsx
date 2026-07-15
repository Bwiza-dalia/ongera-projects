import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from './components/auth/AuthLayout';
import { GuestRoute, ProtectedRoute, VerifiedTherapistRoute } from './components/auth/ProtectedRoute';
import { TherapistLayout } from './layouts/TherapistLayout';
import { LoginPage } from './pages/Auth/LoginPage';
import { PendingApprovalPage } from './pages/Auth/PendingApprovalPage';
import { SignupPage } from './pages/Auth/SignupPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ModulesPage } from './pages/Modules/ModulesPage';
import { PatientsPage } from './pages/Patients/PatientsPage';
import { CarePlansPage } from './pages/CarePlans/CarePlansPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="pending-approval" element={<PendingApprovalPage />} />
          </Route>

          <Route element={<VerifiedTherapistRoute />}>
            <Route element={<TherapistLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="modules" element={<ModulesPage />} />
              <Route path="care-plans" element={<CarePlansPage />} />
              <Route path="requests" element={<Navigate to="/care-plans?tab=requests" replace />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="messages" element={<Navigate to="/notifications" replace />} />
              <Route path="settings" element={<PlaceholderPage title="Settings" />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
