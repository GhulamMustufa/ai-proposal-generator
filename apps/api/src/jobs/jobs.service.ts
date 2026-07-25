import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { aiMatches, jobs } from '../db/schema';
import { eq, desc, gte, and, sql, inArray } from 'drizzle-orm';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  /**
   * Fetches the matched jobs for a given user from the database.
   * Joins ai_matches with jobs and sorts by match_score descending.
   */
  async fetchMatchedJobs(userId: string, personaId?: string, statuses?: string[]) {
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
            statuses && statuses.length > 0 ? inArray(aiMatches.status, statuses) : undefined,
            personaId ? eq(aiMatches.personaId, personaId) : undefined
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

  async updateMatchStatus(userId: string, jobId: string, status: string, personaId?: string) {
    if (!userId || !jobId || !status) {
      throw new HttpException('User ID, Job ID, and Status are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const conditions = [
        eq(aiMatches.userId, userId),
        eq(aiMatches.jobId, jobId),
      ];
      
      if (personaId) {
        conditions.push(eq(aiMatches.personaId, personaId));
      }

      await this.db
        .update(aiMatches)
        .set({ status })
        .where(and(...conditions));

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update match status: ${message}`);
      throw new HttpException(
        { error: `Failed to update match status: ${message}` },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async rejectMatch(userId: string, jobId: string, personaId?: string) {
    if (!userId || !jobId) {
      throw new HttpException('User ID and Job ID are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const conditions = [
        eq(aiMatches.userId, userId),
        eq(aiMatches.jobId, jobId),
      ];
      
      if (personaId) {
        conditions.push(eq(aiMatches.personaId, personaId));
      }

      await this.db
        .update(aiMatches)
        .set({ status: 'rejected' })
        .where(and(...conditions));

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to reject match: ${message}`);
      throw new HttpException(
        { error: `Failed to reject match: ${message}` },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
