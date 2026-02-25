import { neon } from './node_modules/@neondatabase/serverless/index.mjs';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
    readFileSync('.env', 'utf8')
        .split('\n')
        .filter(l => l && !l.startsWith('#') && l.includes('='))
        .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const sql = neon(env.DATABASE_URL);

console.log('Fetching users pending approval...');
const users = await sql`
  SELECT user_id, email, full_name, is_approved, created_at
  FROM user_settings
  ORDER BY created_at DESC
`;

console.table(users);
