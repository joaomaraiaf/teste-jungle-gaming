import { redirect } from '@tanstack/react-router';
import { authUseCase } from './auth.dependencies';
import type { PrivateDestination } from './private-destinations';

export async function requireCollectorSession(destination: PrivateDestination) {
  if (!(await authUseCase.getSession()))
    throw redirect({
      to: '/',
      search: { page: 1, limit: 9, search: '', sort: 'newest', redirect: destination },
    });
}
