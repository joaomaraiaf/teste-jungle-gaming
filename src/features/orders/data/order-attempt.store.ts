import { z } from 'zod';
import { createOrderSchema } from './schemas/order.schema';

const schema = z.object({ key: z.uuid(), input: createOrderSchema, orderId: z.uuid().nullable() });
export type OrderAttempt = z.infer<typeof schema>;
const keyFor = (ownerId: string) => `kurio:order-attempt:v1:${ownerId}`;
export function readOrderAttempt(ownerId: string): OrderAttempt | null {
  try {
    const raw = window.sessionStorage.getItem(keyFor(ownerId));
    if (!raw) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
export function writeOrderAttempt(ownerId: string, attempt: OrderAttempt) {
  // Do not send a purchase if its recovery record could not be persisted first.
  window.sessionStorage.setItem(keyFor(ownerId), JSON.stringify(schema.parse(attempt)));
}
export function clearOrderAttempt(ownerId: string) {
  try {
    window.sessionStorage.removeItem(keyFor(ownerId));
  } catch {
    /* The confirmed resource remains available by URL. */
  }
}
export function rememberOrder(ownerId: string, id: string) {
  try {
    window.sessionStorage.setItem(`kurio:last-order:v1:${ownerId}`, id);
  } catch {
    /* The URL carries the confirmed order identity. */
  }
}
export function readLastOrder(ownerId: string) {
  try {
    const id = window.sessionStorage.getItem(`kurio:last-order:v1:${ownerId}`);
    return z.uuid().safeParse(id).success ? id : null;
  } catch {
    return null;
  }
}
