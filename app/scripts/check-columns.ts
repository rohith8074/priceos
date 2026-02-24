import { db } from '../src/lib/db';

async function checkColumns() {
    try {
        const result: any = await db.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_settings'");
        console.log("Columns in user_settings:", result.rows);
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        process.exit(0);
    }
}

checkColumns();
