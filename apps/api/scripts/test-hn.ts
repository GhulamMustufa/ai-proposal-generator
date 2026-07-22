import { IngestionService } from '../src/ingestion/ingestion.service';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

async function run() {
  const sql = neon('postgresql://neondb_owner:npg_pIMH4Ybf8QWc@ep-late-smoke-av088ddi-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require');
  const db = drizzle(sql);
  
  // @ts-ignore
  const service = new IngestionService(db);
  // @ts-ignore
  service.logger = { log: console.log, error: console.error };
  
  console.log("Starting scrape...");
  const ids = await service.scrapeHackerNews();
  console.log("Done. Inserted IDs:", ids.length);
}
run();
