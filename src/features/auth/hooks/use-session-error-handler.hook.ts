import { useCallback } from 'react';
import { ApiError } from '@/core/api/api-error';
import { useAuthSession } from './use-auth-session.hook';

export function useSessionErrorHandler() {
  const { refreshSession } = useAuthSession();
  return useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401)
        void refreshSession().catch(() => undefined);
    },
    [refreshSession]
  );
}
