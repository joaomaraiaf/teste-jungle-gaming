import { z } from 'zod';

const walletFieldsSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição.').max(80),
  walletAlias: z.string().trim().min(1, 'Informe o apelido da carteira.').max(80),
  network: z.enum(['ethereum', 'polygon', 'solana'], { error: 'Selecione uma rede.' }),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.').max(80),
  walletAddress: z.string().trim().min(1, 'Informe o endereço da carteira.'),
  secondaryWallet: z.string().trim().max(120),
  walletType: z.enum(['metamask', 'coinbase', 'walletconnect'], {
    error: 'Selecione o tipo de carteira.',
  }),
  referralCode: z.string().trim().max(80),
  email: z.string().trim().pipe(z.email('Informe um e-mail válido.')),
  ensName: z
    .string()
    .trim()
    .max(63)
    .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hífens, sem .eth.'),
});

export const savedWalletSchema = walletFieldsSchema.superRefine((wallet, context) => {
  const validAddress =
    wallet.network === 'solana'
      ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.walletAddress)
      : /^0x[a-fA-F0-9]{40}$/.test(wallet.walletAddress);
  if (!validAddress)
    context.addIssue({
      code: 'custom',
      path: ['walletAddress'],
      message:
        wallet.network === 'solana'
          ? 'Informe um endereço Solana válido.'
          : 'Informe um endereço 0x seguido de 40 caracteres hexadecimais.',
    });
});

export const walletFormSchema = walletFieldsSchema
  .extend({
    network: z.union([z.literal(''), walletFieldsSchema.shape.network]),
    walletType: z.union([z.literal(''), walletFieldsSchema.shape.walletType]),
  })
  .superRefine((wallet, context) => {
    if (!wallet.network)
      context.addIssue({ code: 'custom', path: ['network'], message: 'Selecione uma rede.' });
    if (!wallet.walletType)
      context.addIssue({
        code: 'custom',
        path: ['walletType'],
        message: 'Selecione o tipo de carteira.',
      });
    if (wallet.network && wallet.walletType) {
      const result = savedWalletSchema.safeParse(wallet);
      if (!result.success)
        for (const issue of result.error.issues) {
          if (issue.path[0] === 'walletAddress')
            context.addIssue({ code: 'custom', path: issue.path, message: issue.message });
        }
    }
  });

export const savedWalletsSchema = z
  .object({
    primary: savedWalletSchema.nullable(),
    secondary: savedWalletSchema.nullable(),
    secondarySameAsPrimary: z.boolean(),
  })
  .refine(
    (wallets) =>
      Boolean(wallets.primary) || (!wallets.secondary && !wallets.secondarySameAsPrimary),
    'Salve a carteira principal primeiro.'
  );

export type WalletFormValues = z.infer<typeof walletFormSchema>;
