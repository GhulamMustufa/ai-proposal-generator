import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AtsIngestionService } from './src/ingestion/ats-ingestion.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const atsService = app.get(AtsIngestionService);
  
  console.log('Testing ATS Scrapers...');
  const srJobs = await atsService.scrapeSmartRecruiters();
  console.log('SmartRecruiters Jobs:', srJobs.length);
  
  const ghJobs = await atsService.scrapeGreenhouse();
  console.log('Greenhouse Jobs:', ghJobs.length);
  
  await app.close();
  process.exit(0);
}
bootstrap();
