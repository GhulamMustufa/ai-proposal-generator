import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also try .env.development
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    console.log('Adding columns...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id text;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id text;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS generations_count integer DEFAULT 0 NOT NULL;`;
    console.log('Success!');
  } catch (err) {
    console.error('Error adding columns:', err);
  }
}

run();
