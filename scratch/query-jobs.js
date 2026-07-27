const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: './apps/api/.env' });

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  
  const result = await sql`
    SELECT 
      COUNT(*) as total_jobs, 
      MIN(scraped_at) as earliest_job, 
      MAX(scraped_at) as latest_job 
    FROM jobs;
  `;
  
  console.log(result[0]);
}

run().catch(console.error);
