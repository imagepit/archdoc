// Lib layer imports from Infrastructure (creates cycle if Infra also imports Lib)
import { OrderRepositoryImpl } from "../infrastructure/repositories/OrderRepositoryImpl";

/** API client that wraps repository access. */
export class ApiClient {
  private repo = new OrderRepositoryImpl();

  async getOrder(id: string) {
    return this.repo.findById(id);
  }
}
