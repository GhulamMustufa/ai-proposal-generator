import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { applications } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ProposalsService } from './proposals.service';

@Processor('proposals')
export class ProposalsProcessor extends WorkerHost {
  private readonly logger = new Logger(ProposalsProcessor.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: any,
    private readonly proposalsService: ProposalsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);

    if (job.name === 'generate') {
      const {
        userId,
        jobId,
        jobTitle,
        jobDescription,
        company,
        generationType,
        clientReferenceId,
      } = job.data;

      try {
        this.logger.log(
          `Starting AI generation (${generationType}) for user ${userId}, job ${jobId}`,
        );

        // Call the OpenAI service to generate a proposal or cold email
        const generatedText = await this.proposalsService.generateBackground(
          userId,
          jobDescription,
          generationType || 'proposal',
        );

        // Update database with generated proposal
        await this.db.insert(applications).values({
          userId,
          jobId,
          jobTitle,
          jobDescription,
          generatedProposal: generatedText,
          status: 'generated',
        });

        this.logger.log(`Successfully generated proposal for job ${jobId}`);

        // Emit real-time status event
        this.proposalsService.jobStatusEvents.next({
          userId,
          jobId,
          clientReferenceId,
          status: 'generated',
          generatedText,
        });

        return { success: true, generatedText };
      } catch (error) {
        this.logger.error(
          `Error generating proposal for job ${jobId}: ${error}`,
        );

        this.proposalsService.jobStatusEvents.next({
          userId,
          jobId: job.data?.jobId,
          clientReferenceId: job.data?.clientReferenceId,
          status: 'error',
        });

        throw error;
      }
    }

    return {};
  }
}
