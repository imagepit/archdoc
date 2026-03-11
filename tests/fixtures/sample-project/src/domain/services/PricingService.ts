import { Money } from "../valueObjects/Money.js";

/**
 * Calculates the tax amount for a given price.
 *
 * @param price - The base price before tax
 * @param taxRate - Tax rate as decimal (e.g., 0.10 for 10%)
 * @returns The calculated tax amount
 * @businessRule Tax is rounded down to the nearest integer
 */
export function calculateTax(price: Money, taxRate: number): Money {
  const taxAmount = Math.floor(price.amount * taxRate);
  return new Money(taxAmount, price.currency);
}

/**
 * Applies a discount to a price.
 *
 * @param price - The original price
 * @param discountPercent - Discount percentage (0-100)
 * @returns The discounted price
 * @throws {InvalidDiscountError} When discount is not between 0 and 100
 * @businessRule Discount cannot exceed 100%
 */
export function applyDiscount(price: Money, discountPercent: number): Money {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error("Discount must be between 0 and 100");
  }
  const factor = 1 - discountPercent / 100;
  return price.multiply(factor);
}
