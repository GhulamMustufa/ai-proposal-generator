import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SubmitterService } from './submitter.service';

/**
 * SubmitterProcessor
 * 
 * BullMQ Worker for the 'submitter-queue'.
 * Handles the automation of job submissions using Playwright.
 */
@Processor('submitter-queue')
export class SubmitterProcessor extends WorkerHost {
  private readonly logger = new Logger(SubmitterProcessor.name);

  constructor(private readonly submitterService: SubmitterService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(\`Processing job \${job.id} of type \${job.name}\`);
    
    if (job.name === 'submit-lever') {
      const { applicationId, userId, jobId } = job.data;
      if (!applicationId || !userId || !jobId) {
        throw new Error('Missing required job data properties (applicationId, userId, jobId)');
      }

      // Delegate the actual headless browser automation to the service
      await this.submitterService.submitApplication(applicationId, userId, jobId);
      return { success: true };
    }
    
    this.logger.warn(\`Unknown job name: \${job.name}\`);
  }
}
