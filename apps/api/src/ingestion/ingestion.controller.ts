import { Controller, Post, Param, Logger, Req, UnauthorizedException, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('api/ingestion')
@UseGuards(ClerkAuthGuard)
export class IngestionController {
  private readonly logger = new Logger(IngestionController.name);
  
  // Track last triggered time per user (in-memory)
  private lastTriggerTime = new Map<string, number>();

  constructor(
    @InjectQueue('ingestion-queue') private readonly ingestionQueue: Queue,
  ) {}

  @Post('trigger-all')
  async triggerAllScrapers(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User ID not found');

    const now = Date.now();
    const lastSync = this.lastTriggerTime.get(userId) || 0;
    const cooldownMs = 30 * 60 * 1000; // 30 minutes

    if (now - lastSync < cooldownMs) {
      const remainingMinutes = Math.ceil((cooldownMs - (now - lastSync)) / 60000);
      throw new HttpException(`Rate limit exceeded. Please wait ${remainingMinutes} minutes before syncing again.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    this.logger.log(`Manual full sync requested by user: ${userId}`);
    
    // List of all active ingestion jobs
    const sources = [
      'scrape-remotive', 'scrape-wwr', 'scrape-remoteok', 
      'scrape-upwork', 'scrape-freelancer', 'scrape-workingnomads', 
      'scrape-himalayas', 'scrape-jobicy', 'scrape-arbeitnow', 
      'scrape-remoteco', 'scrape-dribbble', 'scrape-relocateme', 
      'scrape-ats-greenhouse', 'scrape-ats-lever', 'scrape-ats-smartrecruiters',
      'scrape-ats-workable', 'scrape-ats-breezy', 'scrape-ats-ashby',
      'scrape-dorks', 'scrape-jobcity', 'scrape-hackernews', 'scrape-braintrust'
    ];

    // Dispatch all jobs to the queue
    for (const source of sources) {
      await this.ingestionQueue.add(source, { manual: true });
    }

    // Update rate limit tracker
    this.lastTriggerTime.set(userId, now);

    return {
      success: true,
      message: `Successfully enqueued all ${sources.length} scraping platforms. This may take a while to complete in the background.`,
    };
  }

  @Post('trigger/:jobName')
  async triggerJob(@Param('jobName') jobName: string) {
    this.logger.log(`Manual trigger requested for job: ${jobName}`);
    
    // Add the job to the queue for immediate execution
    const job = await this.ingestionQueue.add(jobName, { manual: true });
    
    return {
      success: true,
      message: `Successfully enqueued job: ${jobName}`,
      jobId: job.id,
    };
  }
}
