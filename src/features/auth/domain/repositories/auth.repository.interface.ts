import type { AuthSession, LoginInput, SignupInput } from '../entities/auth-session.entity';

export interface IAuthRepository {
  getSession(signal?: AbortSignal): Promise<AuthSession | null>;
  login(input: LoginInput): Promise<AuthSession>;
  signup(input: SignupInput): Promise<AuthSession>;
  logout(): Promise<void>;
}
