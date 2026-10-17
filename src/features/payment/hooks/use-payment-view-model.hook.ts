import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { parseEthToWei } from '@/features/cart/domain/entities/cart-totals';
import { useCart } from '@/features/cart/hooks/use-cart.hook';
import type { WalletSlot } from '@/features/wallets/domain/entities/saved-wallet.entity';
import { useWallets } from '@/features/wallets/hooks/use-wallets.hook';
import { readPaymentDraft } from '../data/payment-draft.store';
import { type PaymentFormValues, paymentFormSchema } from '../data/schemas/payment-form.schema';
import { useCheckoutFlow } from './use-checkout-flow.hook';
import { usePaymentDraft } from './use-payment-draft.hook';

export function usePaymentViewModel() {
  const { session } = useAuthSession();
  const [draft] = useState(() => (session ? readPaymentDraft(session.user.id) : undefined));
  const wallets = useWallets();
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      displayName: '',
      network: '',
      walletAddress: '',
      walletType: '',
      email: '',
      username: '',
      profileName: '',
      secondaryWallet: '',
      referralCode: '',
      ensName: '',
      useSecondaryWallet: false,
      note: '',
      walletProvider: 'coinbase',
      ...draft,
    },
  });

  const checkout = useCheckoutFlow(form);
  const cart = useCart();
  usePaymentDraft(form, session?.user.id);

  const selectSavedWallet = useCallback(
    (slot: WalletSlot) => {
      const wallet = wallets.data?.[slot];
      if (!wallet) return;
      form.reset({
        ...form.getValues(),
        ...wallet,
        username: session?.user.username ?? '',
        walletProvider: wallet.walletType,
        useSecondaryWallet: slot === 'secondary',
      });
    },
    [wallets.data, session?.user.username, form]
  );

  return {
    form,
    submitPayment: checkout.submit,
    checkout,
    preview: {
      items: checkout.quote?.items ?? cart.items,
      subtotalWei: checkout.quote
        ? parseEthToWei(checkout.quote.totals.subtotalEth)
        : cart.subtotalWei,
      discountWei: checkout.quote
        ? parseEthToWei(checkout.quote.totals.discountEth)
        : cart.discountWei,
      estimatedFeeWei: checkout.quote
        ? parseEthToWei(checkout.quote.totals.estimatedFeeEth)
        : cart.estimatedFeeWei,
      totalWei: checkout.quote ? parseEthToWei(checkout.quote.totals.totalEth) : cart.totalWei,
    },
    savedWallets: wallets.data,
    selectSavedWallet,
    hasSavedDraft: Boolean(draft),
  };
}
