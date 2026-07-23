import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { aiMatches, jobs } from '../db/schema';
import { eq, desc, gte, and, sql } from 'drizzle-orm';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  /**
   * Fetches the matched jobs for a given user from the database.
   * Joins ai_matches with jobs and sorts by match_score descending.
   */
  async fetchMatchedJobs(userId: string) {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const results = await this.db
        .select({
          id: jobs.id,
          title: jobs.title,
          company: jobs.company,
          description: jobs.description,
          url: jobs.url,
          platform: jobs.platform,
          matchScore: aiMatches.matchScore,
          matchReasoning: aiMatches.matchReasoning,
          scrapedAt: jobs.scrapedAt,
          createdAt: aiMatches.createdAt,
          hasApplication: sql<boolean>`EXISTS (SELECT 1 FROM applications WHERE applications.job_id = ${jobs.id} AND applications.user_id = ${userId})`.mapWith(Boolean),
        })
        .from(aiMatches)
        .innerJoin(jobs, eq(aiMatches.jobId, jobs.id))
        .where(
          and(
            eq(aiMatches.userId, userId),
            gte(aiMatches.createdAt, thirtyDaysAgo),
          ),
        )
        .orderBy(desc(aiMatches.matchScore), desc(aiMatches.createdAt));

      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch matched jobs: ${message}`);
      throw new HttpException(
        { error: `Failed to fetch matched jobs: ${message}` },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
