import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config(); // Loads .env from apps/api

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env');
  }
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Enabling pgvector extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    
    console.log('Adding embedding column to jobs...');
    await sql`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);`;
    
    console.log('Adding embedding column to personas...');
    await sql`ALTER TABLE "personas" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);`;
    
    console.log('Successfully migrated database for pgvector');
  } catch (err) {
    console.error('Migration error:', err);
  }
}

run();
