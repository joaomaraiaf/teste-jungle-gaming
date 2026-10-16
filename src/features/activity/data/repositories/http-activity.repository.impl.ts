import type { IHttpClient } from '@/core/api/http-client';
import type {
  CompletePurchaseInput,
  PurchaseActivity,
} from '../../domain/entities/purchase-activity.entity';
import type { IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { activityListSchema, purchaseActivitySchema } from '../schemas/activity.schema';

export class HttpActivityRepository implements IActivityRepository {
  constructor(private readonly http: IHttpClient) {}
  async list(signal?: AbortSignal): Promise<PurchaseActivity[]> {
    return activityListSchema.parse(
      await this.http.get<unknown>('/activity', undefined, { signal })
    );
  }
  async completePurchase(
    input: CompletePurchaseInput,
    expectedUserId?: string
  ): Promise<PurchaseActivity> {
    return purchaseActivitySchema.parse(
      await this.http.post<unknown, CompletePurchaseInput>('/activity/purchases', input, {
        headers: {
          'Idempotency-Key': input.attemptId,
          ...(expectedUserId ? { 'X-Expected-User': expectedUserId } : {}),
        },
      })
    );
  }
}
