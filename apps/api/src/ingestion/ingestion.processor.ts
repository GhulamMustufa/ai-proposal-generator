import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IngestionService } from './ingestion.service';
import { AtsIngestionService } from './ats-ingestion.service';
import { DorkIngestionService } from './dork-ingestion.service';
import { GraphqlIngestionService } from './graphql-ingestion.service';

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
    private readonly graphqlIngestionService: GraphqlIngestionService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing ingestion job ${job.id} of type ${job.name}`);

    if (job.name === 'scrape-remotive') {
      const newJobIds = await this.ingestionService.scrapeRemotive();


      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-wwr') {
      const newJobIds = await this.ingestionService.scrapeWWR();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-remoteok') {
      const newJobIds = await this.ingestionService.scrapeRemoteOk();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-upwork') {
      // Hardcoding a dummy Upwork RSS URL (e.g., searching for 'javascript' jobs)
      // This can be retrieved from the database or job.data in the future
      const feedUrl = 'https://www.upwork.com/ab/feed/jobs/rss?q=javascript';
      const newJobIds = await this.ingestionService.scrapeUpworkRss(feedUrl);
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-freelancer') {
      const newJobIds = await this.ingestionService.scrapeFreelancerCom();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-workingnomads') {
      const newJobIds = await this.ingestionService.scrapeWorkingNomads();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-himalayas') {
      const newJobIds = await this.ingestionService.scrapeHimalayas();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-jobicy') {
      const newJobIds = await this.ingestionService.scrapeJobicy();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-arbeitnow') {
      const newJobIds = await this.ingestionService.scrapeArbeitnow();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-remoteco') {
      const newJobIds = await this.ingestionService.scrapeRemoteCo();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-dribbble') {
      const newJobIds = await this.ingestionService.scrapeDribbbleJobs();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-relocateme') {
      const newJobIds = await this.ingestionService.scrapeRelocateMe();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-greenhouse') {
      const newJobIds = await this.atsIngestionService.scrapeGreenhouse();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-lever') {
      const newJobIds = await this.atsIngestionService.scrapeLever();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-smartrecruiters') {
      const newJobIds = await this.atsIngestionService.scrapeSmartRecruiters();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-workable') {
      const newJobIds = await this.atsIngestionService.scrapeWorkable();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-breezy') {
      const newJobIds = await this.atsIngestionService.scrapeBreezy();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-ats-ashby') {
      const newJobIds = await this.atsIngestionService.scrapeAshby();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-dorks') {
      const newJobIds = await this.dorkIngestionService.scrapeGoogleDorks();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-jobcity') {
      const newJobIds = await this.ingestionService.scrapeJobcity();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-hackernews') {
      const newJobIds = await this.ingestionService.scrapeHackerNews();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'scrape-braintrust') {
      const newJobIds = await this.graphqlIngestionService.scrapeBraintrust();
      return { insertedCount: newJobIds.length };
    }

    if (job.name === 'cleanup-old-jobs') {
      await this.ingestionService.cleanupOldJobs();
      return { status: 'cleaned up old jobs' };
    }

    this.logger.warn(`Unknown job name: ${job.name}`);
  }
}
