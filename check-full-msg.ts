import { db } from "./app/src/lib/db";
import { chatMessages } from "./app/src/lib/db/schema";
import * as fs from 'fs';

async function check() {
    const env = fs.readFileSync('app/.env', 'utf8');
    const dbLine = env.split('\n').find(l => l.startsWith('DATABASE_URL='));
    if (!dbLine) throw new Error('DATABASE_URL not found');
    const dbUrl = dbLine.split('=')[1].replace(/"/g, '').trim();
    process.env.DATABASE_URL = dbUrl;

    const msgs = await db.select().from(chatMessages).limit(1);
    console.log(JSON.stringify(msgs[0], null, 2));
}

check().catch(console.error);
