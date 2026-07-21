import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.development' });
import { sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

async function run() {
  console.log('Creating target_companies table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS target_companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      ats_provider TEXT NOT NULL,
      ats_board_token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('Successfully created target_companies table!');
  process.exit(0);
}

run().catch(console.error);
