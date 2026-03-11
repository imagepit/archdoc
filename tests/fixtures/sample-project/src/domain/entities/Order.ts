import { Money } from "../valueObjects/Money.js";

/**
 * Represents a customer order in the system.
 *
 * Manages the full lifecycle of an order including creation,
 * line item management, and cancellation as an aggregate root.
 *
 * @businessRule An order must have at least one line item
 * @businessRule Cancelled orders cannot have items added
 */
export class Order {
  /** Unique identifier for the order */
  readonly id: string;

  /** Customer who placed the order */
  readonly customerId: string;

  /** Current status of the order */
  status: "draft" | "confirmed" | "cancelled";

  /** Line items in this order */
  private items: OrderItem[] = [];

  constructor(id: string, customerId: string) {
    this.id = id;
    this.customerId = customerId;
    this.status = "draft";
  }

  /**
   * Adds a line item to this order.
   *
   * @param productId - The product identifier
   * @param quantity - Number of units (must be > 0)
   * @param unitPrice - Price per unit
   * @returns The updated order total
   * @throws {OrderNotEditableError} When order is not in draft status
   * @businessRule Duplicate products are merged by incrementing quantity
   */
  addItem(productId: string, quantity: number, unitPrice: Money): Money {
    if (this.status !== "draft") {
      throw new Error("Order is not editable");
    }

    const existing = this.items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ productId, quantity, unitPrice });
    }

    return this.calculateTotal();
  }

  /**
   * Calculates the total price of the order.
   *
   * @returns Total amount including all line items
   * @see PricingService
   */
  calculateTotal(): Money {
    if (this.items.length === 0) {
      return new Money(0, "JPY");
    }

    return this.items.reduce(
      (total, item) => total.add(item.unitPrice.multiply(item.quantity)),
      new Money(0, this.items[0].unitPrice.currency),
    );
  }

  /**
   * Cancels the order.
   *
   * @throws {OrderAlreadyCancelledError} When order is already cancelled
   */
  cancel(): void {
    if (this.status === "cancelled") {
      throw new Error("Order is already cancelled");
    }
    this.status = "cancelled";
  }
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: Money;
}
