import { useAuthSession } from './use-auth-session.hook';
import { useLoginDialog } from './use-login-dialog.hook';

export function useFavoriteAccess() {
  const { session, refreshSession } = useAuthSession();
  const { openLogin } = useLoginDialog();
  return (action: (userId: string) => void) => {
    if (!session || Date.parse(session.expiresAt) <= Date.now()) {
      if (session) void refreshSession().catch(() => undefined);
      openLogin();
      return;
    }
    action(session.user.id);
  };
}
