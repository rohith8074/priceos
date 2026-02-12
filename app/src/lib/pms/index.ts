import { PMSClient } from "./types";
import { MockPMSClient } from "./mock-client";
import { HostawayClient } from "./hostaway-client";

/**
 * PMS Client Factory
 * Returns appropriate client based on environment variable
 * HOSTAWAY_MODE=mock|live (default: mock)
 */

export function createPMSClient(): PMSClient {
  const mode = (process.env.HOSTAWAY_MODE || "mock").toLowerCase();

  if (mode === "live") {
    return new HostawayClient();
  }

  // Default to mock
  return new MockPMSClient();
}

export type { PMSClient } from "./types";
export { MockPMSClient } from "./mock-client";
export { HostawayClient } from "./hostaway-client";
