import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../src/db/schema';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log('Fetching users from the database...');
  
  const allUsers = await db.select().from(users);
  
  if (allUsers.length === 0) {
    console.log('No users found in the database yet.');
  } else {
    allUsers.forEach((user, index) => {
      console.log(`\nUser #${index + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Clerk ID: ${user.id}`);
      console.log(`  -> Postman Token: dev_${user.id}`);
    });
  }
}

main().catch(console.error);
