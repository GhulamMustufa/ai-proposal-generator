import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("Creating personas table...");
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS personas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        skills JSONB,
        ideal_salary TEXT,
        years_of_experience INTEGER,
        resume_text TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Migration successful: created personas table.");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrate();
