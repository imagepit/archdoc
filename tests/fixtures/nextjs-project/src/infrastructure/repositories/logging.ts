// Infrastructure imports from Lib (creates cycle: Infra → Lib → Infra)
import { ApiClient } from "../../lib/api-client";

/** Logger that uses API client for remote logging. */
export class RemoteLogger {
  private client = new ApiClient();

  async log(message: string): Promise<void> {
    // remote logging
  }
}
