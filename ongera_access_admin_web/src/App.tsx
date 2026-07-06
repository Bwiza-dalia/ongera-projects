import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute, GuestRoute } from './components/auth/AdminRoute';
import { AuthLayout } from './components/auth/AuthLayout';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/Auth/LoginPage';
import { CatalogExercisePage } from './pages/CatalogExercisePage';
import { CatalogModulePage } from './pages/CatalogModulePage';
import { CatalogPage } from './pages/CatalogPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { TherapistsPage } from './pages/TherapistsPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Route>

          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="therapists" element={<TherapistsPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="catalog/vocabulary" element={<VocabularyPage />} />
              <Route path="catalog/:moduleId" element={<CatalogModulePage />} />
              <Route path="catalog/:moduleId/exercises/:exerciseId" element={<CatalogExercisePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
