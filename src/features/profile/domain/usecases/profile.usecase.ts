import type { UpdateProfileInput } from '../entities/collector-profile.entity';
import type { IProfileRepository } from '../repositories/profile.repository.interface';

export class ProfileUseCase {
  constructor(private readonly repository: IProfileRepository) {}
  getProfile(signal?: AbortSignal) {
    return this.repository.getProfile(signal);
  }
  updateProfile(input: UpdateProfileInput) {
    return this.repository.updateProfile(input);
  }
}
