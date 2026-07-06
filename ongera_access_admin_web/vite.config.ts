import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = 'https://ongera-access-api.onrender.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
