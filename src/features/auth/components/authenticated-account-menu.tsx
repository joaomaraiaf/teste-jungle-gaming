import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Link } from '@tanstack/react-router';
import { LogOut, ShoppingBag, UserRound } from 'lucide-react';
import { useAuthSession } from '../hooks/use-auth-session.hook';

export function AuthenticatedAccountMenu({ compact = false }: { compact?: boolean }) {
  const { session, logout } = useAuthSession();
  if (!session) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Conta de ${session.user.username}`}
          className={
            compact
              ? 'size-10 rounded-full bg-transparent p-0 text-[#CFB28C] hover:bg-[#38220F] hover:text-[#E89B55]'
              : 'h-[2.1875rem] max-w-36 bg-[#D28A4C] px-3 text-[#140D0A] hover:bg-[#E89B55]'
          }
        >
          <UserRound aria-hidden='true' />
          <span className={compact ? 'sr-only' : 'truncate'}>{session.user.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='max-w-[calc(100dvw-2rem)]'>
        <DropdownMenuLabel className='max-w-64 break-words'>
          <p>{session.user.username}</p>
          <p className='mt-1 text-xs font-normal text-muted-foreground'>{session.user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to='/profile'>
            <UserRound aria-hidden='true' />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to='/activity'>
            <ShoppingBag aria-hidden='true' />
            Atividade
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
          <LogOut aria-hidden='true' />
          {logout.isPending ? 'Saindo…' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
