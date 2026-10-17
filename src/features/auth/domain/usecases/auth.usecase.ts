import type { LoginInput, SignupInput } from '../entities/auth-session.entity';
import type { IAuthRepository } from '../repositories/auth.repository.interface';

export class AuthUseCase {
  constructor(private readonly repository: IAuthRepository) {}

  getSession(signal?: AbortSignal) {
    return this.repository.getSession(signal);
  }
  login(input: LoginInput) {
    return this.repository.login(input);
  }
  signup(input: SignupInput) {
    return this.repository.signup(input);
  }
  logout() {
    return this.repository.logout();
  }
}
