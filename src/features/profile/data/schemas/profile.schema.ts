import { z } from 'zod';
import { passwordSchema } from '@/core/utils/password.schema';

export const MAX_AVATAR_BYTES = 256 * 1024;
export const avatarDataUrlSchema = z
  .string()
  .max(350_000, 'A imagem deve ter até 256 KB.')
  .regex(
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
    'Use uma imagem PNG, JPEG ou WebP.'
  )
  .nullable();

export const storedProfileSchema = z.object({
  displayName: z.string().max(80),
  ensName: z.string().max(63),
  walletAlias: z.string().max(80),
  avatarDataUrl: avatarDataUrlSchema,
});

export const profileSchema = storedProfileSchema.extend({
  id: z.uuid(),
  username: z.string().min(2),
  email: z.email(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição.').max(80),
  username: z.string().trim().min(2, 'Informe seu nome de usuário.').max(80),
  email: z.string().trim().pipe(z.email('Informe um e-mail válido.')),
  ensName: z
    .string()
    .trim()
    .min(1, 'Informe seu nome ENS.')
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hífens, sem .eth.'),
  walletAlias: z.string().trim().min(1, 'Informe o apelido da carteira.').max(80),
  avatarDataUrl: avatarDataUrlSchema,
  passwordChange: z
    .object({
      currentPassword: z.string().min(1, 'Informe a senha atual.'),
      newPassword: passwordSchema,
    })
    .optional(),
});

export const profileFormSchema = updateProfileSchema
  .omit({ passwordChange: true })
  .extend({
    currentPassword: z.string(),
    newPassword: z.union([z.literal(''), passwordSchema]),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    if (!values.currentPassword && !values.newPassword && !values.confirmPassword) return;
    if (!values.currentPassword)
      context.addIssue({
        code: 'custom',
        path: ['currentPassword'],
        message: 'Informe a senha atual.',
      });
    if (!values.newPassword)
      context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Informe a nova senha.' });
    if (!values.confirmPassword)
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Confirme a nova senha.',
      });
    else if (values.newPassword !== values.confirmPassword)
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'As senhas devem ser iguais.',
      });
  });

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
