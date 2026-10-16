import { Button } from '@/core/components/ui/button';
import { toast } from 'sonner';

export function LoginSocialOptions() {
  return (
    <section aria-label='Outras formas de entrar' className='flex flex-col gap-3 pt-6'>
      <div className='flex items-center gap-3 text-[0.8125rem]'>
        <span aria-hidden='true' className='h-px flex-1 bg-[#3F2319]' />
        <span>Ou continue com</span>
        <span aria-hidden='true' className='h-px flex-1 bg-[#3F2319]' />
      </div>
      <div className='flex flex-col gap-3 px-6 sm:px-20'>
        <Button
          type='button'
          variant='outline'
          onClick={() => toast.info('O login com Google ainda não está disponível.')}
          className='h-10 rounded-[0.3125rem] border-[#3F2319] bg-transparent text-[0.8125rem] text-[#CFB28C] hover:bg-[#38220F]'
        >
          <svg aria-hidden='true' viewBox='0 0 24 24' className='size-5'>
            <path
              fill='#4285F4'
              d='M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z'
            />
            <path
              fill='#34A853'
              d='M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.08v2.59A10 10 0 0 0 12 22Z'
            />
            <path
              fill='#FBBC05'
              d='M6.42 13.92a6 6 0 0 1 0-3.84V7.49H3.08a10 10 0 0 0 0 9.02l3.34-2.59Z'
            />
            <path
              fill='#EA4335'
              d='M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.92 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z'
            />
          </svg>
          Continuar com Google
        </Button>
        <Button
          type='button'
          variant='outline'
          onClick={() => toast.info('O login com Facebook ainda não está disponível.')}
          className='h-10 rounded-[0.3125rem] border-[#3F2319] bg-transparent text-[0.8125rem] text-[#CFB28C] hover:bg-[#38220F]'
        >
          <svg aria-hidden='true' viewBox='0 0 24 24' className='size-5 fill-[#3B5999]'>
            <path d='M15.7 8H18V4.3c-.4-.1-1.8-.3-3.4-.3-3.3 0-5.6 2-5.6 5.7V13H5.3v4.2H9V24h4.5v-6.8h3.7l.6-4.2h-4.3V10c0-1.2.3-2 2.2-2Z' />
          </svg>
          Continuar com Facebook
        </Button>
      </div>
    </section>
  );
}
