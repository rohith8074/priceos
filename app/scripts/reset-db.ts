import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function reset() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log('Schema reset complete.');
}

reset().catch((e) => {
  console.error(e);
  process.exit(1);
});
