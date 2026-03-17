import { Order } from "../../domain/entities/Order";

/** Concrete repository implementation. */
export class OrderRepositoryImpl {
  async findById(id: string): Promise<Order | null> {
    return new Order(id, []);
  }

  async save(order: Order): Promise<void> {
    // persist to database
  }
}
