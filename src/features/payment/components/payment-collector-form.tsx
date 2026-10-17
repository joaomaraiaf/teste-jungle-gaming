import { FormFieldFactory } from '@/core/components/forms/form-field-factory';
import { Textarea } from '@/core/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import type { PaymentFormValues } from '../data/schemas/payment-form.schema';

interface PaymentCollectorFormProps {
  form: UseFormReturn<PaymentFormValues>;
}

const networkOptions = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Solana', value: 'solana' },
];

const walletTypeOptions = [
  { label: 'MetaMask', value: 'metamask' },
  { label: 'Coinbase Wallet', value: 'coinbase' },
  { label: 'WalletConnect', value: 'walletconnect' },
];

export function PaymentCollectorForm({ form }: PaymentCollectorFormProps) {
  return (
    <section className='flex flex-col gap-4' aria-labelledby='payment-profile-heading'>
      <h2 id='payment-profile-heading' className='text-base font-bold'>
        Perfil do colecionador
      </h2>
      <div className='grid gap-x-6 gap-y-4 md:grid-cols-2'>
        <FormFieldFactory
          name='displayName'
          control={form.control}
          label='Nome de exibição'
          required
          placeholder='Seu nome de exibição'
          autoComplete='name'
        />
        <FormFieldFactory
          name='username'
          control={form.control}
          label='Nome de usuário'
          required
          placeholder='Seu nome de usuário'
          autoComplete='username'
        />
        <FormFieldFactory
          name='network'
          control={form.control}
          label='Rede'
          required
          fieldType='select'
          placeholder='Selecione uma rede'
          options={networkOptions}
        />
        <FormFieldFactory
          name='profileName'
          control={form.control}
          label='Nome do perfil'
          required
          placeholder='Nome do perfil'
        />
        <FormFieldFactory
          name='walletAddress'
          control={form.control}
          label='Endereço da carteira'
          required
          placeholder='0x...'
          autoComplete='off'
        />
        <FormFieldFactory
          name='secondaryWallet'
          control={form.control}
          label='ENS ou carteira secundária (opcional)'
          placeholder='nome.eth ou endereço da carteira'
        />
        <FormFieldFactory
          name='walletType'
          control={form.control}
          label='Tipo de carteira'
          required
          fieldType='select'
          placeholder='Selecione uma carteira'
          options={walletTypeOptions}
        />
        <FormFieldFactory
          name='referralCode'
          control={form.control}
          label='Código de indicação'
          placeholder='Código de indicação (opcional)'
        />
        <FormFieldFactory
          name='email'
          control={form.control}
          label='E-mail'
          required
          fieldType='email'
          placeholder='voce@email.com'
          autoComplete='email'
        />
        <FormFieldFactory
          name='ensName'
          control={form.control}
          label='Nome ENS'
          placeholder='seu-nome.eth (opcional)'
        />
        <div className='flex flex-col gap-4 md:col-start-1'>
          <label className='flex cursor-pointer items-center gap-2 text-sm'>
            <input
              type='checkbox'
              {...form.register('useSecondaryWallet')}
              className='size-4 accent-[#D28A4C]'
            />
            Usar outra carteira?
          </label>
          <label htmlFor='payment-collector-note' className='flex flex-col gap-2 text-sm'>
            Observação do colecionador (opcional)
            <Textarea
              id='payment-collector-note'
              {...form.register('note')}
              aria-invalid={Boolean(form.formState.errors.note)}
              aria-describedby={form.formState.errors.note ? 'payment-note-error' : undefined}
              placeholder='Adicione uma observação ao pedido'
              className='min-h-32 resize-y rounded-sm border-[#3F2319] text-sm placeholder:text-[#B39463] focus-visible:border-[#D28A4C] focus-visible:ring-[#D28A4C]'
            />
            {form.formState.errors.note && (
              <span id='payment-note-error' role='alert' className='text-xs text-[#F0805F]'>
                {form.formState.errors.note.message}
              </span>
            )}
          </label>
        </div>
      </div>
    </section>
  );
}
