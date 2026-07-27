import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IngestionService } from './ingestion.service';
import { AtsIngestionService } from './ats-ingestion.service';
import { DorkIngestionService } from './dork-ingestion.service';
import { GraphqlIngestionService } from './graphql-ingestion.service';
import { IngestionProcessor } from './ingestion.processor';
import { IngestionController } from './ingestion.controller';

/**
 * IngestionModule
 *
 * Configures the ingestion and matcher queues.
 * Uses OnApplicationBootstrap to safely schedule cron-based scraping jobs.
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ingestion-queue',
    }),
    BullModule.registerQueue({
      name: 'matcher-queue',
    }),
  ],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    AtsIngestionService,
    DorkIngestionService,
    GraphqlIngestionService,
    IngestionProcessor,
  ],
  exports: [
    IngestionService,
    AtsIngestionService,
    DorkIngestionService,
    GraphqlIngestionService,
  ],
})
export class IngestionModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(IngestionModule.name);

  constructor(
    @InjectQueue('ingestion-queue') private readonly ingestionQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
      this.logger.log('Scheduling repeatable ingestion jobs...');
      
      // Scrape Remotive at 8am, 2pm, and 8pm everyday
      await this.ingestionQueue.add(
        'scrape-remotive',
        {},
        {
          repeat: {
            pattern: '0 8,14,20 * * *',
          },
          // Job ID deduplicates repeatable jobs, preventing multiples on reboot
          jobId: 'repeatable-remotive',
        },
      );
  
      // Scrape WWR at 9am, 3pm, and 9pm everyday
      await this.ingestionQueue.add(
        'scrape-wwr',
        {},
        {
          repeat: {
            pattern: '0 9,15,21 * * *',
          },
          jobId: 'repeatable-wwr',
        },
      );
  
      // Scrape Remote OK at 10am, 4pm, and 10pm everyday
      await this.ingestionQueue.add(
        'scrape-remoteok',
        {},
        {
          repeat: {
            pattern: '0 10,16,22 * * *',
          },
          jobId: 'repeatable-remoteok',
        },
      );
  
      // Scrape Freelancer at 7am, 1pm, and 7pm everyday
      await this.ingestionQueue.add(
        'scrape-freelancer',
        {},
        {
          repeat: { pattern: '0 7,13,19 * * *' },
          jobId: 'repeatable-freelancer',
        },
      );
  
      // Scrape Working Nomads at 12am, 6am, 12pm, 6pm
      await this.ingestionQueue.add(
        'scrape-workingnomads',
        {},
        {
          repeat: { pattern: '0 0,6,12,18 * * *' },
          jobId: 'repeatable-workingnomads',
        },
      );
  
      // Scrape Himalayas at 1am, 7am, 1pm, 7pm
      await this.ingestionQueue.add(
        'scrape-himalayas',
        {},
        {
          repeat: { pattern: '0 1,7,13,19 * * *' },
          jobId: 'repeatable-himalayas',
        },
      );
  
      // Scrape Jobicy at 2am, 8am, 2pm, 8pm
      await this.ingestionQueue.add(
        'scrape-jobicy',
        {},
        {
          repeat: { pattern: '0 2,8,14,20 * * *' },
          jobId: 'repeatable-jobicy',
        },
      );
  
      // Scrape Arbeitnow at 3am, 9am, 3pm, 9pm
      await this.ingestionQueue.add(
        'scrape-arbeitnow',
        {},
        {
          repeat: { pattern: '0 3,9,15,21 * * *' },
          jobId: 'repeatable-arbeitnow',
        },
      );
  
      // Scrape Dribbble at 5am, 11am, 5pm, 11pm
      await this.ingestionQueue.add(
        'scrape-dribbble',
        {},
        {
          repeat: { pattern: '0 5,11,17,23 * * *' },
          jobId: 'repeatable-dribbble',
        },
      );
  
      // Scrape all Greenhouse ATS Boards at 2am
      await this.ingestionQueue.add(
        'scrape-ats-greenhouse',
        {},
        {
          repeat: { pattern: '0 2 * * *' },
          jobId: 'repeatable-ats-greenhouse',
        },
      );
  
      // Scrape all Lever ATS Boards at 3am
      await this.ingestionQueue.add(
        'scrape-ats-lever',
        {},
        {
          repeat: { pattern: '0 3 * * *' },
          jobId: 'repeatable-ats-lever',
        },
      );
  
      // Scrape all SmartRecruiters ATS Boards at 4am
      await this.ingestionQueue.add(
        'scrape-ats-smartrecruiters',
        {},
        {
          repeat: { pattern: '0 4 * * *' },
          jobId: 'repeatable-ats-smartrecruiters',
        },
      );
  
      // Scrape all Workable ATS Boards at 5am
      await this.ingestionQueue.add(
        'scrape-ats-workable',
        {},
        {
          repeat: { pattern: '0 5 * * *' },
          jobId: 'repeatable-ats-workable',
        },
      );
  
      // Scrape all Breezy HR ATS Boards at 6am
      await this.ingestionQueue.add(
        'scrape-ats-breezy',
        {},
        {
          repeat: { pattern: '0 6 * * *' },
          jobId: 'repeatable-ats-breezy',
        },
      );
  
      // Scrape all Ashby HQ ATS Boards at 7am
      await this.ingestionQueue.add(
        'scrape-ats-ashby',
        {},
        {
          repeat: { pattern: '0 7 * * *' },
          jobId: 'repeatable-ats-ashby',
        },
      );
  
      // Scrape Google Dorks at 8am and 8pm
      await this.ingestionQueue.add(
        'scrape-dorks',
        {},
        {
          repeat: { pattern: '0 8,20 * * *' },
          jobId: 'repeatable-dorks',
        },
      );
  
      // Scrape JobCity Malaysia at 10am and 4pm
      await this.ingestionQueue.add(
        'scrape-jobcity',
        {},
        {
          repeat: { pattern: '0 10,16 * * *' },
          jobId: 'repeatable-jobcity',
        },
      );
  
      // Scrape Hacker News at 12pm on the 1st, 2nd, and 3rd of every month
      // (HN Mega threads are usually posted on the 1st)
      await this.ingestionQueue.add(
        'scrape-hackernews',
        {},
        {
          repeat: { pattern: '0 12 1,2,3 * *' },
          jobId: 'repeatable-hackernews',
        },
      );
  
      // Scrape Braintrust every 12 hours (e.g. 5 AM and 5 PM)
      await this.ingestionQueue.add(
        'scrape-braintrust',
        {},
        {
          repeat: { pattern: '0 5,17 * * *' },
          jobId: 'repeatable-braintrust',
        },
      );

      // Scrape Python.org every day at 8 AM and 8 PM
      await this.ingestionQueue.add(
        'scrape-pythonorg',
        {},
        {
          repeat: { pattern: '0 8,20 * * *' },
          jobId: 'repeatable-pythonorg',
        },
      );

      // Scrape VueJobs every day at 9 AM and 9 PM
      await this.ingestionQueue.add(
        'scrape-vuejobs',
        {},
        {
          repeat: { pattern: '0 9,21 * * *' },
          jobId: 'repeatable-vuejobs',
        },
      );

      // Scrape LaraJobs every day at 10 AM and 10 PM
      await this.ingestionQueue.add(
        'scrape-larajobs',
        {},
        {
          repeat: { pattern: '0 10,22 * * *' },
          jobId: 'repeatable-larajobs',
        },
      );

      // Scrape Dev.to every day at 11 AM and 11 PM
      await this.ingestionQueue.add(
        'scrape-devto',
        {},
        {
          repeat: { pattern: '0 11,23 * * *' },
          jobId: 'repeatable-devto',
        },
      );

      // Scrape RemotePython every day at 12 AM and 12 PM
      await this.ingestionQueue.add(
        'scrape-remotepython',
        {},
        {
          repeat: { pattern: '0 0,12 * * *' },
          jobId: 'repeatable-remotepython',
        },
      );

      // Cleanup old jobs from database at 12:30 AM every day
      await this.ingestionQueue.add(
        'cleanup-old-jobs',
        {},
        {
          repeat: { pattern: '30 0 * * *' },
          jobId: 'repeatable-cleanup-old-jobs',
        },
      );
  }
}
