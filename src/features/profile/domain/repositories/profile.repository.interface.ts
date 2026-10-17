import type { CollectorProfile, UpdateProfileInput } from '../entities/collector-profile.entity';

export interface IProfileRepository {
  getProfile(signal?: AbortSignal): Promise<CollectorProfile>;
  updateProfile(input: UpdateProfileInput): Promise<CollectorProfile>;
}
