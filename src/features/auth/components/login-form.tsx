import { toast } from 'sonner';
import { AppForm } from '@/core/components/forms/app-form';
import { FormFieldFactory } from '@/core/components/forms/form-field-factory';
import { Button } from '@/core/components/ui/button';
import { useLoginForm } from '../hooks/use-login-form.hook';
import { AUTH_FIELD_CLASS } from './auth-form.styles';

export function LoginForm({ onCreateAccount }: { onCreateAccount: () => void }) {
  const { form, submitLogin } = useLoginForm();

  return (
    <AppForm form={form} onSubmit={submitLogin} noValidate className='px-6 pt-6 sm:px-20'>
      <div className='flex flex-col gap-3'>
        <FormFieldFactory
          name='email'
          control={form.control}
          label='E-mail'
          fieldType='email'
          placeholder='contato@email.com'
          autoComplete='email'
          className={AUTH_FIELD_CLASS}
        />
        <FormFieldFactory
          name='password'
          control={form.control}
          label='Senha'
          fieldType='password'
          placeholder='Sua senha'
          autoComplete='current-password'
          className={AUTH_FIELD_CLASS}
        />
        <button
          type='button'
          onClick={() => toast.info('A recuperação de senha ainda não está disponível.')}
          className='self-end text-sm text-[#E89B55] hover:underline focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
        >
          Esqueceu a senha?
        </button>
      </div>
      {form.formState.errors.root && (
        <p role='alert' className='mt-3 text-sm text-[#F0805F]'>
          {form.formState.errors.root.message}
        </p>
      )}
      <Button
        type='submit'
        disabled={form.formState.isSubmitting}
        className='mt-6 h-[2.8125rem] w-full rounded-[0.3125rem] bg-[#D28A4C] font-bold text-[#140D0A] hover:bg-[#E89B55]'
      >
        {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>
      <p className='mt-4 text-center text-xs leading-5 text-[#CFB28C]'>
        Ainda não tem uma conta?{' '}
        <button
          type='button'
          onClick={onCreateAccount}
          className='font-medium text-[#E89B55] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
        >
          Crie a sua
        </button>
      </p>
    </AppForm>
  );
}
