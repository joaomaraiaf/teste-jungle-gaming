import { cartSchema, cartSelectionSchema } from '@/features/cart/data/schemas/cart.schema';
import { favoritesSchema } from '@/features/favorites/data/schemas/favorites.schema';
import { quoteTotalsSchema } from '@/features/quotes/data/schemas/quote.schema';
import { describe, expect, it } from 'vitest';
import { orderUpdatedEventSchema } from './order-updated-event.schema';
import { confirmedOrderSchema, orderSchema } from './order.schema';

const id = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const date = '2026-10-16T12:00:00.000Z';
const item = {
  nftId: 'nft-001',
  editionId: 'standard',
  quantity: 2,
  name: 'Emerald Ape #042',
  imageUrl: null,
  collection: 'Kurio Apes',
  tokenId: '0042',
  editionName: '1/10',
  unitPriceEth: '1.123456789012345678',
  available: 10,
};
const totals = {
  subtotalEth: '2.246913578024691356',
  discountEth: '0',
  estimatedFeeEth: '0.016',
  totalEth: '2.262913578024691356',
};
const collector = {
  displayName: 'Colecionador',
  username: 'demo',
  email: 'demo@example.com',
  profileName: 'Coleção',
  ensName: '',
  referralCode: '',
  note: '',
};
const base = {
  id,
  userId: id,
  attemptId: id,
  quoteId: id,
  connectionId: id,
  version: 1,
  createdAt: date,
  updatedAt: date,
  snapshot: {
    items: [item],
    totals,
    collector,
    walletAddress: `0x${'a'.repeat(40)}`,
    provider: 'metamask',
    network: 'ethereum',
  },
};
const confirmed = {
  ...base,
  status: 'confirmed',
  confirmedAt: date,
  transactionHash: `0x${'A'.repeat(64)}`,
};

describe('contratos da próxima integração de comércio', () => {
  it('preserva precisão decimal e rejeita totais incoerentes ou descontos excessivos', () => {
    expect(quoteTotalsSchema.parse(totals)).toEqual(totals);
    expect(quoteTotalsSchema.safeParse({ ...totals, totalEth: '2.26' }).success).toBe(false);
    expect(
      quoteTotalsSchema.safeParse({ ...totals, discountEth: '3', totalEth: '0' }).success
    ).toBe(false);
    expect(quoteTotalsSchema.safeParse({ ...totals, subtotalEth: 2.24 }).success).toBe(false);
  });
  it('rejeita frações de quantidade e duplicatas de recursos', () => {
    expect(cartSelectionSchema.safeParse({ ...item, quantity: 1.5 }).success).toBe(false);
    expect(cartSelectionSchema.safeParse({ ...item, quantity: 0 }).success).toBe(false);
    expect(
      cartSchema.safeParse({
        id,
        userId: id,
        version: 1,
        items: [item, item],
        couponCode: null,
        totals,
      }).success
    ).toBe(false);
    expect(
      favoritesSchema.safeParse({ userId: id, version: 1, nftIds: ['nft-001', 'nft-001'] }).success
    ).toBe(false);
  });
  it('distingue pedido pendente, recibo confirmado e recusa com motivo', () => {
    const pending = { ...base, status: 'pending', resolveAt: date };
    expect(orderSchema.parse(pending).status).toBe('pending');
    expect(confirmedOrderSchema.safeParse(pending).success).toBe(false);
    expect(confirmedOrderSchema.parse(confirmed).transactionHash).toBe(confirmed.transactionHash);
    expect(orderSchema.safeParse({ ...base, status: 'rejected', rejectedAt: date }).success).toBe(
      false
    );
    expect(
      orderSchema.parse({
        ...base,
        status: 'rejected',
        rejectedAt: date,
        rejection: { code: 'PAYMENT_REFUSED', message: 'Pagamento recusado.' },
      }).status
    ).toBe('rejected');
  });
  it('rejeita eventos cuja conta, recurso ou versão não correspondem ao pedido', () => {
    const event = {
      eventId: 'order.updated:1',
      type: 'order.updated',
      resourceId: id,
      userId: id,
      version: 1,
      occurredAt: date,
      data: confirmed,
    };
    expect(orderUpdatedEventSchema.safeParse(event).success).toBe(true);
    expect(orderUpdatedEventSchema.safeParse({ ...event, userId: otherId }).success).toBe(false);
    expect(orderUpdatedEventSchema.safeParse({ ...event, resourceId: otherId }).success).toBe(
      false
    );
    expect(orderUpdatedEventSchema.safeParse({ ...event, version: 2 }).success).toBe(false);
  });
});
