import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/recommend': 'http://localhost:5000',
      '/analytics':  'http://localhost:5000',
      '/moods':      'http://localhost:5000',
      '/search':     'http://localhost:5000',
      '/train':      'http://localhost:5000',
    }
  }
});
