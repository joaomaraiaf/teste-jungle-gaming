import { type ReactNode, createContext, useCallback, useMemo, useState } from 'react';
import type { PaymentReceipt } from '../domain/entities/payment-receipt.entity';

interface PaymentReceiptContextValue {
  receipt: PaymentReceipt | null;
  setReceipt: (receipt: PaymentReceipt) => void;
  clearReceipt: () => void;
}

export const PaymentReceiptContext = createContext<PaymentReceiptContextValue | null>(null);

export function PaymentReceiptProvider({ children }: { children: ReactNode }) {
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const clearReceipt = useCallback(() => setReceipt(null), []);
  const value = useMemo(() => ({ receipt, setReceipt, clearReceipt }), [receipt, clearReceipt]);

  return <PaymentReceiptContext.Provider value={value}>{children}</PaymentReceiptContext.Provider>;
}
