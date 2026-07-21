import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { aiMatches, jobs, userProfiles } from '../src/db/schema';
import { eq, desc, and, gt } from 'drizzle-orm';

config({ path: resolve(__dirname, '../.env') });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  const userId = 'user_3Gp8HK2kdd9GbmI1xQEOEkifzr7';

  const allJobs = await db.select().from(jobs);
  console.log(`Total jobs scanned in database: ${allJobs.length}`);

  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  const userSkills = profile.skills as string[];
  
  let matchCount5 = 0;
  let matchCount3 = 0;

  for (const job of allJobs) {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    
    const matchedSkills = userSkills.filter((skill: any) => {
      const skillStr = String(skill).toLowerCase();
      let pattern = skillStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = pattern.replace(/\\\.(js)/g, '(?:\\.js|js|\\sjs)');
      pattern = pattern.replace(/[- ]/g, '[- ]?');
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      return regex.test(jobText);
    });

    if (matchedSkills.length >= 5) matchCount5++;
    if (matchedSkills.length >= 3) matchCount3++;
  }

  console.log(`Jobs with 5+ skills: ${matchCount5}`);
  console.log(`Jobs with 3+ skills: ${matchCount3}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
