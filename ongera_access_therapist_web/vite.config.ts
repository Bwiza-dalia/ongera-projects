import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = 'https://ongera-access-api.onrender.com';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
