const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const res = await sql`SELECT id, email, role FROM users LIMIT 10`;
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
main();
