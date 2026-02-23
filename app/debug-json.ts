import { db } from './src/lib/db';
import { chatMessages } from './src/lib/db/schema';
import { isNotNull, desc } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function run() {
    try {
        const msgs = await db.select()
            .from(chatMessages)
            .where(isNotNull(chatMessages.structured))
            .orderBy(desc(chatMessages.createdAt))
            .limit(1);

        if (msgs.length === 0) {
            console.log("None found");
            return;
        }

        console.log(JSON.stringify(msgs[0].structured?.proposals, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
run();
