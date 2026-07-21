import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { aiMatches, jobs, userProfiles } from '../src/db/schema';
import { eq } from 'drizzle-orm';

config({ path: resolve(__dirname, '../.env') });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  const userId = 'user_3Gp8HK2kdd9GbmI1xQEOEkifzr7';

  console.log('--- Diagnostic Report ---');
  
  // 1. Check total jobs in DB
  const allJobs = await db.select().from(jobs);
  console.log(`Total jobs in database: ${allJobs.length}`);

  // 2. Check user profile skills
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  console.log(`User Skills Configured: ${profile?.skills ? JSON.stringify(profile.skills) : 'None'}`);

  // 3. Check AI matches for user
  const matches = await db.select().from(aiMatches).where(eq(aiMatches.userId, userId));
  console.log(`Total ai_matches rows for user: ${matches.length}`);

  // 4. Check how many are > 0
  const validMatches = matches.filter(m => m.matchScore !== null && m.matchScore > 0);
  console.log(`Matches with score > 0: ${validMatches.length}`);

  if (matches.length > 0) {
    console.log('\nSample match reasoning (score 0):');
    const zeroMatch = matches.find(m => m.matchScore === 0);
    if (zeroMatch) console.log(zeroMatch.matchReasoning);

    console.log('\nSample match reasoning (score > 0):');
    const positiveMatch = validMatches[0];
    if (positiveMatch) console.log(`Score: ${positiveMatch.matchScore} - ${positiveMatch.matchReasoning}`);
  }
}

main().catch(console.error);
