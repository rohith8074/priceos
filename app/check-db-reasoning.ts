import { db } from './src/lib/db';
import { inventoryMaster } from './src/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';
import { format } from 'date-fns';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function run() {
    const today = format(new Date(), "yyyy-MM-dd");
    try {
        const rows = await db.select()
            .from(inventoryMaster)
            .where(and(
                eq(inventoryMaster.proposalStatus, 'pending'),
                gte(inventoryMaster.date, today)
            ))
            .limit(10);

        console.log("Found " + rows.length + " pending records in DB:");
        rows.forEach(r => {
            console.log(`Date: ${r.date}, Listing: ${r.listingId}, Reasoning: ${r.reasoning?.substring(0, 50)}...`);
        });
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
run();
