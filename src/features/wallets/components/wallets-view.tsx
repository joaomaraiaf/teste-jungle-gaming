import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { AccountPage } from '@/features/profile/components/account-page';
import { useWallets } from '../hooks/use-wallets.hook';
import { WalletsEditor } from './wallets-editor';

export function WalletsView() {
  const { session } = useAuthSession();
  const wallets = useWallets();
  return (
    <AccountPage activeItem='wallets'>
      {wallets.isPending ? (
        <Skeleton className='h-[40rem] w-full' />
      ) : wallets.isError ? (
        <section className='flex flex-col items-start gap-4'>
          <p role='alert'>Não foi possível carregar suas carteiras.</p>
          <Button
            onClick={async () => {
              await wallets.refetch();
            }}
          >
            Tentar novamente
          </Button>
        </section>
      ) : (
        <WalletsEditor key={session?.user.id} wallets={wallets.data} />
      )}
    </AccountPage>
  );
}
