import { Link } from '@tanstack/react-router';
import {
  Download,
  Heart,
  LogOut,
  ShoppingCart,
  SquareArrowOutUpRight,
  TriangleAlert,
  UserRound,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSidebarProps {
  activeItem: 'profile' | 'wallets' | 'activity';
  showLogout?: boolean;
  onLogout: () => void;
  isLoggingOut: boolean;
}

const sections = [
  { label: 'Lista de interesse', Icon: Heart },
  { label: 'Ofertas', Icon: SquareArrowOutUpRight },
  { label: 'Arquivos baixados', Icon: Download },
  { label: 'Suporte', Icon: TriangleAlert },
];

export function ProfileSidebar({
  onLogout,
  isLoggingOut,
  activeItem,
  showLogout = true,
}: ProfileSidebarProps) {
  return (
    <aside className='self-start bg-[#241612] py-2' aria-labelledby='profile-sidebar-heading'>
      <h2 id='profile-sidebar-heading' className='px-3 py-2 text-lg font-bold leading-5'>
        Meu perfil
      </h2>
      <nav aria-label='Navegação do perfil' className='grid grid-cols-2 lg:flex lg:flex-col'>
        <Link
          to='/profile'
          aria-current={activeItem === 'profile' ? 'page' : undefined}
          className={`flex min-h-[2.8125rem] items-center gap-4 border-l-[0.375rem] px-4 py-2 text-sm ${activeItem === 'profile' ? 'border-[#D28A4C] text-[#E89B55]' : 'border-transparent text-[#B39463] hover:bg-[#38220F]'}`}
        >
          <UserRound aria-hidden='true' className='size-5 shrink-0' />
          Dados do perfil
        </Link>
        <Link
          to='/wallets'
          aria-current={activeItem === 'wallets' ? 'page' : undefined}
          className={`flex min-h-[2.8125rem] items-center gap-4 border-l-[0.375rem] px-4 py-2 text-sm ${activeItem === 'wallets' ? 'border-[#D28A4C] text-[#E89B55]' : 'border-transparent text-[#B39463] hover:bg-[#38220F]'}`}
        >
          <Wallet aria-hidden='true' className='size-5 shrink-0' />
          Carteiras
        </Link>
        <Link
          to='/activity'
          aria-current={activeItem === 'activity' ? 'page' : undefined}
          className={`flex min-h-[2.8125rem] items-center gap-4 border-l-[0.375rem] px-4 py-2 text-sm ${activeItem === 'activity' ? 'border-[#D28A4C] text-[#E89B55]' : 'border-transparent text-[#B39463] hover:bg-[#38220F]'}`}
        >
          <ShoppingCart aria-hidden='true' className='size-5 shrink-0' />
          Atividade
        </Link>
        {sections.map(({ label, Icon }) => (
          <button
            key={label}
            type='button'
            onClick={() => toast.info(`${label}: esta seção ainda não está disponível.`)}
            className='flex min-h-[2.8125rem] items-center gap-4 px-4 py-2 text-left text-sm text-[#B39463] hover:bg-[#38220F] hover:text-[#E89B55] focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
          >
            <Icon aria-hidden='true' className='size-5 shrink-0' />
            {label}
          </button>
        ))}
      </nav>
      {showLogout && (
        <button
          type='button'
          disabled={isLoggingOut}
          onClick={onLogout}
          className='flex min-h-10 w-full items-center gap-4 border-t border-[#3F2319] px-4 py-2 text-sm text-[#E89B55] hover:bg-[#38220F] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
        >
          <LogOut aria-hidden='true' className='size-5' />
          {isLoggingOut ? 'Saindo…' : 'Sair'}
        </button>
      )}
    </aside>
  );
}
