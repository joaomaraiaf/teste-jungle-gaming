// @vitest-environment node

import { setupServer } from 'msw/node';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { AxiosAdapter } from '@/core/api/axios-adapter';
import { createMockEnvironment } from './environment';

const values = new Map<string, string>();
const sessionStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value);
  },
};
const mocks = createMockEnvironment({ origin: 'http://localhost:3897', sessionStorage });
const server = setupServer(...mocks.handlers);
const api = new AxiosAdapter('http://localhost:3897/api');
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => {
  mocks.dispose();
  server.close();
});
it('consome regras pelo método, caminho e busca sem substituir os handlers REST', async () => {
  await api.post('/__mock/network', { rules: [{ path: '/nfts', search: 'Emerald', status: 503 }] });
  expect(await api.get('/nfts', { search: 'GreenMint' })).toMatchObject({ total: 24 });
  await expect(api.get('/nfts', { search: 'Emerald' })).rejects.toMatchObject({ status: 503 });
  expect(await api.get('/nfts', { search: 'Emerald' })).toMatchObject({ total: 1 });
  const restored = createMockEnvironment({ origin: 'http://localhost:3897', sessionStorage });
  server.use(...restored.handlers);
  expect(await api.get('/nfts', { search: 'Emerald' })).toMatchObject({ total: 1 });
  restored.dispose();
});
it('valida controles e permite falha de conexão recuperável', async () => {
  await expect(
    api.post('/__mock/network', { rules: [{ path: '/auth/login', delayMs: -1 }] })
  ).rejects.toMatchObject({ status: 422 });
  await api.post('/__mock/network', { rules: [{ path: '/nfts', status: 0 }] });
  await expect(api.get('/nfts')).rejects.toBeDefined();
  expect(await api.get('/nfts')).toMatchObject({ total: 36 });
});
