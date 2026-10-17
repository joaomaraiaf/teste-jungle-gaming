import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useProfile } from '../hooks/use-profile.hook';
import { AccountPage } from './account-page';
import { ProfileForm } from './profile-form';

export function ProfileView() {
  const profile = useProfile();
  return (
    <AccountPage activeItem='profile'>
      {profile.isPending ? (
        <Skeleton className='h-[40rem] w-full' />
      ) : profile.isError ? (
        <section className='flex flex-col items-start gap-4'>
          <p role='alert'>Não foi possível carregar seu perfil. Sua sessão pode ter expirado.</p>
          <Button
            onClick={async () => {
              await profile.refetch();
            }}
          >
            Tentar novamente
          </Button>
        </section>
      ) : (
        <ProfileForm key={profile.data.id} profile={profile.data} />
      )}
    </AccountPage>
  );
}
