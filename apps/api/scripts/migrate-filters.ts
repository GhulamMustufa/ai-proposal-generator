import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.development' });
import { sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

async function run() {
  console.log('Adding job_filters column to user_profiles table...');
  await db.execute(sql`
    ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS job_filters JSONB;
  `);
  console.log('Successfully added job_filters column!');
  process.exit(0);
}

run().catch(console.error);
