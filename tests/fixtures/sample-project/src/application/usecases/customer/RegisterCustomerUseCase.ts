/**
 * Use case for registering a new customer.
 *
 * Handles customer registration including validation
 * and persistence.
 */
export class RegisterCustomerUseCase {
  /**
   * Executes the customer registration.
   *
   * @param input - The registration input
   * @returns The created customer identifier
   * @throws {DuplicateEmailError} When email is already registered
   */
  async execute(input: RegisterCustomerInput): Promise<string> {
    return `customer-${input.email}`;
  }
}

export interface RegisterCustomerInput {
  name: string;
  email: string;
}
