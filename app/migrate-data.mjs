import { neon } from './node_modules/@neondatabase/serverless/index.mjs';

const OLD_DB_URL = "postgresql://neondb_owner:npg_lKTu8vVGR5ae@ep-steep-queen-aieg4fa3.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
const NEW_DB_URL = "postgresql://neondb_owner:npg_1slOmd6txHiL@ep-raspy-dawn-aib1nihy-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sqlOld = neon(OLD_DB_URL);
const sqlNew = neon(NEW_DB_URL);

const tables = [
    'listings',
    'user_settings',
    'reservations',
    'market_events',
    'benchmark_data',
    'chat_messages',
    'inventory_master',
    'guest_summaries',
    'hostaway_conversations',
    'mock_hostaway_replies'
];

async function migrate() {
    console.log('🚀 Starting Data Migration (Robust Version)...');

    for (const table of tables) {
        try {
            console.log(`\n📦 Migrating table: ${table}...`);

            const rows = await sqlOld.query(`SELECT * FROM ${table}`);
            console.log(`   Found ${rows.length} rows in old DB.`);

            if (rows.length === 0) continue;

            let successCount = 0;
            const BATCH_SIZE = 50;

            for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                const batch = rows.slice(i, i + BATCH_SIZE);

                await Promise.all(batch.map(async (row) => {
                    const columns = Object.keys(row);
                    const values = Object.values(row).map(val => {
                        if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
                            return JSON.stringify(val);
                        }
                        return val;
                    });

                    const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
                    const colNames = columns.join(', ');
                    const query = `INSERT INTO ${table} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

                    try {
                        await sqlNew.query(query, values);
                        successCount++;
                    } catch (err) {
                        console.error(`   ⚠️ Failed row in ${table}:`, err.message);
                    }
                }));

                console.log(`   Progress: ${successCount}/${rows.length} rows...`);
                // Small delay to prevent rate limits
                await new Promise(r => setTimeout(r, 200));
            }

            console.log(`   ✅ Finished ${table}: ${successCount}/${rows.length} rows migrated.`);
        } catch (err) {
            console.error(`   ❌ Error migrating ${table}:`, err.message);
        }
    }

    console.log('\n🏁 Migration complete!');
}

migrate();
