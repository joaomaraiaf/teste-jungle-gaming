import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().trim().pipe(z.email('Informe um e-mail válido.')),
  password: z.string().min(1, 'Informe sua senha.'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
