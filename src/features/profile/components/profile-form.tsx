import { AppForm } from '@/core/components/forms/app-form';
import { FormFieldFactory } from '@/core/components/forms/form-field-factory';
import { Button } from '@/core/components/ui/button';
import type { CollectorProfile } from '../domain/entities/collector-profile.entity';
import { useProfileForm } from '../hooks/use-profile-form.hook';
import { ProfileAvatarField } from './profile-avatar-field';

const fieldClass =
  '[&_[data-slot=input-group]]:h-10 [&_[data-slot=input-group]]:rounded-[0.1875rem] [&_[data-slot=input-group]]:border-[#3F2319] [&_label]:text-sm [&_label]:font-normal [&_label_span]:text-[#F0805F]';

export function ProfileForm({ profile }: { profile: CollectorProfile }) {
  const { form, submitProfile, selectAvatar, removeAvatar } = useProfileForm(profile);

  return (
    <section className='min-w-0' aria-labelledby='collector-profile-heading'>
      <h1 id='collector-profile-heading' className='mb-8 text-base font-bold'>
        Perfil do colecionador
      </h1>
      <AppForm form={form} onSubmit={submitProfile} noValidate className='flex flex-col gap-8'>
        <div className='grid min-w-0 gap-x-7 gap-y-6 md:grid-cols-2'>
          <FormFieldFactory
            name='displayName'
            control={form.control}
            label='Nome de exibição'
            required
            autoComplete='name'
            className={fieldClass}
          />
          <FormFieldFactory
            name='username'
            control={form.control}
            label='Nome de usuário'
            required
            autoComplete='username'
            className={fieldClass}
          />
          <FormFieldFactory
            name='email'
            control={form.control}
            label='E-mail'
            fieldType='email'
            required
            autoComplete='email'
            className={fieldClass}
          />
          <FormFieldFactory
            name='ensName'
            control={form.control}
            label='Nome ENS'
            required
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
          <FormFieldFactory
            name='walletAlias'
            control={form.control}
            label='Apelido da carteira'
            required
            className={fieldClass}
          />
          <ProfileAvatarField form={form} onSelect={selectAvatar} onRemove={removeAvatar} />
        </div>
        <section
          aria-labelledby='profile-password-heading'
          className='flex flex-col gap-6 md:w-[calc((100%-1.75rem)/2)]'
        >
          <h2 id='profile-password-heading' className='text-base font-bold'>
            Alterar senha
          </h2>
          <FormFieldFactory
            name='currentPassword'
            control={form.control}
            label='Senha atual'
            fieldType='password'
            autoComplete='current-password'
            className={fieldClass}
          />
          <FormFieldFactory
            name='newPassword'
            control={form.control}
            label='Nova senha'
            fieldType='password'
            autoComplete='new-password'
            className={fieldClass}
          />
          <FormFieldFactory
            name='confirmPassword'
            control={form.control}
            label='Confirmar nova senha'
            fieldType='password'
            autoComplete='new-password'
            className={fieldClass}
          />
        </section>
        {form.formState.errors.root && (
          <p role='alert' className='text-sm text-[#F0805F]'>
            {form.formState.errors.root.message}
          </p>
        )}
        <Button
          type='submit'
          disabled={form.formState.isSubmitting}
          className='h-10 w-32 rounded-sm bg-[#D28A4C] font-bold text-[#140D0A] hover:bg-[#E89B55]'
        >
          {form.formState.isSubmitting ? 'Salvando…' : 'Salvar'}
        </Button>
      </AppForm>
    </section>
  );
}
