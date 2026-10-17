// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { createAuthStore } from './auth-store';
import { createCommerceBroadcast } from './commerce-broadcast';
import { COMMERCE_STORAGE_KEY, createCommerceStore } from './commerce-store';
import { createNftFixtures } from './fixtures';

it('notifica somente após persistir, sem conteúdo privado no canal, e encerra listeners', () => {
  const records = new Map<string, string>();
  let failing = false;
  const storage = {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (failing && key === COMMERCE_STORAGE_KEY) throw new Error('Full');
      records.set(key, value);
    },
  };
  const auth = createAuthStore(storage);
  const store = createCommerceStore(auth, storage);
  const sockets = { emitNftUpdated: vi.fn(), emitOrderUpdated: vi.fn(), disconnect: vi.fn() };
  const channel = {
    postMessage: vi.fn((notice: unknown) => {
      expect(records.has(COMMERCE_STORAGE_KEY)).toBe(true);
      expect(Object.keys(notice as object).sort()).toEqual(['epoch', 'nftIds', 'orderIds']);
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
  };
  const bridge = createCommerceBroadcast(store, sockets, channel);
  const state = store.read();
  state.catalog = createNftFixtures();
  store.write(state);
  expect(sockets.emitNftUpdated).toHaveBeenCalledTimes(36);
  expect(channel.postMessage).toHaveBeenCalledTimes(1);
  const change = store.read();
  change.catalog![0].version++;
  failing = true;
  expect(() => store.write(change)).toThrow('Full');
  expect(channel.postMessage).toHaveBeenCalledTimes(1);
  failing = false;
  bridge.dispose();
  store.write(change);
  expect(channel.postMessage).toHaveBeenCalledTimes(1);
  expect(channel.close).toHaveBeenCalledTimes(1);
  expect(channel.removeEventListener).toHaveBeenCalledTimes(1);
});
