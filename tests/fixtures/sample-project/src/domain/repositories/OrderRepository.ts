import { Order } from "../entities/Order.js";

/**
 * Repository interface for Order persistence.
 *
 * Defines the contract for Order data access operations.
 * Implementation resides in the infrastructure layer.
 */
export interface OrderRepository {
  /**
   * Finds an order by its unique identifier.
   *
   * @param id - The order identifier
   * @returns The found order, or null if not exists
   */
  findById(id: string): Promise<Order | null>;

  /**
   * Persists an order to the data store.
   *
   * @param order - The order to save
   */
  save(order: Order): Promise<void>;

  /**
   * Finds all orders for a given customer.
   *
   * @param customerId - The customer identifier
   * @returns List of orders belonging to the customer
   */
  findByCustomerId(customerId: string): Promise<Order[]>;
}
