const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE personas DROP COLUMN IF EXISTS ideal_salary;`;
    console.log('Dropped ideal_salary successfully');
  } catch (err) {
    console.error(err);
  }
}
run();
