import { useAppMutation } from '@/core/hooks/use-app-mutation';
import { useAppQuery } from '@/core/hooks/use-app-query';
import type { AuthSession } from '@/features/auth/domain/entities/auth-session.entity';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { useSessionErrorHandler } from '@/features/auth/hooks/use-session-error-handler.hook';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/hooks/use-session-view-model.hook';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createCartUseCase } from '../cart.dependencies';
import { getGuestCartId } from '../data/guest-cart.store';
import type { CartItem } from '../domain/entities/cart-item.entity';
import { getCartItemKey } from '../domain/entities/cart-item.entity';
import { parseEthToWei } from '../domain/entities/cart-totals';
import type { Cart } from '../domain/entities/cart.entity';

export const CART_QUERY_KEY = ['cart'] as const;
export const CART_MUTATION_KEY = ['cart', 'change'] as const;
export function useCartViewModel() {
  const { session, isLoading: isSessionLoading } = useAuthSession();
  const ownerId = session?.user.id ?? null;
  const [guestId, setGuestId] = useState(() => getGuestCartId());
  const previousOwner = useRef(ownerId);
  useLayoutEffect(() => {
    if (!isSessionLoading && previousOwner.current && !ownerId) setGuestId(getGuestCartId(true));
    if (!isSessionLoading) previousOwner.current = ownerId;
  }, [ownerId, isSessionLoading]);
  const client = useQueryClient();
  const onSessionError = useSessionErrorHandler();
  const ownerKey = ownerId ?? guestId;
  const key = useMemo(() => [...CART_QUERY_KEY, ownerKey], [ownerKey]);
  const useCase = useMemo(() => createCartUseCase(guestId, ownerId), [guestId, ownerId]);
  const activeOwner = () =>
    (client.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY)?.user.id ?? null) === ownerId;
  const query = useAppQuery({
    queryKey: key,
    enabled: !isSessionLoading,
    retry: false,
    meta: { private: Boolean(ownerId) },
    queryFn: async ({ signal }) => {
      try {
        if (ownerId) {
          const result = await useCase.merge(guestId);
          if (result.adjustments.length && !signal.aborted)
            toast.info(
              'Carrinho incorporado: algumas quantidades foram ajustadas à disponibilidade.'
            );
        }
        return await useCase.get(signal);
      } catch (error) {
        onSessionError(error);
        throw error;
      }
    },
  });
  const mutation = useAppMutation<Cart, Error, () => Promise<Cart>>({
    mutationKey: [...CART_MUTATION_KEY, ownerKey],
    scope: { id: `cart:${ownerKey}` },
    retry: false,
    meta: { private: Boolean(ownerId), ownerId },
    mutationFn: async (action) => {
      await client.cancelQueries({ queryKey: key });
      return action();
    },
    onSuccess: (cart) => {
      if (activeOwner())
        client.setQueryData<Cart>(key, (old) => (old && old.version > cart.version ? old : cart));
    },
    onError: onSessionError,
    onSettled: () => {
      if (activeOwner()) return client.invalidateQueries({ queryKey: key });
    },
  });
  const change = async (action: () => Promise<Cart>) => {
    try {
      await mutation.mutateAsync(action);
      return true;
    } catch {
      return false;
    }
  };
  const previousCart = useRef<{ ownerKey: string; cart: Cart } | null>(null);
  const [stockNotice, setStockNotice] = useState<{ ownerKey: string; text: string } | null>(null);
  const [priceNotice, setPriceNotice] = useState<{ ownerKey: string; text: string } | null>(null);
  useEffect(() => {
    if (!query.data) return;
    const previous = previousCart.current;
    if (previous?.ownerKey === ownerKey) {
      for (const item of query.data.items) {
        const old = previous.cart.items.find((old) => getCartItemKey(old) === getCartItemKey(item));
        if (old && parseEthToWei(old.unitPriceEth) !== parseEthToWei(item.unitPriceEth)) {
          setPriceNotice({
            ownerKey,
            text: `${item.name}: preço atualizado de ${old.unitPriceEth} ETH para ${item.unitPriceEth} ETH. Revise o resumo antes de comprar.`,
          });
        }
        if (
          old &&
          (old.available !== item.available || old.quantity !== item.quantity) &&
          item.available < old.available
        ) {
          setStockNotice({
            ownerKey,
            text:
              item.available === 0
                ? `${item.name}: esta edição esgotou enquanto estava no seu carrinho. Remova-a para continuar.`
                : item.quantity < old.quantity
                  ? `${item.name}: quantidade ajustada para ${item.quantity} conforme o estoque disponível.`
                  : `${item.name}: disponibilidade atualizada para ${item.available} unidades.`,
          });
        }
      }
    }
    previousCart.current = { ownerKey, cart: query.data };
  }, [query.data, ownerKey]);
  const items = query.data?.items ?? [];
  const find = (itemKey: string) => items.find((item) => getCartItemKey(item) === itemKey);
  return {
    stockNotice: items.some((item) => item.available === 0)
      ? 'Uma edição do seu carrinho esgotou. Remova os itens indisponíveis para continuar.'
      : stockNotice?.ownerKey === ownerKey
        ? stockNotice.text
        : null,
    priceNotice: priceNotice?.ownerKey === ownerKey ? priceNotice.text : null,
    isRefreshing: query.isFetching && !query.isPending,
    hasUnavailable: items.some((item) => item.available === 0),
    id: query.data?.id,
    version: query.data?.version,
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalWei: parseEthToWei(query.data?.totals.subtotalEth ?? '0'),
    discountWei: parseEthToWei(query.data?.totals.discountEth ?? '0'),
    estimatedFeeWei: parseEthToWei(query.data?.totals.estimatedFeeEth ?? '0'),
    totalWei: parseEthToWei(query.data?.totals.totalEth ?? '0'),
    couponCode: query.data?.couponCode ?? null,
    isLoading: isSessionLoading || query.isPending,
    isPending: mutation.isPending,
    error: query.data ? null : query.error,
    refreshError: query.data ? query.error : null,
    retry: () => {
      void query.refetch();
    },
    addItem: (item: CartItem) =>
      change(() =>
        useCase.add({ nftId: item.nftId, editionId: item.editionId, quantity: item.quantity })
      ),
    updateQuantity: (itemKey: string, quantity: number) => {
      const item = find(itemKey);
      if (item) void change(() => useCase.update({ ...item, quantity }));
    },
    removeItem: (itemKey: string) => {
      const item = find(itemKey);
      if (item) void change(() => useCase.remove(item.nftId, item.editionId));
    },
    applyCoupon: (code: string) => change(() => useCase.applyCoupon(code)),
    removeCoupon: () => change(() => useCase.removeCoupon()),
    clearCart: async () => {
      for (const item of items) {
        if (!(await change(() => useCase.remove(item.nftId, item.editionId)))) return;
      }
      if (query.data?.couponCode) await change(() => useCase.removeCoupon());
    },
  };
}
