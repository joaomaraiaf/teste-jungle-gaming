import { UserRound } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Button } from '@/core/components/ui/button';
import { useAuthSession } from '../hooks/use-auth-session.hook';
import { useLoginDialog } from '../hooks/use-login-dialog.hook';

const AuthenticatedAccountMenu = lazy(() =>
  import('./authenticated-account-menu').then((module) => ({
    default: module.AuthenticatedAccountMenu,
  }))
);

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { session, isLoading } = useAuthSession();
  const { openLogin } = useLoginDialog();
  if (session)
    return (
      <Suspense fallback={<span role='status'>Carregando conta…</span>}>
        <AuthenticatedAccountMenu compact={compact} />
      </Suspense>
    );
  return (
    <Button
      disabled={isLoading}
      aria-label={compact ? 'Entrar na conta' : undefined}
      onClick={(event) => openLogin(event.currentTarget)}
      className={
        compact
          ? 'grid size-12 place-items-center rounded-none bg-transparent p-0 text-[#CFB28C] shadow-none hover:bg-transparent hover:text-[#E89B55]'
          : 'h-[2.1875rem] rounded-md bg-[#D28A4C] px-3 text-sm font-bold text-[#140D0A] hover:bg-[#E89B55]'
      }
    >
      {compact ? <span className='sr-only'>Entrar</span> : 'Entrar'}
      {compact && <UserRound aria-hidden='true' className='size-5' />}
    </Button>
  );
}
