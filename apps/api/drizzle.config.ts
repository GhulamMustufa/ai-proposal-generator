import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load the root .env file so Drizzle can read DATABASE_URL
dotenv.config({ path: '.env' });

export default defineConfig({
  schema: __dirname + '/src/db/schema.ts',
  out: __dirname + '/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
