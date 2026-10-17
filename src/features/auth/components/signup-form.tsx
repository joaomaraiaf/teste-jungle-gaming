import { AppForm } from '@/core/components/forms/app-form';
import { FormFieldFactory } from '@/core/components/forms/form-field-factory';
import { Button } from '@/core/components/ui/button';
import { useSignupForm } from '../hooks/use-signup-form.hook';
import { AUTH_FIELD_CLASS } from './auth-form.styles';

const fields = [
  {
    name: 'username',
    label: 'Nome de usuário',
    placeholder: 'Nome de usuário',
    fieldType: 'text',
    autoComplete: 'username',
  },
  {
    name: 'email',
    label: 'E-mail',
    placeholder: 'Digite seu e-mail',
    fieldType: 'email',
    autoComplete: 'email',
  },
  {
    name: 'password',
    label: 'Senha',
    placeholder: 'Senha',
    fieldType: 'password',
    autoComplete: 'new-password',
  },
  {
    name: 'confirmPassword',
    label: 'Confirmar senha',
    placeholder: 'Confirmar senha',
    fieldType: 'password',
    autoComplete: 'new-password',
  },
] as const;

export function SignupForm() {
  const { form, submitSignup } = useSignupForm();

  return (
    <AppForm form={form} onSubmit={submitSignup} noValidate className='px-6 pt-6 sm:px-20'>
      <div className='flex flex-col gap-3'>
        {fields.map((field) => (
          <FormFieldFactory
            key={field.name}
            {...field}
            control={form.control}
            className={AUTH_FIELD_CLASS}
          />
        ))}
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
        {form.formState.isSubmitting ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </AppForm>
  );
}
