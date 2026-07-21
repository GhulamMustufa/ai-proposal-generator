import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { MatcherService } from './matcher.service';

@Processor('matcher-queue')
export class MatcherProcessor extends WorkerHost {
  private readonly logger = new Logger(MatcherProcessor.name);

  constructor(private readonly matcherService: MatcherService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'match-job':
        this.logger.log(`Received new job ${job.data.jobId} for matching. Evaluating...`);
        await this.matcherService.evaluateJob(job.data.jobId);
        break;
      case 'match-user':
        this.logger.log(`Received user ${job.data.userId} for full re-evaluation.`);
        await this.matcherService.reEvaluateUser(job.data.userId);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
