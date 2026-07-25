const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    await sql`ALTER TABLE ai_matches ADD COLUMN status text NOT NULL DEFAULT 'pending';`;
    console.log("Successfully added status column to ai_matches");
  } catch (err) {
    // If the column already exists, it will throw an error, which is fine
    console.error("Migration error (maybe column already exists?):", err.message);
  }
}

main();
