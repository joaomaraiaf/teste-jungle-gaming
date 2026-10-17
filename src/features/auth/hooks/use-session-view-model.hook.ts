import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useAppMutation } from '@/core/hooks/use-app-mutation';
import { useAppQuery } from '@/core/hooks/use-app-query';
import { authUseCase } from '../auth.dependencies';
import type { AuthSession, LoginInput, SignupInput } from '../domain/entities/auth-session.entity';

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const;
export const LOGIN_MUTATION_KEY = ['auth', 'login'] as const;
export const SIGNUP_MUTATION_KEY = ['auth', 'signup'] as const;
export const LOGOUT_MUTATION_KEY = ['auth', 'logout'] as const;

export function useSessionViewModel(onLogout?: () => void | Promise<void>) {
  const queryClient = useQueryClient();
  const [loggedOutUserId, setLoggedOutUserId] = useState<string | null>(null);
  const query = useAppQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: ({ signal }) => authUseCase.getSession(signal),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: 'always',
  });

  const updateSession = async (session: AuthSession | null) => {
    await queryClient.cancelQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
    queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, session);
  };
  const login = useAppMutation({
    mutationKey: LOGIN_MUTATION_KEY,
    mutationFn: (input: LoginInput) => authUseCase.login(input),
    onSuccess: async (session) => {
      setLoggedOutUserId(null);
      await updateSession(session);
    },
    successMessage: 'Você entrou na sua conta.',
    gcTime: 0,
    retry: false,
  });
  const signup = useAppMutation({
    mutationKey: SIGNUP_MUTATION_KEY,
    mutationFn: (input: SignupInput) => authUseCase.signup(input),
    onSuccess: async (session) => {
      setLoggedOutUserId(null);
      await updateSession(session);
    },
    successMessage: 'Conta criada com sucesso!',
    gcTime: 0,
    retry: false,
  });
  const logout = useAppMutation({
    mutationKey: LOGOUT_MUTATION_KEY,
    mutationFn: () => authUseCase.logout(),
    onSuccess: async () => {
      setLoggedOutUserId(
        queryClient.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY)?.user.id ?? null
      );
      await updateSession(null);
      await onLogout?.();
    },
    successMessage: 'Você saiu da sua conta.',
    retry: false,
  });

  const refreshSession = useCallback(async () => {
    await queryClient.cancelQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
    return queryClient.fetchQuery({
      queryKey: AUTH_SESSION_QUERY_KEY,
      queryFn: ({ signal }) => authUseCase.getSession(signal),
      staleTime: 0,
      retry: false,
    });
  }, [queryClient]);

  useEffect(() => {
    if (!query.data) return;
    const timer = window.setTimeout(
      () => {
        queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
        void queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
      },
      Math.max(0, Date.parse(query.data.expiresAt) - Date.now())
    );
    return () => window.clearTimeout(timer);
  }, [query.data, queryClient]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.storageArea === window.localStorage &&
        (event.key === null || event.key === 'kurio:mock-auth:v1')
      )
        void queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient]);

  return {
    session: query.data ?? null,
    isLoading: query.isPending,
    login,
    signup,
    logout,
    loggedOutUserId,
    refreshSession,
  };
}
