import type { CompletePurchaseInput } from '../entities/purchase-activity.entity';
import type { IActivityRepository } from '../repositories/activity.repository.interface';

export class ActivityUseCase {
  constructor(private readonly repository: IActivityRepository) {}
  list(signal?: AbortSignal) {
    return this.repository.list(signal);
  }
  completePurchase(input: CompletePurchaseInput, expectedUserId?: string) {
    return this.repository.completePurchase(input, expectedUserId);
  }
}
