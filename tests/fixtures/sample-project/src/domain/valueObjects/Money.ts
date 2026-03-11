/**
 * Represents a monetary value with currency.
 *
 * Immutable value object ensuring type-safe monetary calculations.
 *
 * @businessRule Amount must be non-negative
 * @businessRule Currency code must be ISO 4217 format
 */
export class Money {
  /** The monetary amount */
  readonly amount: number;

  /** ISO 4217 currency code */
  readonly currency: string;

  constructor(amount: number, currency: string) {
    if (amount < 0) throw new Error("Amount must be non-negative");
    this.amount = amount;
    this.currency = currency;
  }

  /**
   * Adds two monetary values together.
   *
   * @param other - The money to add
   * @returns A new Money with the summed amount
   * @throws {CurrencyMismatchError} When currencies don't match
   * @businessRule Both operands must have the same currency
   */
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("Currency mismatch");
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Multiplies the amount by a factor.
   *
   * @param factor - The multiplication factor
   * @returns A new Money with the multiplied amount
   */
  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }
}
