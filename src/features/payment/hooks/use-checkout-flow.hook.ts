import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';
import { ApiError } from '@/core/api/api-error';
import { useAppMutation } from '@/core/hooks/use-app-mutation';
import { useAppQuery } from '@/core/hooks/use-app-query';
import type { AuthSession } from '@/features/auth/domain/entities/auth-session.entity';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { useSessionErrorHandler } from '@/features/auth/hooks/use-session-error-handler.hook';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/hooks/use-session-view-model.hook';
import type { Cart } from '@/features/cart/domain/entities/cart.entity';
import { useCart } from '@/features/cart/hooks/use-cart.hook';
import { rememberOrder } from '@/features/orders/data/order-attempt.store';
import { useOrderAttempt } from '@/features/orders/hooks/use-order-attempt.hook';
import type { Quote } from '@/features/quotes/domain/entities/quote.entity';
import { createQuotesUseCase } from '@/features/quotes/quotes.dependencies';
import type {
  SavedWallet,
  SavedWallets,
  WalletSlot,
} from '@/features/wallets/domain/entities/saved-wallet.entity';
import { useWalletActions, WALLETS_QUERY_KEY } from '@/features/wallets/hooks/use-wallets.hook';
import { walletsUseCase } from '@/features/wallets/wallets.dependencies';
import { clearPaymentDraft } from '../data/payment-draft.store';
import type { PaymentFormValues } from '../data/schemas/payment-form.schema';
import type { WalletConnection, WalletNetwork } from '../domain/entities/wallet-connection.entity';
import { createWalletConnectionUseCase } from '../payment.dependencies';

export const QUOTE_QUERY_KEY = ['quote'] as const;
export const CHECKOUT_MUTATION_KEY = ['checkout'] as const;

interface ConnectWalletInput {
  network: WalletNetwork;
  provider: WalletConnection['provider'];
  walletSlot: WalletSlot;
  walletAddress: string;
}

