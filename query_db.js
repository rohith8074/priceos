const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: 'app/.env' });

async function run() {
  const sql = neon(process.env.DATABASE_URL);

  const calendar = await sql`
    SELECT date, status, current_price 
    FROM inventory_master 
    WHERE listing_id = 15
    AND date >= '2026-02-01' AND date <= '2026-02-28'
    ORDER BY date ASC
  `;
  console.log("Calendar rows:", calendar.length);
  console.log("Calendar distribution:", calendar.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {}));

  const res = await sql`
    SELECT * 
    FROM activity_timeline 
    WHERE listing_id = 15
    AND type = 'reservation'
    AND start_date <= '2026-02-28'
    AND end_date >= '2026-02-01'
  `;
  console.log("Reservations records:", res.length);
  res.forEach(r => {
    console.log(`- ${r.title}: ${r.start_date} to ${r.end_date}, Fin:`, r.financials);
  });
}
run().catch(console.error);
