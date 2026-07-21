import { Controller, Post, Param, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('ingestion')
export class IngestionController {
  private readonly logger = new Logger(IngestionController.name);

  constructor(
    @InjectQueue('ingestion-queue') private readonly ingestionQueue: Queue,
  ) {}

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
