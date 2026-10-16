import {
  calculateCartTotals,
  formatWeiAsEth,
  getCartSubtotalWei,
  parseEthToWei,
} from '@/features/cart/domain/entities/cart-totals';
import type { Order, OrderRejectionCode } from '@/features/orders/domain/entities/order.entity';
import type { AuthStore } from './auth-store';
import { toHex } from './auth-store';
import { couponRate, refreshCart } from './checkout-utils';
import type { CommerceState } from './commerce-store';
export function migrateActivities(state: CommerceState, auth: AuthStore) {
  for (const account of auth.read().accounts) {
    for (const activity of account.activity) {
      const marker = `${account.user.id}:${activity.id}`;
      if (state.migratedActivity[marker]) continue;
      if (!state.orders[activity.id]) {
        const subtotal = getCartSubtotalWei(activity.items);
        const fee = parseEthToWei(activity.estimatedFeeEth);
        const total = parseEthToWei(activity.totalEth);
        state.orders[activity.id] = {
          id: activity.id,
          userId: account.user.id,
          attemptId: activity.attemptId,
          quoteId: activity.id,
          connectionId: activity.id,
          version: 1,
          createdAt: activity.createdAt,
          updatedAt: activity.createdAt,
          status: 'confirmed',
          confirmedAt: activity.createdAt,
          transactionHash: activity.transactionHash,
          snapshot: {
            items: activity.items,
            totals: {
              subtotalEth: formatWeiAsEth(subtotal),
              estimatedFeeEth: activity.estimatedFeeEth,
              discountEth: formatWeiAsEth(subtotal + fee - total),
              totalEth: activity.totalEth,
            },
            collector: {
              displayName: account.profile.displayName || account.user.username,
              username: account.user.username,
              email: account.user.email,
              profileName: account.user.username,
              ensName: account.profile.ensName,
              referralCode: '',
              note: '',
            },
            walletAddress: account.wallets.primary?.walletAddress ?? `0x${'0'.repeat(40)}`,
            network: account.wallets.primary?.network ?? 'ethereum',
            provider:
              activity.walletName === 'MetaMask'
                ? 'metamask'
                : activity.walletName === 'Coinbase Wallet'
                  ? 'coinbase'
                  : 'walletconnect',
          },
        };
      }
      state.migratedActivity[marker] = true;
    }
  }
}
export function resolveOrders(state: CommerceState, now: number) {
  const pending = Object.values(state.orders)
    .filter((order) => order.status === 'pending')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  for (const order of pending) {
    if (order.status !== 'pending' || Date.parse(order.resolveAt) > now) continue;
    let reason: { code: OrderRejectionCode; message: string } | undefined;
    const reject = (code: OrderRejectionCode, message: string) => {
      reason ??= { code, message };
    };
    const connection = state.connections[order.connectionId];
    const quote = state.quotes[order.quoteId];
    if (state.resolutions[order.id] === 'rejected')
      reject(
        'PAYMENT_REFUSED',
        'O pagamento foi recusado pela carteira. Nenhum item foi removido.'
      );
    if (!connection || connection.status !== 'connected')
      reject('WALLET_DISCONNECTED', 'A carteira foi desconectada antes da confirmação.');
    if (
      !quote ||
      quote.pricingVersion !== state.pricingVersion ||
      (quote.couponCode && !couponRate(quote.couponCode, now, state.expiredCoupons))
    )
      reject('QUOTE_CHANGED', 'A cotação mudou. Revise os valores antes de tentar novamente.');
    for (const item of order.snapshot.items) {
      const nft = state.catalog?.find((nft) => nft.id === item.nftId);
      const edition = nft?.editions.find((edition) => edition.id === item.editionId);
      if (!edition || edition.available < item.quantity)
        reject('INSUFFICIENT_STOCK', 'Esta edição não possui mais a quantidade solicitada.');
      else if (edition.priceEth !== item.unitPriceEth)
        reject('QUOTE_CHANGED', 'O preço mudou antes da confirmação. Revise o pedido.');
    }
    const updatedAt = new Date(now).toISOString();
    const { resolveAt: _resolveAt, ...base } = order;
    let terminal: Order;
    if (reason)
      terminal = {
        ...base,
        status: 'rejected',
        version: order.version + 1,
        updatedAt,
        rejectedAt: updatedAt,
        rejection: reason,
      };
    else {
      const changed = new Set<string>();
      for (const item of order.snapshot.items) {
        const nft = state.catalog!.find((nft) => nft.id === item.nftId)!;
        nft.editions.find((edition) => edition.id === item.editionId)!.available -= item.quantity;
        changed.add(nft.id);
      }
      for (const nft of state.catalog!)
        if (changed.has(nft.id)) {
          nft.version++;
          nft.updatedAt = updatedAt;
        }
      const cart = state.carts[order.userId];
      if (cart) {
        cart.items = cart.items.flatMap((item) => {
          const bought = order.snapshot.items.find(
            (bought) => bought.nftId === item.nftId && bought.editionId === item.editionId
          );
          const quantity = item.quantity - (bought?.quantity ?? 0);
          return quantity > 0 ? [{ ...item, quantity }] : [];
        });
        cart.version++;
        if (!cart.items.length) cart.couponCode = null;
        refreshCart(state, cart, now);
        if (!cart.items.length) cart.totals = calculateCartTotals([]);
      }
      terminal = {
        ...base,
        status: 'confirmed',
        version: order.version + 1,
        updatedAt,
        confirmedAt: updatedAt,
        transactionHash: `0x${toHex(crypto.getRandomValues(new Uint8Array(32)))}`,
      };
    }
    state.orders[order.id] = terminal;
  }
}
