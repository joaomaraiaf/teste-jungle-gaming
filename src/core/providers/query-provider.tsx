import { Toaster } from '@/core/components/ui/sonner';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './query-client';

export function QueryProvider({
  children,
  client = queryClient,
}: { children: React.ReactNode; client?: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      <Toaster />
    </QueryClientProvider>
  );
}
