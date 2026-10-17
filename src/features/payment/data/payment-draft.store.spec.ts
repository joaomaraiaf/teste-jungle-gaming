import { beforeEach, expect, it } from 'vitest';
import { clearPaymentDraft, readPaymentDraft, writePaymentDraft } from './payment-draft.store';
import type { PaymentFormValues } from './schemas/payment-form.schema';

const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const partialForm: PaymentFormValues = {
  displayName: 'Nome privado',
  username: '',
  email: 'incompleto@',
  network: '',
  walletAddress: '',
  walletType: '',
  profileName: '',
  secondaryWallet: '',
  referralCode: '',
  ensName: '',
  note: 'Observação privada',
  walletProvider: 'coinbase',
  useSecondaryWallet: false,
};
beforeEach(() => window.sessionStorage.clear());
it('preserva campos ainda inválidos sem compartilhar o rascunho entre contas', () => {
  writePaymentDraft(owner, partialForm);
  expect(readPaymentDraft(owner)).toEqual(partialForm);
  expect(readPaymentDraft(other)).toBeUndefined();
  clearPaymentDraft(owner);
  expect(readPaymentDraft(owner)).toBeUndefined();
});
