import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { jobs, aiMatches, applications } from './src/db/schema';
import { sql, inArray, eq } from 'drizzle-orm';
import 'dotenv/config';

async function main() {
  const sqlClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  console.log('Finding duplicates...');
  
  const result: any = await db.execute(sql`
    SELECT external_id, COUNT(*) as c
    FROM jobs
    GROUP BY external_id
    HAVING COUNT(*) > 1
  `);
  
  const duplicates = result.rows || result;
  console.log(`Found ${duplicates.length} duplicate groups.`);
  
  let totalRemoved = 0;
  for (const dup of duplicates) {
    const extId = dup.external_id;
    const res: any = await db.execute(sql`
      SELECT id FROM jobs WHERE external_id = ${extId} ORDER BY scraped_at DESC
    `);
    const rows = res.rows || res;
    
    const primaryId = rows[0].id;
    const duplicateIds = rows.slice(1).map((r: any) => r.id);
    
    if (duplicateIds.length > 0) {
      await db.update(aiMatches).set({ jobId: primaryId }).where(inArray(aiMatches.jobId, duplicateIds));
      await db.update(applications).set({ jobId: primaryId }).where(inArray(applications.jobId, duplicateIds));
      await db.delete(jobs).where(inArray(jobs.id, duplicateIds));
      totalRemoved += duplicateIds.length;
    }
  }
  
  console.log(`Removed ${totalRemoved} duplicate rows.`);
  
  console.log('Adding unique constraint...');
  await db.execute(sql`
    ALTER TABLE jobs ADD CONSTRAINT jobs_external_id_unique UNIQUE (external_id);
  `);
  console.log('Done!');
}

main().catch(console.error);
