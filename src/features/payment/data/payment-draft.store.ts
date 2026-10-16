import { z } from 'zod';
import { type PaymentFormValues, paymentFormSchema } from './schemas/payment-form.schema';

const prefix = 'kurio:payment-draft:v1:';
const draftValuesSchema = paymentFormSchema.extend({
  displayName: z.string(),
  network: z.string(),
  walletAddress: z.string(),
  walletType: z.string(),
  email: z.string(),
  username: z.string(),
  profileName: z.string(),
  note: z.string(),
});
const schema = z.object({ userId: z.uuid(), updatedAt: z.number(), values: draftValuesSchema });
export function readPaymentDraft(userId: string): PaymentFormValues | undefined {
  try {
    const raw = window.sessionStorage.getItem(prefix + userId);
    if (!raw) return;
    const draft = schema.parse(JSON.parse(raw));
    if (draft.userId === userId && draft.updatedAt + 7 * 24 * 60 * 60 * 1_000 > Date.now())
      return draft.values;
  } catch {
    return;
  }
}
export function writePaymentDraft(userId: string, values: PaymentFormValues) {
  try {
    window.sessionStorage.setItem(
      prefix + userId,
      JSON.stringify({ userId, values, updatedAt: Date.now() })
    );
  } catch {
    /* The form remains usable without browser persistence. */
  }
}
export function clearPaymentDraft(userId: string) {
  try {
    window.sessionStorage.removeItem(prefix + userId);
  } catch {
    /* No form state is exposed across identities. */
  }
}
