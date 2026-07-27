const { Pool } = require('pg');
require('dotenv').config({ path: './apps/api/.env' });

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query('SELECT COUNT(*) as total_jobs, MIN(scraped_at) as earliest_job, MAX(scraped_at) as latest_job FROM jobs');
  console.log(res.rows[0]);
  await pool.end();
}
run().catch(console.error);
