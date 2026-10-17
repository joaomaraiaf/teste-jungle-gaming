import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { publicCatalogSnapshot } from './scripts/public-catalog-snapshot';

export default defineConfig({
  plugins: [react(), publicCatalogSnapshot()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 3002, strictPort: true },
  preview: { host: '127.0.0.1', port: 3002, strictPort: true },
});
