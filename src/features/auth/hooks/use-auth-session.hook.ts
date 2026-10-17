import { useContext } from 'react';
import { AuthSessionContext } from '../components/auth-session-provider';

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) throw new Error('useAuthSession precisa ser usado dentro de AuthSessionProvider.');
  return context;
}
