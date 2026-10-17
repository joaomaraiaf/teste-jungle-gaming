import { useAppQuery } from '@/core/hooks/use-app-query';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { useSessionErrorHandler } from '@/features/auth/hooks/use-session-error-handler.hook';
import { profileUseCase } from '../profile.dependencies';

export const PROFILE_QUERY_KEY = ['profile'] as const;

export function useProfile() {
  const { session } = useAuthSession();
  const onSessionError = useSessionErrorHandler();
  return useAppQuery({
    queryKey: [...PROFILE_QUERY_KEY, session?.user.id],
    queryFn: async ({ signal }) => {
      try {
        return await profileUseCase.getProfile(signal);
      } catch (error) {
        onSessionError(error);
        throw error;
      }
    },
    enabled: Boolean(session),
    meta: { private: true },
    retry: false,
  });
}
