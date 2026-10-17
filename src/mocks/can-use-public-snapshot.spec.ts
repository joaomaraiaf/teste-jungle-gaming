import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { canUsePublicSnapshot } from './can-use-public-snapshot';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

it('permite conteúdo público somente em uma sessão sem estado anterior', () => {
  expect(canUsePublicSnapshot()).toBe(true);
});

it.each([
  ['localStorage', 'greenmint:mocks:v1'],
  ['localStorage', 'kurio:mock-commerce:v1'],
  ['sessionStorage', 'kurio:mock-network:v1'],
  ['sessionStorage', 'kurio:mock-session:v1'],
] as const)('preserva %s/%s usando os dados REST atuais', (storage, key) => {
  window[storage].setItem(key, '{}');
  expect(canUsePublicSnapshot()).toBe(false);
});

it('recorre à API se o navegador bloquear o armazenamento', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  expect(canUsePublicSnapshot()).toBe(false);
});
