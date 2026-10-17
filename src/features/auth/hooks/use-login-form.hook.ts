import { zodResolver } from '@hookform/resolvers/zod';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { type LoginFormValues, loginFormSchema } from '../data/schemas/login-form.schema';
import { useAuthSession } from './use-auth-session.hook';
import { useLoginDialog } from './use-login-dialog.hook';

export function useLoginForm() {
  const { login } = useAuthSession();
  const { closeLogin } = useLoginDialog();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const submitLogin: SubmitHandler<LoginFormValues> = async (values) => {
    try {
      await login.mutateAsync(values);
      await closeLogin();
    } catch (error) {
      form.setError('root', {
        message:
          error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.',
      });
    } finally {
      form.resetField('password');
      login.reset();
    }
  };

  return { form, submitLogin };
}
