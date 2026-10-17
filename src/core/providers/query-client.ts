import { QueryClient } from '@tanstack/react-query';

// One cache per document. Bootstrap prefetches and mounted queries share in-flight requests.
export const queryClient = new QueryClient();
