
import { db } from '../src/lib/db';

async function listTables() {
    try {
        const result: any = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Current tables in database:", result.rows);

        const tablesToClear = result.rows.map((r: any) => r.table_name)
            .filter((name: string) => !name.startsWith('drizzle') && name !== 'user_settings'); // Keep settings

        if (tablesToClear.length > 0) {
            console.log("Truncating:", tablesToClear.join(', '));
            const query = `TRUNCATE TABLE ${tablesToClear.map(t => `"${t}"`).join(', ')} CASCADE`;
            await db.execute(query);
            console.log("✅ All dummy data removed successfully.");
        } else {
            console.log("No tables to clear.");
        }
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        process.exit(0);
    }
}

listTables();
