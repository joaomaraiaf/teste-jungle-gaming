import { URL, fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'preload-socket-transport',
      transformIndexHtml: {
        order: 'post',
        handler(_html, context) {
          const chunk = Object.values(context.bundle ?? {}).find(
            (entry) =>
              entry.type === 'chunk' &&
              Object.keys(entry.modules).some((id) =>
                id.includes('/socket.io-client/build/esm/index.js')
              )
          );
          return chunk
            ? [
                {
                  tag: 'link',
                  attrs: { rel: 'modulepreload', href: `/${chunk.fileName}` },
                  injectTo: 'head',
                },
              ]
            : [];
        },
      },
    },
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 3002, strictPort: true },
  preview: { host: '127.0.0.1', port: 3002, strictPort: true },
});
