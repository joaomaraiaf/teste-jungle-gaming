export const PRIVATE_DESTINATIONS = [
  '/profile',
  '/wallets',
  '/payment',
  '/payment/confirmation',
  '/activity',
] as const;
export type PrivateDestination = (typeof PRIVATE_DESTINATIONS)[number];
export function isPrivateDestination(value: unknown): value is PrivateDestination {
  return typeof value === 'string' && PRIVATE_DESTINATIONS.some((path) => path === value);
}
