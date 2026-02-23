import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function go() {
    await sql`ALTER TABLE listings DROP COLUMN IF EXISTS latitude`;
    await sql`ALTER TABLE listings DROP COLUMN IF EXISTS longitude`;
    console.log('Dropped latitude and longitude from listings');
    const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'listings' ORDER BY ordinal_position`;
    console.log('Listings columns:', cols.map(c => c.column_name));
}

go().catch(e => { console.error('Error:', e); process.exit(1); });
