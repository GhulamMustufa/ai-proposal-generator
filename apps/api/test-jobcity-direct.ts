import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { IngestionService } from './src/ingestion/ingestion.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ingestionService = app.get(IngestionService);
  
  console.log('Testing Jobcity scraper...');
  const jobs = await ingestionService.scrapeJobcity();
  console.log('Jobcity Jobs inserted:', jobs.length);
  
  await app.close();
  process.exit(0);
}
bootstrap();
