import { db } from './src/lib/db';
import { chatMessages } from './src/lib/db/schema';
import { isNotNull, desc } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load env from the current directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function run() {
    console.log("Checking last 5 messages with proposals...");
    try {
        const msgs = await db.select()
            .from(chatMessages)
            .where(isNotNull(chatMessages.structured))
            .orderBy(desc(chatMessages.createdAt))
            .limit(5);

        if (msgs.length === 0) {
            console.log("No messages found.");
            return;
        }

        msgs.forEach((m, i) => {
            const proposals = m.structured?.proposals;
            if (proposals) {
                console.log(`\n--- Message ${i + 1} (Session: ${m.sessionId}) ---`);
                console.log(`Listing ID: ${m.listingId}`);
                console.log(`Number of proposals: ${proposals.length}`);
                proposals.slice(0, 3).forEach((p: any, j: number) => {
                    console.log(`  Proposal ${j + 1}: Date: ${p.date}, Price: ${p.proposed_price}, Reasoning: ${p.reasoning?.substring(0, 100)}...`);
                });
            }
        });
    } catch (err) {
        console.error("Database error:", err);
    }
    process.exit(0);
}

run();
