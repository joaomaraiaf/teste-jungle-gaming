import { AppForm } from '@/core/components/forms/app-form';
import { FormFieldFactory } from '@/core/components/forms/form-field-factory';
import { Button } from '@/core/components/ui/button';
import type { SavedWallet, WalletSlot } from '../domain/entities/saved-wallet.entity';
import { useWalletForm } from '../hooks/use-wallet-form.hook';

interface WalletFormProps {
  slot: WalletSlot;
  wallet: SavedWallet | null;
  onSaved?: () => void;
}

const fieldClass =
  '[&_[data-slot=input-group]]:h-10 [&_[data-slot=input-group]]:rounded-[0.1875rem] [&_[data-slot=input-group]]:border-[#3F2319] [&_[data-slot=select-trigger]]:h-10 [&_[data-slot=select-trigger]]:rounded-[0.1875rem] [&_[data-slot=select-trigger]]:border-[#3F2319] [&_label]:text-sm [&_label]:font-normal [&_label_span]:text-[#F0805F]';
const networks = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Solana', value: 'solana' },
];
const types = [
  { label: 'MetaMask', value: 'metamask' },
  { label: 'Coinbase Wallet', value: 'coinbase' },
  { label: 'WalletConnect', value: 'walletconnect' },
];

export function WalletForm({ slot, wallet, onSaved }: WalletFormProps) {
  const { form, submitWallet } = useWalletForm(slot, wallet, onSaved);
  return (
    <AppForm form={form} onSubmit={submitWallet} noValidate className='flex flex-col gap-8'>
      <div className='grid min-w-0 gap-x-7 gap-y-6 md:grid-cols-2'>
        <FormFieldFactory
          name='displayName'
          control={form.control}
          label='Nome de exibição'
          required
          className={fieldClass}
        />
        <FormFieldFactory
          name='walletAlias'
          control={form.control}
          label='Apelido da carteira'
          required
          className={fieldClass}
        />
        <FormFieldFactory
          name='network'
          control={form.control}
          label='Rede'
          required
          fieldType='select'
          placeholder='Selecione uma rede'
          options={networks}
          className={fieldClass}
        />
        <FormFieldFactory
          name='profileName'
          control={form.control}
          label='Nome do perfil'
          required
          className={fieldClass}
        />
        <FormFieldFactory
          name='walletAddress'
          control={form.control}
          label='Endereço da carteira'
          required
          placeholder='Endereço 0x da carteira'
          autoComplete='off'
          className={fieldClass}
        />
        <FormFieldFactory
          name='secondaryWallet'
          control={form.control}
          label='ENS ou carteira secundária (opcional)'
          placeholder='ENS ou carteira secundária (opcional)'
          className={fieldClass}
        />
        <FormFieldFactory
          name='walletType'
          control={form.control}
          label='Tipo de carteira'
          required
          fieldType='select'
          placeholder='Selecione uma carteira'
          options={types}
          className={fieldClass}
        />
        <FormFieldFactory
          name='referralCode'
          control={form.control}
          label='Código de indicação (opcional)'
          className={fieldClass}
        />
        <FormFieldFactory
          name='email'
          control={form.control}
          label='E-mail'
          required
          fieldType='email'
          autoComplete='email'
          className={fieldClass}
        />
        <FormFieldFactory
          name='ensName'
          control={form.control}
          label='Nome ENS (opcional)'
          leftIcon={
            <select
              aria-label='Extensão ENS'
              className='h-full border-r border-[#3F2319] bg-transparent pr-2 text-sm text-[#F5F1EB]'
            >
              <option className='bg-[#140D0A]'>.eth</option>
            </select>
          }
          className={fieldClass}
        />
      </div>
      {form.formState.errors.root && (
        <p role='alert' className='text-sm text-[#F0805F]'>
          {form.formState.errors.root.message}
        </p>
      )}
      <Button
        type='submit'
        disabled={form.formState.isSubmitting}
        className='h-10 w-fit rounded-sm bg-[#D28A4C] px-4 font-bold text-[#140D0A] hover:bg-[#E89B55]'
      >
        {form.formState.isSubmitting
          ? 'Salvando…'
          : slot === 'primary'
            ? 'Salvar carteira'
            : 'Salvar carteira secundária'}
      </Button>
    </AppForm>
  );
}
