import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DB_CONNECTION } from '../db/db.module';
import { personas } from '../db/schema';
import { MatcherService } from '../matcher/matcher.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const db = app.get(DB_CONNECTION);
  const matcherService = app.get(MatcherService);

  console.log('Starting full re-evaluation for all personas...');

  const allPersonas = await db.select().from(personas);
  
  if (allPersonas.length === 0) {
    console.log('No personas found.');
    process.exit(0);
  }

  console.log(`Found ${allPersonas.length} personas. Starting re-evaluation...`);

  for (const persona of allPersonas) {
    console.log(`\nRe-evaluating persona: ${persona.name} (${persona.id})...`);
    // Pass 'true' as the second argument to force a full backfill/re-evaluation
    await matcherService.syncPersonaJobs(persona.id, true);
  }

  console.log('\nFinished full re-evaluation for all personas!');
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
