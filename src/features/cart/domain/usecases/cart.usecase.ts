import type { CartSelection } from '../entities/cart.entity';
import type { ICartRepository } from '../repositories/cart.repository.interface';
export class CartUseCase {
  constructor(private readonly repository: ICartRepository) {}
  get(signal?: AbortSignal) {
    return this.repository.get(signal);
  }
  add(input: CartSelection) {
    return this.repository.add(input);
  }
  update(input: CartSelection) {
    return this.repository.update(input);
  }
  remove(nftId: string, editionId: string) {
    return this.repository.remove(nftId, editionId);
  }
  applyCoupon(code: string) {
    return this.repository.applyCoupon(code);
  }
  removeCoupon() {
    return this.repository.removeCoupon();
  }
  merge(guestCartId: string) {
    return this.repository.merge(guestCartId);
  }
}
