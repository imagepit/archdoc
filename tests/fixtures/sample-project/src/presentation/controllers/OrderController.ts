import { CreateOrderUseCase, type CreateOrderInput } from "../../application/usecases/CreateOrderUseCase.js";

/**
 * HTTP controller for order-related endpoints.
 *
 * Handles incoming HTTP requests and delegates to
 * application use cases.
 */
export class OrderController {
  constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

  /**
   * Handles POST /orders request.
   *
   * @param body - The request body containing order data
   * @returns The response with created order ID
   */
  async createOrder(body: CreateOrderInput): Promise<{ id: string }> {
    const orderId = await this.createOrderUseCase.execute(body);
    return { id: orderId };
  }
}
