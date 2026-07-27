const { neon } = require('@neondatabase/serverless');
const { clerkClient } = require('@clerk/clerk-sdk-node');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const users = await clerkClient.users.getUserList();
    console.log('Clerk users:', users.map(u => ({ id: u.id, email: u.emailAddresses[0]?.emailAddress })));
  } catch(e) {
    console.error(e);
  }
}
main();
