import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser talks only to our Backend API (proxied in dev), never directly to Supabase.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
});
