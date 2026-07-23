import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from './src/db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('Connecting to database...');
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log('Reverting all users to Free...');
  await db.update(users).set({ subscriptionStatus: 'free', generationsCount: 0 });

  console.log('Successfully reverted users to free status.');
}

main().catch(console.error);
