import { neon } from './node_modules/@neondatabase/serverless/index.mjs';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
    readFileSync('.env', 'utf8')
        .split('\n')
        .filter(l => l && !l.startsWith('#') && l.includes('='))
        .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const sql = neon(env.DATABASE_URL);

console.log('Approving user: rohith.p@lyzr.ai');
const result = await sql`
  UPDATE user_settings 
  SET is_approved = true 
  WHERE email = 'rohith.p@lyzr.ai'
  RETURNING *
`;

if (result.length > 0) {
    console.log('User approved successfully:');
    console.table(result);
} else {
    console.log('No user found with that email.');
}
