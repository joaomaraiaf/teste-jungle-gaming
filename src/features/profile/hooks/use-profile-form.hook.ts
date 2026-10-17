import { ApiError } from '@/core/api/api-error';
import { useAppMutation } from '@/core/hooks/use-app-mutation';
import type { AuthSession } from '@/features/auth/domain/entities/auth-session.entity';
import { useSessionErrorHandler } from '@/features/auth/hooks/use-session-error-handler.hook';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/hooks/use-session-view-model.hook';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import {
  MAX_AVATAR_BYTES,
  type ProfileFormValues,
  profileFormSchema,
} from '../data/schemas/profile.schema';
import type {
  CollectorProfile,
  UpdateProfileInput,
} from '../domain/entities/collector-profile.entity';
import { profileUseCase } from '../profile.dependencies';
import { PROFILE_QUERY_KEY } from './use-profile.hook';

export const UPDATE_PROFILE_MUTATION_KEY = ['profile', 'update'] as const;
const defaults = (profile: CollectorProfile): ProfileFormValues => ({
  displayName: profile.displayName,
  username: profile.username,
  email: profile.email,
  ensName: profile.ensName,
  walletAlias: profile.walletAlias,
  avatarDataUrl: profile.avatarDataUrl,
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

export function useProfileForm(profile: CollectorProfile) {
  const queryClient = useQueryClient();
  const onSessionError = useSessionErrorHandler();
  const avatarRevision = useRef(0);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaults(profile),
  });
  const mutation = useAppMutation({
    mutationKey: [...UPDATE_PROFILE_MUTATION_KEY, profile.id],
    mutationFn: (input: UpdateProfileInput) => profileUseCase.updateProfile(input),
    meta: { private: true, ownerId: profile.id },
    onError: onSessionError,
    retry: false,
    gcTime: 0,
    successMessage: 'Perfil salvo com sucesso.',
    onSuccess: (updated) => {
      const session = queryClient.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY);
      if (session?.user.id !== updated.id) return;
      queryClient.setQueryData([...PROFILE_QUERY_KEY, updated.id], updated);
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, {
        ...session,
        user: { id: updated.id, username: updated.username, email: updated.email },
      });
    },
  });

  const submitProfile: SubmitHandler<ProfileFormValues> = async (values) => {
    const { currentPassword, newPassword, confirmPassword: _confirm, ...details } = values;
    try {
      const updated = await mutation.mutateAsync({
        ...details,
        ...(newPassword ? { passwordChange: { currentPassword, newPassword } } : {}),
      });
      form.reset(defaults(updated));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível salvar seu perfil.';
      if (
        error instanceof ApiError &&
        error.response &&
        typeof error.response === 'object' &&
        'code' in error.response
      ) {
        if (error.response.code === 'CURRENT_PASSWORD_INVALID')
          form.setError('currentPassword', { message }, { shouldFocus: true });
        else if (error.response.code === 'EMAIL_IN_USE')
          form.setError('email', { message }, { shouldFocus: true });
        else if (error.response.code === 'USERNAME_IN_USE')
          form.setError('username', { message }, { shouldFocus: true });
        else form.setError('root', { message });
      } else form.setError('root', { message });
    } finally {
      form.setValue('currentPassword', '');
      form.setValue('newPassword', '');
      form.setValue('confirmPassword', '');
      mutation.reset();
    }
  };

  const selectAvatar = async (file?: File) => {
    if (!file) return;
    const revision = ++avatarRevision.current;
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > MAX_AVATAR_BYTES
    ) {
      form.setError('avatarDataUrl', { message: 'Use PNG, JPEG ou WebP de até 256 KB.' });
      return;
    }
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(new Error('Imagem inválida.'));
        reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        reader.readAsDataURL(file);
      });
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('A imagem selecionada não é válida.'));
        image.src = url;
      });
      if (revision !== avatarRevision.current) return;
      form.clearErrors('avatarDataUrl');
      form.setValue('avatarDataUrl', url, { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      if (revision === avatarRevision.current)
        form.setError('avatarDataUrl', {
          message: error instanceof Error ? error.message : 'Não foi possível ler a imagem.',
        });
    }
  };
  const removeAvatar = () => {
    avatarRevision.current += 1;
    form.clearErrors('avatarDataUrl');
    form.setValue('avatarDataUrl', null, { shouldDirty: true });
  };

  return { form, submitProfile, selectAvatar, removeAvatar };
}
