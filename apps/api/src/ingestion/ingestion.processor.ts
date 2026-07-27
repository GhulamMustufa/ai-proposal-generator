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

    if (job.name === 'cleanup-old-jobs') {
      await this.ingestionService.cleanupOldJobs();
      return { status: 'cleaned up old jobs' };
    }

    let newJobIds: string[] = [];

    try {
      switch (job.name) {
        case 'scrape-remotive':
          newJobIds = await this.ingestionService.scrapeRemotive();
          break;
        case 'scrape-wwr':
          newJobIds = await this.ingestionService.scrapeWWR();
          break;
        case 'scrape-remoteok':
          newJobIds = await this.ingestionService.scrapeRemoteOk();
          break;
        case 'scrape-upwork':
          newJobIds = await this.ingestionService.scrapeUpworkRss('https://www.upwork.com/ab/feed/jobs/rss');
          break;
        case 'scrape-freelancer':
          newJobIds = await this.ingestionService.scrapeFreelancerCom();
          break;
        case 'scrape-workingnomads':
          newJobIds = await this.ingestionService.scrapeWorkingNomads();
          break;
        case 'scrape-himalayas':
          newJobIds = await this.ingestionService.scrapeHimalayas();
          break;
        case 'scrape-jobicy':
          newJobIds = await this.ingestionService.scrapeJobicy();
          break;
        case 'scrape-arbeitnow':
          newJobIds = await this.ingestionService.scrapeArbeitnow();
          break;
        case 'scrape-remoteco':
          newJobIds = await this.ingestionService.scrapeRemoteCo();
          break;
        case 'scrape-dribbble':
          newJobIds = await this.ingestionService.scrapeDribbbleJobs();
          break;
        case 'scrape-relocateme':
          newJobIds = await this.ingestionService.scrapeRelocateMe();
          break;
        case 'scrape-ats-greenhouse':
          newJobIds = await this.atsIngestionService.scrapeGreenhouse();
          break;
        case 'scrape-ats-lever':
          newJobIds = await this.atsIngestionService.scrapeLever();
          break;
        case 'scrape-ats-smartrecruiters':
          newJobIds = await this.atsIngestionService.scrapeSmartRecruiters();
          break;
        case 'scrape-ats-workable':
          newJobIds = await this.atsIngestionService.scrapeWorkable();
          break;
        case 'scrape-ats-breezy':
          newJobIds = await this.atsIngestionService.scrapeBreezy();
          break;
        case 'scrape-ats-ashby':
          newJobIds = await this.atsIngestionService.scrapeAshby();
          break;
        case 'scrape-dorks':
          newJobIds = await this.dorkIngestionService.scrapeGoogleDorks();
          break;
        case 'scrape-jobcity':
          newJobIds = await this.ingestionService.scrapeJobcity();
          break;
        case 'scrape-hackernews':
          newJobIds = await this.ingestionService.scrapeHackerNews();
          break;
        case 'scrape-braintrust':
          newJobIds = await this.graphqlIngestionService.scrapeBraintrust();
          break;
        case 'scrape-pythonorg':
          newJobIds = await this.ingestionService.scrapePythonOrg();
          break;
        case 'scrape-vuejobs':
          newJobIds = await this.ingestionService.scrapeVueJobs();
          break;
        case 'scrape-larajobs':
          newJobIds = await this.ingestionService.scrapeLaraJobs();
          break;
        case 'scrape-devto':
          newJobIds = await this.ingestionService.scrapeDevTo();
          break;
        case 'scrape-remotepython':
          newJobIds = await this.ingestionService.scrapeRemotePython();
          break;
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (e) {
      this.logger.error(`Error processing ${job.name}:`, e);
      throw e;
    }

    if (newJobIds.length > 0) {
      await this.ingestionService.embedJobs(newJobIds);
    }

    return { insertedCount: newJobIds.length };
  }
}