export function useCheckoutFlow(form: UseFormReturn<PaymentFormValues>) {
  const { session, refreshSession } = useAuthSession();
  const ownerId = session?.user.id ?? '';
  const cart = useCart();
  const client = useQueryClient();
  const navigate = useNavigate();
  const onSessionError = useSessionErrorHandler();
  const quotes = useMemo(() => createQuotesUseCase(ownerId), [ownerId]);
  const wallets = useMemo(() => createWalletConnectionUseCase(ownerId), [ownerId]);
  const walletActions = useWalletActions();
  const attempt = useOrderAttempt(ownerId);
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [review, setReview] = useState<Quote | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const previousQuote = useRef<Quote | null>(null);
  const networkValue = useWatch({ control: form.control, name: 'network' });
  const provider = useWatch({ control: form.control, name: 'walletProvider' });
  const secondary = useWatch({ control: form.control, name: 'useSecondaryWallet' });
  const address = useWatch({ control: form.control, name: 'walletAddress' });
  const network: WalletNetwork | null = ['ethereum', 'polygon', 'solana'].includes(networkValue)
    ? (networkValue as WalletNetwork)
    : null;
  const active = () =>
    client.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY)?.user.id === ownerId;
  const connected =
    connection?.status === 'connected' &&
    connection.network === network &&
    connection.provider === provider &&
    connection.walletSlot === (secondary ? 'secondary' : 'primary') &&
    connection.walletAddress === address;
  const quoteQuery = useAppQuery({
    queryKey: [...QUOTE_QUERY_KEY, ownerId, cart.id, cart.version, network],
    enabled: Boolean(
      ownerId && cart.id && cart.items.length && !cart.isLoading && network && !attempt.attempt
    ),
    retry: false,
    meta: { private: true },
    queryFn: async ({ signal }) => {
      try {
        const quote = await quotes.create(
          {
            cartId: cart.id!,
            cartVersion: cart.version!,
            network: network!,
            previousQuoteId: previousQuote.current?.id,
          },
          signal
        );
        if (!signal.aborted && active()) previousQuote.current = quote;
        return quote;
      } catch (error) {
        onSessionError(error);
        throw error;
      }
    },
  });
  useEffect(() => {
    if (quoteQuery.data) setReview(quoteQuery.data);
  }, [quoteQuery.data]);
  const quote =
    review && review.cartVersion === cart.version && review.network === network
      ? review
      : quoteQuery.data;
  const quoteRef = useRef(quote);
  quoteRef.current = quote;
  const handled = useRef<string | null>(null);
  useEffect(() => {
    const order = attempt.order;
    if (!order || order.status !== 'confirmed' || handled.current === order.id || !active()) return;
    handled.current = order.id;
    rememberOrder(ownerId, order.id);
    clearPaymentDraft(ownerId);
    attempt.complete();
    void Promise.all([
      client.invalidateQueries({ queryKey: ['cart', ownerId] }),
      client.invalidateQueries({ queryKey: ['catalog'] }),
      client.invalidateQueries({ queryKey: ['market'] }),
      client.invalidateQueries({ queryKey: ['activity', ownerId] }),
    ]);
    void navigate({ to: '/payment/confirmation', search: { orderId: order.id } });
  });
  const connect = useAppMutation({
    mutationKey: [...CHECKOUT_MUTATION_KEY, ownerId, 'connect'],
    retry: false,
    meta: { private: true, ownerId },
    onError: onSessionError,
    mutationFn: async (input?: ConnectWalletInput) => {
      const selectedNetwork = input?.network ?? network;
      const selectedProvider = input?.provider ?? provider;
      const walletSlot = input?.walletSlot ?? (secondary ? 'secondary' : 'primary');
      if (!selectedNetwork) throw new Error('Selecione uma rede antes de conectar.');
      const fresh = await refreshSession();
      if (fresh?.user.id !== ownerId) throw new Error('Entre novamente para conectar.');
      const result = await wallets.connect({
        network: selectedNetwork,
        provider: selectedProvider,
        walletSlot,
      });
      if (result.walletAddress !== (input?.walletAddress ?? form.getValues('walletAddress'))) {
        if (result.status === 'connected') await wallets.disconnect(result.id);
        throw new Error(
          'Selecione a carteira cadastrada: o endereço informado não corresponde à carteira salva.'
        );
      }
      if (active()) {
        setConnection(result);
        setNotice(
          result.status === 'refused' ? 'A conexão foi recusada. Tente conectar novamente.' : null
        );
      }
      return result;
    },
  });
  const disconnect = useAppMutation({
    mutationKey: [...CHECKOUT_MUTATION_KEY, ownerId, 'disconnect'],
    retry: false,
    meta: { private: true, ownerId },
    onError: onSessionError,
    mutationFn: async () => {
      if (!connection) throw new Error('Nenhuma carteira conectada.');
      return wallets.disconnect(connection.id);
    },
    onSuccess: (result) => {
      if (active()) setConnection(result);
    },
  });
  const accepting = useAppMutation({
    mutationKey: [...CHECKOUT_MUTATION_KEY, ownerId, 'accept'],
    retry: false,
    meta: { private: true, ownerId },
    onError: onSessionError,
    onMutate: () => client.cancelQueries({ queryKey: [...QUOTE_QUERY_KEY, ownerId] }),
    mutationFn: async () => {
      if (!quoteRef.current) throw new Error('Carregue a cotação.');
      return quotes.accept(quoteRef.current.id);
    },
    onSuccess: async (result) => {
      if (active()) {
        previousQuote.current = result;
        setReview(result);
        setNotice(null);
        await client.invalidateQueries({ queryKey: ['cart', ownerId] });
      }
    },
  });
  const submitting = useRef(false);
  const prepareWallet = async (values: PaymentFormValues): Promise<WalletSlot> => {
    const saved = await client.fetchQuery<SavedWallets>({
      queryKey: [...WALLETS_QUERY_KEY, ownerId],
      queryFn: () => walletsUseCase.getWallets(),
      staleTime: 0,
    });
    const address = values.walletAddress.trim().toLowerCase();
    const preferredSlot: WalletSlot = values.useSecondaryWallet ? 'secondary' : 'primary';
    const matchingSlot = (
      [preferredSlot, preferredSlot === 'primary' ? 'secondary' : 'primary'] as const
    ).find((slot) => {
      const wallet = saved[slot];
      return (
        wallet?.network === values.network &&
        wallet.walletAddress.trim().toLowerCase() === address &&
        wallet.walletType === values.walletType
      );
    });

    let slot = matchingSlot ?? preferredSlot;
    if (!saved.primary) slot = 'primary';

    if (!matchingSlot) {
      const wallet: SavedWallet = {
        displayName: values.displayName,
        walletAlias: slot === 'primary' ? 'Principal' : 'Secundária',
        network: values.network as WalletNetwork,
        profileName: values.profileName,
        walletAddress: values.walletAddress.trim(),
        secondaryWallet: values.secondaryWallet,
        walletType: values.walletType as SavedWallet['walletType'],
        referralCode: values.referralCode,
        email: values.email,
        ensName: values.ensName,
      };
      if (slot === 'secondary' && saved.secondarySameAsPrimary)
        await walletActions.link.mutateAsync(false);
      await walletActions.save.mutateAsync({ slot, wallet });
    }

    if (form.getValues('useSecondaryWallet') !== (slot === 'secondary')) {
      form.setValue('useSecondaryWallet', slot === 'secondary', { shouldDirty: true });
    }
    return slot;
  };

  const submit = async (values: PaymentFormValues) => {
    if (
      submitting.current ||
      attempt.attempt ||
      cart.isPending ||
      cart.isLoading ||
      !cart.id ||
      !network ||
      (quoteRef.current && quoteRef.current.status !== 'valid')
    )
      return;
    submitting.current = true;
    setNotice(null);
    try {
      const fresh = await refreshSession();
      if (fresh?.user.id !== ownerId) return;
      const latestCart = await client.fetchQuery<Cart>({
        queryKey: ['cart', ownerId],
        staleTime: 0,
      });
      await client.cancelQueries({ queryKey: [...QUOTE_QUERY_KEY, ownerId] });
      const current = quoteRef.current;
      const revalidated = await quotes.create({
        cartId: latestCart.id,
        cartVersion: latestCart.version,
        network,
        previousQuoteId: current?.id,
      });
      if (!active()) return;
      previousQuote.current = revalidated;
      setReview(revalidated);
      if (revalidated.status !== 'valid') return;
      const accepted = await quotes.accept(revalidated.id);
      if (!active()) return;
      previousQuote.current = accepted;
      setReview(accepted);
      if (accepted.status !== 'valid') return;
      const walletSlot = await prepareWallet(values);
      const wallet =
        connected && connection
          ? await wallets.get(connection.id)
          : await connect.mutateAsync({
              network: network!,
              provider: values.walletProvider,
              walletSlot,
              walletAddress: values.walletAddress.trim(),
            });
      if (!active() || wallet.status !== 'connected') {
        setConnection(wallet);
        return;
      }
      await attempt.create({
        quoteId: accepted.id,
        connectionId: wallet.id,
        collector: {
          displayName: values.displayName,
          username: values.username,
          email: values.email,
          profileName: values.profileName,
          ensName: values.ensName,
          referralCode: values.referralCode,
          note: values.note,
        },
      });
    } catch (error) {
      onSessionError(error);
      if (active())
        setNotice(error instanceof Error ? error.message : 'Não foi possível enviar o pedido.');
      // Mutations report their own errors. Quote/session failures happen before the order exists.
      if (error instanceof ApiError && error.status === 409) {
        setReview(null);
        void quoteQuery.refetch();
      }
    } finally {
      submitting.current = false;
    }
  };
  return {
    quote,
    quoteLoading: quoteQuery.isFetching,
    quoteError: quoteQuery.error,
    retryQuote: () => {
      void quoteQuery.refetch();
    },
    connection,
    connected,
    connect: () => {
      void connect.mutateAsync(undefined).catch(() => undefined);
    },
    disconnect: () => {
      void disconnect.mutateAsync().catch(() => undefined);
    },
    connectionPending: connect.isPending || disconnect.isPending,
    accept: () => {
      void accepting.mutateAsync().catch(() => undefined);
    },
    accepting: accepting.isPending,
    notice,
    attempt,
    submit,
    blocked: Boolean(
      attempt.attempt ||
        accepting.isPending ||
        connect.isPending ||
        disconnect.isPending ||
        quoteQuery.isFetching ||
        quoteQuery.isError
    ),
    retryRejected: () => {
      attempt.reset();
      setReview(null);
      previousQuote.current = null;
      setNotice(null);
      void quoteQuery.refetch();
    },
  };
}
