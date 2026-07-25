const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE personas ADD COLUMN IF NOT EXISTS job_filters JSONB;`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS api_keys JSONB;`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS default_persona_id UUID;`;
    console.log('Columns created successfully');
  } catch (err) {
    console.error(err);
  }
}
run();
