import { db } from "./app/src/lib/db";
import { chatMessages } from "./app/src/lib/db/schema";
import * as fs from 'fs';

async function check() {
    const env = fs.readFileSync('app/.env', 'utf8');
    const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL=')).split('=')[1].replace(/"/g, '').trim();
    process.env.DATABASE_URL = dbUrl;

    const msgs = await db.select().from(chatMessages);
    console.log('COUNT:', msgs.length);
    msgs.forEach(m => console.log(`[${m.role}] ${m.listingId}: ${m.content.substring(0, 30)}...`));
}

check().catch(console.error);
