import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { IngestionService } from './ingestion.service';
import { AtsIngestionService } from './ats-ingestion.service';
import { DorkIngestionService } from './dork-ingestion.service';

/**
 * IngestionProcessor
 * 
 * BullMQ Worker for the 'ingestion-queue'.
 * Handles processing of scraping jobs and dispatches events to the matcher.
 */
@Processor('ingestion-queue')
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly ingestionService: IngestionService,
    private readonly atsIngestionService: AtsIngestionService,
    private readonly dorkIngestionService: DorkIngestionService,
    @InjectQueue('matcher-queue') private readonly matcherQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing ingestion job ${job.id} of type ${job.name}`);
    
    if (job.name === 'scrape-remotive') {
      const newJobIds = await this.ingestionService.scrapeRemotive();
      
      // Dispatch an event to the Matcher Queue for each newly inserted job
      for (const jobId of newJobIds) {
        await this.matcherQueue.add('match-job', { jobId });
        this.logger.log(`Dispatched matcher job for new job ID: ${jobId}`);
      }
      
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-wwr') {
      const newJobIds = await this.ingestionService.scrapeWWR();
      for (const jobId of newJobIds) {
        await this.matcherQueue.add('match-job', { jobId });
        this.logger.log(`Dispatched matcher job for new job ID: ${jobId}`);
      }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-remoteok') {
      const newJobIds = await this.ingestionService.scrapeRemoteOk();
      for (const jobId of newJobIds) {
        await this.matcherQueue.add('match-job', { jobId });
        this.logger.log(`Dispatched matcher job for new job ID: ${jobId}`);
      }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-upwork') {
      // Hardcoding a dummy Upwork RSS URL (e.g., searching for 'javascript' jobs)
      // This can be retrieved from the database or job.data in the future
      const feedUrl = 'https://www.upwork.com/ab/feed/jobs/rss?q=javascript';
      const newJobIds = await this.ingestionService.scrapeUpworkRss(feedUrl);
      for (const jobId of newJobIds) {
        await this.matcherQueue.add('match-job', { jobId });
        this.logger.log(`Dispatched matcher job for new job ID: ${jobId}`);
      }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-freelancer') {
      const newJobIds = await this.ingestionService.scrapeFreelancerCom();
      for (const jobId of newJobIds) {
        await this.matcherQueue.add('match-job', { jobId });
        this.logger.log(`Dispatched matcher job for new job ID: ${jobId}`);
      }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-workingnomads') {
      const newJobIds = await this.ingestionService.scrapeWorkingNomads();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-himalayas') {
      const newJobIds = await this.ingestionService.scrapeHimalayas();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-jobicy') {
      const newJobIds = await this.ingestionService.scrapeJobicy();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-arbeitnow') {
      const newJobIds = await this.ingestionService.scrapeArbeitnow();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-remoteco') {
      const newJobIds = await this.ingestionService.scrapeRemoteCo();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-dribbble') {
      const newJobIds = await this.ingestionService.scrapeDribbbleJobs();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-relocateme') {
      const newJobIds = await this.ingestionService.scrapeRelocateMe();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-greenhouse') {
      const newJobIds = await this.atsIngestionService.scrapeGreenhouse();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-lever') {
      const newJobIds = await this.atsIngestionService.scrapeLever();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-smartrecruiters') {
      const newJobIds = await this.atsIngestionService.scrapeSmartRecruiters();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-workable') {
      const newJobIds = await this.atsIngestionService.scrapeWorkable();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-breezy') {
      const newJobIds = await this.atsIngestionService.scrapeBreezy();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-ashby') {
      const newJobIds = await this.atsIngestionService.scrapeAshby();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }
    
    if (job.name === 'scrape-dorks') {
      const newJobIds = await this.dorkIngestionService.scrapeGoogleDorks();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-jobcity') {
      const newJobIds = await this.ingestionService.scrapeJobcity();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-hackernews') {
      const newJobIds = await this.ingestionService.scrapeHackerNews();
      for (const jobId of newJobIds) { await this.matcherQueue.add('match-job', { jobId }); }
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'cleanup-old-jobs') {
      await this.ingestionService.cleanupOldJobs();
      return { status: 'cleaned up old jobs' };
    }
    
    this.logger.warn(`Unknown job name: ${job.name}`);
  }
}
