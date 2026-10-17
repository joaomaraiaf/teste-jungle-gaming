import { z } from 'zod';

export const paymentFormSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição.'),
  network: z.string().min(1, 'Selecione uma rede.'),
  walletAddress: z.string().trim().min(8, 'Informe o endereço da carteira.'),
  walletType: z.string().min(1, 'Selecione o tipo de carteira.'),
  email: z.email('Informe um e-mail válido.'),
  username: z.string().trim().min(2, 'Informe seu nome de usuário.'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.'),
  secondaryWallet: z.string().trim(),
  referralCode: z.string().trim(),
  ensName: z.string().trim(),
  useSecondaryWallet: z.boolean(),
  note: z.string().trim().max(240, 'A observação pode ter até 240 caracteres.'),
  walletProvider: z.enum(['metamask', 'coinbase', 'walletconnect'], {
    error: 'Selecione uma carteira para continuar.',
  }),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
