import type { IHttpClient } from '@/core/api/http-client';
import type {
  CollectorProfile,
  UpdateProfileInput,
} from '../../domain/entities/collector-profile.entity';
import type { IProfileRepository } from '../../domain/repositories/profile.repository.interface';
import { profileSchema } from '../schemas/profile.schema';

export class HttpProfileRepository implements IProfileRepository {
  constructor(private readonly http: IHttpClient) {}
  async getProfile(signal?: AbortSignal): Promise<CollectorProfile> {
    return profileSchema.parse(await this.http.get<unknown>('/profile', undefined, { signal }));
  }
  async updateProfile(input: UpdateProfileInput): Promise<CollectorProfile> {
    return profileSchema.parse(
      await this.http.patch<unknown, UpdateProfileInput>('/profile', input)
    );
  }
}
