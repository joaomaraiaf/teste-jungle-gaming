import { zodResolver } from '@hookform/resolvers/zod';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { type SignupFormValues, signupFormSchema } from '../data/schemas/signup-form.schema';
import { useAuthSession } from './use-auth-session.hook';
import { useLoginDialog } from './use-login-dialog.hook';

export function useSignupForm() {
  const { signup } = useAuthSession();
  const { closeLogin } = useLoginDialog();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });

  const submitSignup: SubmitHandler<SignupFormValues> = async (values) => {
    try {
      await signup.mutateAsync({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      await closeLogin();
    } catch (error) {
      form.setError('root', {
        message:
          error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.',
      });
    } finally {
      form.resetField('password');
      form.resetField('confirmPassword');
      signup.reset();
    }
  };

  return { form, submitSignup };
}
