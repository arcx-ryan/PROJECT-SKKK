import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  build: {
    target: 'firefox31',
  },
  plugins: [
    react(),
    legacy({
      // SEB 2.4.1 on Windows uses an old Firefox/XUL engine.
      targets: ['Firefox >= 31'],
      modernPolyfills: true,
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.ngrok-free.dev'],
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
