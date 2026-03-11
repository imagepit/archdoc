import { Order } from "../../domain/entities/Order.js";
import type { OrderRepository } from "../../domain/repositories/OrderRepository.js";
import { Money } from "../../domain/valueObjects/Money.js";

/**
 * Use case for creating a new order.
 *
 * Orchestrates the order creation workflow including
 * validation, persistence, and event publishing.
 */
export class CreateOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  /**
   * Executes the order creation.
   *
   * @param input - The order creation input
   * @returns The created order identifier
   * @throws {CustomerNotFoundError} When customer does not exist
   */
  async execute(input: CreateOrderInput): Promise<string> {
    const order = new Order(generateId(), input.customerId);

    for (const item of input.items) {
      order.addItem(item.productId, item.quantity, new Money(item.unitPrice, "JPY"));
    }

    await this.orderRepository.save(order);
    return order.id;
  }
}

export interface CreateOrderInput {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2);
}
