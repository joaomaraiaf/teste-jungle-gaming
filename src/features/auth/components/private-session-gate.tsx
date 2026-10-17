import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useLocation } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useAuthSession } from '../hooks/use-auth-session.hook';
import { useLoginDialog } from '../hooks/use-login-dialog.hook';
import { isPrivateDestination } from '../private-destinations';

export function PrivateSessionGate({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuthSession();
  const { openLogin } = useLoginDialog();
  const location = useLocation();
  if (!isPrivateDestination(location.pathname)) return children;
  if (isLoading)
    return (
      <main className='min-h-dvh bg-[#140D0A] p-8'>
        <Skeleton className='mx-auto h-80 max-w-xl' />
      </main>
    );
  if (!session)
    return (
      <main className='flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#140D0A] p-8 text-center text-[#F5F1EB]'>
        <h1 className='text-xl font-bold'>Entre para continuar</h1>
        <p className='max-w-md text-sm text-[#CFB28C]'>
          Sua sessão terminou. Entre novamente para retomar de onde parou.
        </p>
        <Button onClick={(event) => openLogin(event.currentTarget)}>Entrar</Button>
      </main>
    );
  return (
    <div key={session.user.id} className='contents'>
      {children}
    </div>
  );
}
