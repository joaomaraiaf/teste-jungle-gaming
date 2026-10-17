import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { LoginForm } from './login-form';
import { LoginSocialOptions } from './login-social-options';
import { SignupForm } from './signup-form';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreFocus: () => void;
}

export function LoginDialog({ open, onOpenChange, onRestoreFocus }: LoginDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const isSignup = mode === 'signup';
  useEffect(() => {
    if (!open) setMode('login');
    if (open) contentRef.current?.querySelector('input')?.focus();
  }, [open, mode]);
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setMode('login');
      }}
    >
      <DialogContent
        ref={contentRef}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.querySelector('input')?.focus();
        }}
        showCloseButton={false}
        className={`flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-y-auto border-0 border-b-[0.625rem] border-[#D28A4C] bg-[#241612] p-0 pb-10 text-[#F5F1EB] sm:max-w-[31.25rem] ${isSignup ? 'min-h-[min(41rem,calc(100dvh-2rem))] rounded-lg' : 'min-h-[min(37.5rem,calc(100dvh-2rem))] rounded-none'}`}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <DialogClose
          className='absolute right-3 top-3 rounded-sm text-[#D28A4C] hover:text-[#E89B55] focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
          aria-label={isSignup ? 'Fechar cadastro' : 'Fechar login'}
        >
          <X aria-hidden='true' className='size-5' />
        </DialogClose>
        <header className='flex flex-col items-center gap-10 px-6 pt-12 sm:px-12'>
          <div className='flex items-center justify-center gap-2 text-xl font-medium'>
            {isSignup ? (
              <button
                type='button'
                onClick={() => setMode('login')}
                className='hover:text-[#E89B55] focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
              >
                Entrar
              </button>
            ) : (
              <DialogTitle className='text-xl font-medium text-[#E89B55]'>Entrar</DialogTitle>
            )}
            <span aria-hidden='true' className='h-5 border-l border-[#F0805F]' />
            {isSignup ? (
              <DialogTitle className='text-xl font-medium text-[#E89B55]'>Criar conta</DialogTitle>
            ) : (
              <button
                type='button'
                onClick={() => setMode('signup')}
                className='hover:text-[#E89B55] focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
              >
                Criar conta
              </button>
            )}
          </div>
          <DialogDescription className='text-center text-[0.8125rem] leading-4 text-[#F5F1EB]'>
            {isSignup
              ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
              : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
          </DialogDescription>
        </header>
        {isSignup ? <SignupForm /> : <LoginForm onCreateAccount={() => setMode('signup')} />}
        <LoginSocialOptions />
      </DialogContent>
    </Dialog>
  );
}
