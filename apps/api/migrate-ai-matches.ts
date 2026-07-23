import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("Adding persona_id to ai_matches table...");
  
  try {
    await sql`
      ALTER TABLE ai_matches 
      ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES personas(id) ON DELETE CASCADE;
    `;
    console.log("Migration successful: added persona_id to ai_matches.");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrate();
