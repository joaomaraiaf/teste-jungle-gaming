import type { CompletePurchaseInput, PurchaseActivity } from '../entities/purchase-activity.entity';

export interface IActivityRepository {
  list(signal?: AbortSignal): Promise<PurchaseActivity[]>;
  completePurchase(
    input: CompletePurchaseInput,
    expectedUserId?: string
  ): Promise<PurchaseActivity>;
}
