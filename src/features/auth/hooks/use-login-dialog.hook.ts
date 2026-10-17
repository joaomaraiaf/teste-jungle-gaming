import { useContext } from 'react';
import { LoginDialogContext } from '../components/login-dialog-provider';

export function useLoginDialog() {
  const context = useContext(LoginDialogContext);
  if (!context) throw new Error('useLoginDialog precisa ser usado dentro de LoginDialogProvider.');
  return context;
}
