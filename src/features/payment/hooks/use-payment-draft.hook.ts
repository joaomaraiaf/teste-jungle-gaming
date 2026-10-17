import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { clearPaymentDraft, writePaymentDraft } from '../data/payment-draft.store';
import type { PaymentFormValues } from '../data/schemas/payment-form.schema';

export function usePaymentDraft(form: UseFormReturn<PaymentFormValues>, userId?: string) {
  useEffect(() => {
    if (!userId) return;
    const subscription = form.watch(() => writePaymentDraft(userId, form.getValues()));
    return () => subscription.unsubscribe();
  }, [form, userId]);
}
export function usePaymentDraftCleanup(loggedOutUserId: string | null) {
  useEffect(() => {
    if (loggedOutUserId) clearPaymentDraft(loggedOutUserId);
  }, [loggedOutUserId]);
}
