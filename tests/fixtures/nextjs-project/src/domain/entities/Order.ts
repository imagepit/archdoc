/**
 * Order entity for the e-commerce system.
 * @businessRule Order must have at least one item
 */
export class Order {
  constructor(
    public readonly id: string,
    public readonly items: string[],
  ) {}

  get totalItems(): number {
    return this.items.length;
  }
}
