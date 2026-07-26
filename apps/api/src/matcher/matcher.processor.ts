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
      case 'sync-persona':
        this.logger.log(
          `Received sync request for persona ${job.data.personaId}. Fetching new jobs...`,
        );
        await this.matcherService.syncPersonaJobs(job.data.personaId);
        break;
      case 'match-persona':
        this.logger.log(
          `Received persona ${job.data.personaId} for full re-evaluation.`,
        );
        await this.matcherService.syncPersonaJobs(job.data.personaId, true);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
