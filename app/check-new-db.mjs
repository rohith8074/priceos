import { neon } from './node_modules/@neondatabase/serverless/index.mjs';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
    readFileSync('.env', 'utf8')
        .split('\n')
        .filter(l => l && !l.startsWith('#') && l.includes('='))
        .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const sql = neon(env.DATABASE_URL);

console.log('Checking users in NEW database...');
try {
    const users = await sql`SELECT user_id, email, is_approved FROM user_settings`;
    console.table(users);
} catch (e) {
    console.log('Error or no users found:', e.message);
}
