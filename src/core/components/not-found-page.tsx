import { Link } from '@tanstack/react-router';
import { Button } from '@/core/components/ui/button';

export function NotFoundPage() {
  return (
    <main className='mx-auto flex min-h-dvh max-w-5xl flex-col items-start justify-center gap-4 px-6'>
      <h1 className='text-3xl font-semibold'>Página não encontrada</h1>
      <p className='text-muted-foreground'>O endereço que você acessou não existe.</p>
      <Button asChild>
        <Link to='/' search={{ page: 1, limit: 9, search: '', sort: 'newest' }}>
          Voltar ao início
        </Link>
      </Button>
    </main>
  );
}
