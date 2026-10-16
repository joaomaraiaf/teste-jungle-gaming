// Definitions for the handlers introduced in stages 3–5; not selectable by reset yet.
export const COMMERCE_SCENARIOS = {
  confirmed: { outcome: 'confirmed', resolveAfterMs: 1_000, timeoutAfterCreation: false },
  refused: { outcome: 'rejected', resolveAfterMs: 1_000, timeoutAfterCreation: false },
  'timeout-after-create': {
    outcome: 'confirmed',
    resolveAfterMs: 1_000,
    timeoutAfterCreation: true,
  },
  'last-unit': {
    outcome: 'confirmed',
    resolveAfterMs: 1_000,
    timeoutAfterCreation: false,
    nftId: 'nft-001',
    editionId: 'edition-one',
    available: 1,
  },
} as const;

export const COUPON_FIXTURES = [
  { code: 'KURIO10', discountBasisPoints: 1_000, expiresAt: null },
  { code: 'EXPIRADO', discountBasisPoints: 1_000, expiresAt: '2020-01-01T00:00:00.000Z' },
] as const;
