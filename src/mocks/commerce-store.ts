import { z } from 'zod';
import { cartSchema } from '@/features/cart/data/schemas/cart.schema';
import { nftSchema } from '@/features/catalog/data/schemas/catalog.schema';
import { favoritesSchema } from '@/features/favorites/data/schemas/favorites.schema';
import { createOrderSchema, orderSchema } from '@/features/orders/data/schemas/order.schema';
import { walletConnectionSchema } from '@/features/payment/data/schemas/wallet-connection.schema';
import { quoteSchema } from '@/features/quotes/data/schemas/quote.schema';
import type { AuthStore } from './auth-store';

export const COMMERCE_STORAGE_KEY = 'kurio:mock-commerce:v1';
export const checkoutScenarioSchema = z.object({
  outcome: z.enum(['confirmed', 'rejected']).default('confirmed'),
  resolveAfterMs: z.number().int().min(0).max(60_000).default(1_000),
  timeoutAfterCreation: z.boolean().default(false),
  refuseConnection: z.boolean().default(false),
});
const schema = z.object({
  epoch: z.string(),
  carts: z.record(z.string(), cartSchema),
  favorites: z.record(z.string(), favoritesSchema),
  merges: z.record(z.string(), z.string()),
  catalog: z.array(nftSchema).nullable().default(null),
  quotes: z.record(z.string(), quoteSchema).default({}),
  acceptedQuotes: z.record(z.string(), z.boolean()).default({}),
  connections: z.record(z.string(), walletConnectionSchema).default({}),
  orders: z.record(z.string(), orderSchema).default({}),
  attempts: z
    .record(z.string(), z.object({ orderId: z.uuid(), input: createOrderSchema }))
    .default({}),
  resolutions: z.record(z.string(), z.enum(['confirmed', 'rejected'])).default({}),
  migratedActivity: z.record(z.string(), z.boolean()).default({}),
  expiredCoupons: z.array(z.string()).default([]),
  pricingVersion: z.number().int().positive().default(1),
  checkoutScenario: checkoutScenarioSchema.default(() => checkoutScenarioSchema.parse({})),
});
export interface CommerceChange {
  epoch: string;
  nftIds: string[];
  orderIds: string[];
}
export type CommerceState = z.infer<typeof schema>;
let fallbackQueue = Promise.resolve();
export function createCommerceStore(
  auth: AuthStore,
  storage?: Pick<Storage, 'getItem' | 'setItem'>
) {
  let memory: CommerceState | undefined;
  const listeners = new Set<(change: CommerceChange) => void>();
  return {
    read(): CommerceState {
      const epoch = auth.read().sessionEpoch;
      const raw = storage?.getItem(COMMERCE_STORAGE_KEY);
      const parsed = raw ? schema.safeParse(JSON.parse(raw)) : undefined;
      if (parsed?.success) memory = parsed.data;
      if (!memory || memory.epoch !== epoch)
        memory = schema.parse({ epoch, carts: {}, favorites: {}, merges: {} });
      const owners = new Set(auth.read().accounts.map((account) => account.user.id));
      for (const [key, cart] of Object.entries(memory.carts))
        if (cart.userId && !owners.has(cart.userId)) delete memory.carts[key];
      for (const owner of Object.keys(memory.favorites))
        if (!owners.has(owner)) delete memory.favorites[owner];
      return structuredClone(memory);
    },
    write(state: CommerceState) {
      const parsed = schema.parse(state);
      const before = memory;
      storage?.setItem(COMMERCE_STORAGE_KEY, JSON.stringify(parsed));
      memory = parsed;
      const previousNfts = new Map(before?.catalog?.map((nft) => [nft.id, nft.version]));
      const change: CommerceChange = {
        epoch: parsed.epoch,
        nftIds: (parsed.catalog ?? [])
          .filter((nft) => previousNfts.get(nft.id) !== nft.version)
          .map((nft) => nft.id),
        orderIds: Object.values(parsed.orders)
          .filter((order) => before?.orders[order.id]?.version !== order.version)
          .map((order) => order.id),
      };
      if (change.nftIds.length || change.orderIds.length || before?.epoch !== parsed.epoch) {
        for (const listener of listeners) listener(change);
      }
    },
    subscribe(listener: (change: CommerceChange) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async exclusive<T>(action: () => Promise<T> | T): Promise<T> {
      if (typeof navigator !== 'undefined' && navigator.locks)
        return navigator.locks.request('kurio:commerce', async () => await action());
      const result = fallbackQueue.then(action);
      fallbackQueue = result.then(
        () => undefined,
        () => undefined
      );
      return result;
    },
  };
}
export type CommerceStore = ReturnType<typeof createCommerceStore>;
