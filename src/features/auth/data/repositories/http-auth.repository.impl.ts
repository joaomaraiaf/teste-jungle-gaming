import type { IHttpClient } from '@/core/api/http-client';
import type {
  AuthSession,
  LoginInput,
  SignupInput,
} from '../../domain/entities/auth-session.entity';
import type { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { authSessionSchema } from '../schemas/auth-session.schema';

export class HttpAuthRepository implements IAuthRepository {
  constructor(private readonly http: IHttpClient) {}

  async getSession(signal?: AbortSignal): Promise<AuthSession | null> {
    return authSessionSchema
      .nullable()
      .parse(await this.http.get<unknown>('/auth/session', undefined, { signal }));
  }
  async login(input: LoginInput): Promise<AuthSession> {
    return authSessionSchema.parse(await this.http.post<unknown, LoginInput>('/auth/login', input));
  }
  async signup(input: SignupInput): Promise<AuthSession> {
    return authSessionSchema.parse(
      await this.http.post<unknown, SignupInput>('/auth/signup', input)
    );
  }
  async logout(): Promise<void> {
    await this.http.post<unknown, Record<string, never>>('/auth/logout', {});
  }
}
