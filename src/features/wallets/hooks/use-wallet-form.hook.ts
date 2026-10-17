import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { zodResolver } from '@hookform/resolvers/zod';
import { type SubmitHandler, useForm } from 'react-hook-form';
import {
  type WalletFormValues,
  savedWalletSchema,
  walletFormSchema,
} from '../data/schemas/wallet.schema';
import type { SavedWallet, WalletSlot } from '../domain/entities/saved-wallet.entity';
import { useWalletActions } from './use-wallets.hook';

export function useWalletForm(slot: WalletSlot, wallet: SavedWallet | null, onSaved?: () => void) {
  const { session } = useAuthSession();
  const { save } = useWalletActions();
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: wallet ?? {
      displayName: session?.user.username ?? '',
      walletAlias: '',
      network: '',
      profileName: session?.user.username ?? '',
      walletAddress: '',
      secondaryWallet: '',
      walletType: '',
      referralCode: '',
      email: session?.user.email ?? '',
      ensName: '',
    },
  });
  const submitWallet: SubmitHandler<WalletFormValues> = async (values) => {
    try {
      const input = savedWalletSchema.parse(values);
      const result = await save.mutateAsync({ slot, wallet: input });
      form.reset(result[slot] ?? input);
      onSaved?.();
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Não foi possível salvar a carteira.',
      });
    }
  };
  return { form, submitWallet };
}
