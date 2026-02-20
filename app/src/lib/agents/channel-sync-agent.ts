import { createHostawayClient } from "../hostaway/client";
import { db, inventoryMaster } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import type { HostawayCalendarUpdate } from "../hostaway/types";

export interface ExecutionResult {
  success: boolean;
  proposalId: number;
  updatedDays: number;
  verified: boolean;
  error?: string;
  executedAt: Date;
}

/**
 * Channel Sync Agent
 * Responsible for executing approved price proposals to HostAway
 */
export class ChannelSyncAgent {
  private hostawayApiKey: string;

  constructor(hostawayApiKey: string) {
    this.hostawayApiKey = hostawayApiKey;
  }

  /**
   * Execute a single approved proposal
   */
  async executeProposal(proposalId: number): Promise<ExecutionResult> {
    const executedAt = new Date();

    try {
      // Fetch proposal (inventoryMaster record)
      const [proposal] = await db
        .select()
        .from(inventoryMaster)
        .where(eq(inventoryMaster.id, proposalId))
        .limit(1);

      if (!proposal) {
        throw new Error(`Inventory day ${proposalId} not found`);
      }

      // Get listing's hostawayId
      const [listing] = await db.query.listings.findMany({
        where: (listings, { eq }) => eq(listings.id, proposal.listingId),
        limit: 1,
      });

      // Generate date range for update - NOW SINGLE DATE
      const dateStr = proposal.date;
      const dates = [parseISO(dateStr)];

      let verified = false;

      // If hostawayId exists, push to HostAway API
      if (listing?.hostawayId) {
        const hostawayId = parseInt(listing.hostawayId);

        // Prepare calendar updates
        const updates: HostawayCalendarUpdate[] = dates.map((date) => ({
          date: format(date, "yyyy-MM-dd"),
          price: parseFloat(proposal.currentPrice),
        }));

        // Execute update to HostAway
        const client = createHostawayClient(this.hostawayApiKey);
        await client.updateCalendar(hostawayId, updates);

        // Verify execution (fetch calendar and check prices)
        verified = await this.verifyExecution(
          hostawayId,
          format(dates[0], "yyyy-MM-dd"),
          format(dates[dates.length - 1], "yyyy-MM-dd"),
          parseFloat(proposal.currentPrice)
        );
      } else {
        // No hostawayId - database-only mode (dev/testing)
        verified = true; // Auto-verify for DB-only mode
      }

      // Update local calendar cache is already done by approve API

      return {
        success: true,
        proposalId,
        updatedDays: dates.length,
        verified,
        executedAt,
      };
    } catch (error) {
      // Mark proposal as failed (keep it approved for retry)
      console.error(`Execution failed for proposal ${proposalId}:`, error);

      return {
        success: false,
        proposalId,
        updatedDays: 0,
        verified: false,
        error: (error as Error).message,
        executedAt,
      };
    }
  }

  /**
   * Execute multiple proposals in batch
   */
  async executeBatch(proposalIds: number[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    // Execute sequentially to avoid rate limiting
    for (const proposalId of proposalIds) {
      const result = await this.executeProposal(proposalId);
      results.push(result);

      // Small delay between executions to respect rate limits
      if (results.length < proposalIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Verify execution by fetching calendar and checking prices
   */
  private async verifyExecution(
    hostawayId: number,
    startDate: string,
    endDate: string,
    expectedPrice: number
  ): Promise<boolean> {
    try {
      const client = createHostawayClient(this.hostawayApiKey);
      const calendar = await client.getCalendar(hostawayId, startDate, endDate);

      // Check if all days have the expected price
      const allMatch = calendar.every((day) => {
        const priceDiff = Math.abs(day.price - expectedPrice);
        return priceDiff < 0.01; // Allow 1 cent tolerance for rounding
      });

      return allMatch;
    } catch (error) {
      console.error("Verification failed:", error);
      return false;
    }
  }

  /**
   * Rollback a proposal execution (revert to previous price)
   */
  async rollbackProposal(proposalId: number): Promise<ExecutionResult> {
    return {
      success: false,
      proposalId,
      updatedDays: 0,
      verified: false,
      error: "Rollbacks not supported in simple 3-table schema yet.",
      executedAt: new Date()
    };
  }
}

/**
 * Create a Channel Sync Agent instance
 */
export function createChannelSyncAgent(hostawayApiKey: string): ChannelSyncAgent {
  return new ChannelSyncAgent(hostawayApiKey);
}
