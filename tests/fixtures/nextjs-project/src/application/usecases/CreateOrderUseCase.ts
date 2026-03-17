import { Order } from "../../domain/entities/Order";

/**
 * Use case for creating a new order.
 */
export class CreateOrderUseCase {
  async execute(items: string[]): Promise<Order> {
    return new Order("order-1", items);
  }
}
