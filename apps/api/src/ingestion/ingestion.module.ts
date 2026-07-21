import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IngestionService } from './ingestion.service';
import { AtsIngestionService } from './ats-ingestion.service';
import { DorkIngestionService } from './dork-ingestion.service';
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
  providers: [IngestionService, AtsIngestionService, DorkIngestionService, IngestionProcessor],
  exports: [IngestionService, AtsIngestionService, DorkIngestionService],
})
export class IngestionModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(IngestionModule.name);

  constructor(
    @InjectQueue('ingestion-queue') private readonly ingestionQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Scheduling repeatable ingestion jobs...');
    
    // Scrape Remotive at 8am, 2pm, and 8pm everyday
    await this.ingestionQueue.add('scrape-remotive', {}, {
      repeat: {
        pattern: '0 8,14,20 * * *', 
      },
      // Job ID deduplicates repeatable jobs, preventing multiples on reboot
      jobId: 'repeatable-remotive',
    });

    // Scrape WWR at 9am, 3pm, and 9pm everyday
    await this.ingestionQueue.add('scrape-wwr', {}, {
      repeat: {
        pattern: '0 9,15,21 * * *', 
      },
      jobId: 'repeatable-wwr',
    });

    // Scrape Remote OK at 10am, 4pm, and 10pm everyday
    await this.ingestionQueue.add('scrape-remoteok', {}, {
      repeat: {
        pattern: '0 10,16,22 * * *', 
      },
      jobId: 'repeatable-remoteok',
    });

    // Scrape Upwork RSS at 11am, 5pm, and 11pm everyday
    await this.ingestionQueue.add('scrape-upwork', {}, {
      repeat: {
        pattern: '0 11,17,23 * * *', 
      },
      jobId: 'repeatable-upwork',
    });

    // Scrape Freelancer at 7am, 1pm, and 7pm everyday
    await this.ingestionQueue.add('scrape-freelancer', {}, {
      repeat: { pattern: '0 7,13,19 * * *' },
      jobId: 'repeatable-freelancer',
    });

    // Scrape Working Nomads at 12am, 6am, 12pm, 6pm
    await this.ingestionQueue.add('scrape-workingnomads', {}, {
      repeat: { pattern: '0 0,6,12,18 * * *' },
      jobId: 'repeatable-workingnomads',
    });

    // Scrape Himalayas at 1am, 7am, 1pm, 7pm
    await this.ingestionQueue.add('scrape-himalayas', {}, {
      repeat: { pattern: '0 1,7,13,19 * * *' },
      jobId: 'repeatable-himalayas',
    });

    // Scrape Jobicy at 2am, 8am, 2pm, 8pm
    await this.ingestionQueue.add('scrape-jobicy', {}, {
      repeat: { pattern: '0 2,8,14,20 * * *' },
      jobId: 'repeatable-jobicy',
    });

    // Scrape Arbeitnow at 3am, 9am, 3pm, 9pm
    await this.ingestionQueue.add('scrape-arbeitnow', {}, {
      repeat: { pattern: '0 3,9,15,21 * * *' },
      jobId: 'repeatable-arbeitnow',
    });

    // Scrape Remote.co at 4am, 10am, 4pm, 10pm
    await this.ingestionQueue.add('scrape-remoteco', {}, {
      repeat: { pattern: '0 4,10,16,22 * * *' },
      jobId: 'repeatable-remoteco',
    });

    // Scrape Dribbble at 5am, 11am, 5pm, 11pm
    await this.ingestionQueue.add('scrape-dribbble', {}, {
      repeat: { pattern: '0 5,11,17,23 * * *' },
      jobId: 'repeatable-dribbble',
    });

    // Scrape Relocate.me at 6am, 12pm, 6pm
    await this.ingestionQueue.add('scrape-relocateme', {}, {
      repeat: { pattern: '0 6,12,18 * * *' },
      jobId: 'repeatable-relocateme',
    });

    // Scrape all Greenhouse ATS Boards at 2am
    await this.ingestionQueue.add('scrape-ats-greenhouse', {}, {
      repeat: { pattern: '0 2 * * *' },
      jobId: 'repeatable-ats-greenhouse',
    });

    // Scrape all Lever ATS Boards at 3am
    await this.ingestionQueue.add('scrape-ats-lever', {}, {
      repeat: { pattern: '0 3 * * *' },
      jobId: 'repeatable-ats-lever',
    });

    // Execute Google Dorks at 4am everyday (optimized for 250 limits)
    await this.ingestionQueue.add('scrape-dorks', {}, {
      repeat: { pattern: '0 4 * * *' },
      jobId: 'repeatable-dorks',
    });
  }
}

