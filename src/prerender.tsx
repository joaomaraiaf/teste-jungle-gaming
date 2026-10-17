import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import { renderToReadableStream } from 'react-dom/server';
import { Application } from '@/app';
import { setServerMobile } from '@/core/hooks/use-mobile-viewport.hook';
import { router } from '@/router';

export async function renderPublicPage(
  path: string,
  mobile: boolean,
  snapshot: Record<string, unknown>
) {
  const client = new QueryClient();
  if (path === '/') {
    client.setQueryData(
      ['catalog', { page: 1, limit: 9, search: '', sort: 'newest' }],
      snapshot.catalog
    );
    client.setQueryData(['catalog-facets'], snapshot.facets);
  } else client.setQueryData(['market', 'nft', 'nft-001'], snapshot.detail);
  setServerMobile(mobile);
  router.update({
    history: createMemoryHistory({
      initialEntries: [path === '/' ? '/?page=1&limit=9&search=&sort=newest' : path],
    }),
  });
  try {
    await router.load();
    const errors: unknown[] = [];
    const stream = await renderToReadableStream(<Application client={client} />, {
      onError: (error) => {
        errors.push(error);
      },
    });
    await stream.allReady;
    if (errors.length) throw new AggregateError(errors, `Failed to prerender ${path}`);
    return await new Response(stream).text();
  } finally {
    client.clear();
  }
}
