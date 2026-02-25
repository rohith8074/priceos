import { neon } from './node_modules/@neondatabase/serverless/index.mjs';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
    readFileSync('.env', 'utf8')
        .split('\n')
        .filter(l => l && !l.startsWith('#') && l.includes('='))
        .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const sql = neon(env.DATABASE_URL);

const cols = await sql`
  SELECT table_name, column_name, data_type, column_default, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position
`;

const tables = {};
cols.forEach(c => {
    if (!tables[c.table_name]) tables[c.table_name] = [];
    tables[c.table_name].push(`${c.column_name} (${c.data_type}${c.column_default ? ', default: ' + c.column_default : ''})`);
});

Object.entries(tables).forEach(([t, cs]) => {
    console.log(`\n📋 ${t}:`);
    cs.forEach(c => console.log(`   ${c}`));
});
