import {
  type QueryKey,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseAppMutationOptions<TData, TError, TVariables, TContext>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: QueryKey[];
  resetQueries?: QueryKey[];
  titleSuccess?: string;
}

export const useAppMutation = <
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options?: UseAppMutationOptions<TData, TError, TVariables, TContext>
) => {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      if (options?.invalidateQueries) {
        await Promise.all(
          options.invalidateQueries.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
        );
      }

      if (options?.resetQueries) {
        await Promise.all(
          options.resetQueries.map((queryKey) => queryClient.resetQueries({ queryKey }))
        );
      }

      if (options?.titleSuccess && options?.successMessage) {
        toast.success(options.titleSuccess, {
          description: options.successMessage,
        });
      } else if (options?.titleSuccess) {
        toast.success(options.titleSuccess);
      } else if (options?.successMessage) {
        toast.success(options.successMessage);
      }

      await options?.onSuccess?.(data, variables, context, mutation);
    },
    onError: async (error, variables, context, mutation) => {
      let errorMessageText = options?.errorMessage;
      if (
        !errorMessageText &&
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ) {
        errorMessageText = (error as { message: string }).message;
      }
      toast.error(errorMessageText || 'An unexpected error occurred.');

      await options?.onError?.(error, variables, context, mutation);
    },
  });
};
