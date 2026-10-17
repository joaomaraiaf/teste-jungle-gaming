import { useId } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import type {
  SavedWallets,
  WalletSlot,
} from '@/features/wallets/domain/entities/saved-wallet.entity';

interface PaymentSavedWalletsProps {
  wallets?: SavedWallets;
  onSelect: (slot: WalletSlot) => void;
}

export function PaymentSavedWallets({ wallets, onSelect }: PaymentSavedWalletsProps) {
  const id = useId();
  if (!wallets?.primary) return null;
  return (
    <div className='mb-6 flex flex-col gap-2'>
      <label htmlFor={id} className='text-sm'>
        Usar carteira salva
      </label>
      <Select
        onValueChange={(value) => {
          if (value === 'primary' || value === 'secondary') onSelect(value);
        }}
      >
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Selecione uma carteira da sua conta' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='primary'>Principal · {wallets.primary.walletAlias}</SelectItem>
          {wallets.secondary && !wallets.secondarySameAsPrimary && (
            <SelectItem value='secondary'>Secundária · {wallets.secondary.walletAlias}</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
