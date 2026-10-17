import { fileURLToPath } from 'node:url';
import { setupServer } from 'msw/node';
import { createServer, type Plugin } from 'vite';

/** A public build snapshot comes from the same REST handlers, never from private browser storage. */
export function publicCatalogSnapshot(): Plugin {
  let enabled = false;
  return {
    name: 'public-catalog-snapshot',
    configResolved(config) {
      enabled = config.env.VITE_MOCKS_ENABLED === 'true';
    },
    transformIndexHtml: {
      order: 'post',
      async handler() {
        if (!enabled) return;
        const loader = await createServer({
          configFile: false,
          resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
          server: { middlewareMode: true, watch: null, hmr: false, ws: false },
          appType: 'custom',
          mode: 'mock',
        });
        let server: ReturnType<typeof setupServer> | undefined;
        try {
          const { createMockStore } = await loader.ssrLoadModule('/src/mocks/store.ts');
          const { createHttpHandlers } = await loader.ssrLoadModule('/src/mocks/http-handlers.ts');
          const origin = 'http://kurio-build.local/api';
          server = setupServer(
            ...createHttpHandlers(createMockStore(), origin, {
              emitNftUpdated() {},
              disconnect() {},
              connectionCount: () => 0,
              setAvailable() {},
            })
          );
          server.listen({ onUnhandledRequest: 'error' });
          const read = async (path: string) => {
            const response = await fetch(origin + path);
            if (!response.ok) throw new Error(`Public snapshot failed: ${response.status}`);
            return response.json();
          };
          const [catalog, facets, detail] = await Promise.all([
            read('/nfts?page=1&limit=9&search=&sort=newest'),
            read('/catalog/facets'),
            read('/nfts/nft-001'),
          ]);
          const snapshot = { catalog, facets, detail };
          const { renderPublicPage } = await loader.ssrLoadModule('/src/prerender.tsx');
          const templates = [];
          for (const [name, path] of [
            ['home', '/'],
            ['detail', '/market/nft-001'],
          ]) {
            for (const mobile of [false, true]) {
              const html = await renderPublicPage(path, mobile, snapshot);
              if (!html.includes('<main'))
                throw new Error(`Prerender returned no page: ${path}: ${html.slice(0, 800)}`);
              templates.push({
                tag: 'template',
                attrs: { id: `public-${name}-${mobile ? 'mobile' : 'desktop'}` },
                children: html,
                injectTo: 'body' as const,
              });
            }
          }
          return [
            {
              tag: 'script',
              attrs: { id: 'public-catalog-snapshot', type: 'application/json' },
              children: JSON.stringify(snapshot).replace(/</g, '\\u003c'),
              injectTo: 'head' as const,
            },
            ...templates,
            {
              tag: 'script',
              children: `try {
                const fresh = !localStorage.getItem('greenmint:mocks:v1') && !localStorage.getItem('kurio:mock-commerce:v1') && !sessionStorage.getItem('kurio:mock-network:v1') && !sessionStorage.getItem('kurio:mock-session:v1');
                const page = location.pathname === '/' && !location.search ? 'home' : location.pathname === '/market/nft-001' && !location.search ? 'detail' : null;
                const template = fresh && page && document.getElementById('public-' + page + '-' + (matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop'));
                if (template) { const root = document.getElementById('root'); root.append(template.content.cloneNode(true)); root.dataset.prerendered = 'true'; }
                document.querySelectorAll('template[id^="public-"]').forEach(node => node.remove());
              } catch { /* Stored states use the normal client rendering path. */ }`,
              injectTo: 'body' as const,
            },
          ];
        } finally {
          server?.close();
          await loader.close();
        }
      },
    },
  };
}
