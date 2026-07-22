import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AdminRoute, GuestRoute } from './components/auth/AdminRoute';
import { AuthLayout } from './components/auth/AuthLayout';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { ModulesLayout } from './layouts/ModulesLayout';
import { LoginPage } from './pages/Auth/LoginPage';
import { CatalogExercisePage } from './pages/CatalogExercisePage';
import { CatalogModulePage } from './pages/CatalogModulePage';
import { CatalogPage } from './pages/CatalogPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { TherapistsPage } from './pages/TherapistsPage';

function LegacyCatalogModuleRedirect() {
  const { moduleId } = useParams();
  return <Navigate to={`/modules/${moduleId}`} replace />;
}

function LegacyCatalogExerciseRedirect() {
  const { moduleId, exerciseId } = useParams();
  const { search } = useLocation();
  return <Navigate to={`/modules/${moduleId}/exercises/${exerciseId}${search}`} replace />;
}

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
              <Route path="therapists" element={<TherapistsPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="patients/:patientId" element={<PatientDetailPage />} />
              <Route path="modules" element={<ModulesLayout />}>
                <Route index element={<CatalogPage />} />
                <Route path="vocabulary" element={<VocabularyPage />} />
              </Route>
              <Route path="modules/:moduleId" element={<CatalogModulePage />} />
              <Route path="modules/:moduleId/exercises/:exerciseId" element={<CatalogExercisePage />} />
              {/* Legacy paths */}
              <Route path="vocabulary" element={<Navigate to="/modules/vocabulary" replace />} />
              <Route path="catalog" element={<Navigate to="/modules" replace />} />
              <Route path="catalog/vocabulary" element={<Navigate to="/modules/vocabulary" replace />} />
              <Route path="catalog/:moduleId" element={<LegacyCatalogModuleRedirect />} />
              <Route
                path="catalog/:moduleId/exercises/:exerciseId"
                element={<LegacyCatalogExerciseRedirect />}
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
