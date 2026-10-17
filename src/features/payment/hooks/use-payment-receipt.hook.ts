import { useContext } from 'react';
import { PaymentReceiptContext } from '../components/payment-receipt-provider';

export function usePaymentReceipt() {
  const context = useContext(PaymentReceiptContext);
  if (!context) {
    throw new Error('usePaymentReceipt precisa ser usado dentro de PaymentReceiptProvider.');
  }
  return context;
}
