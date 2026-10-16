import { passwordSchema } from '@/core/utils/password.schema';
import { z } from 'zod';

export const signupInputSchema = z.object({
  username: z.string().trim().min(2, 'Informe um nome de usuário com pelo menos 2 caracteres.'),
  email: z.string().trim().pipe(z.email('Informe um e-mail válido.')),
  password: passwordSchema,
});

export const signupFormSchema = signupInputSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirme sua senha.') })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas devem ser iguais.',
  });

export type SignupFormValues = z.infer<typeof signupFormSchema>;
