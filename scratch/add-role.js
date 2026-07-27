const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    await sql`UPDATE users SET role = 'admin' WHERE email = 'mustufa.g82@gmail.com';`;
    console.log("User role updated successfully.");
  } catch (err) {
    console.error(err);
  }
}

main();
