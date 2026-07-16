import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';
import App from './App';

// Drop legacy browser-only clinical stores that are no longer used.
try {
  localStorage.removeItem('ongera_prescription_uploads');
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
