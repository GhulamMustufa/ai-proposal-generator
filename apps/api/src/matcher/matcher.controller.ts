import { Controller, Get, Param, UseGuards, Inject, UnauthorizedException, Req } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { DB_CONNECTION } from '../db/db.module';
import { aiMatches, jobs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

@Controller('api/matches')
@UseGuards(ClerkAuthGuard)
export class MatcherController {
  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  /**
   * Retrieves the AI match scores and job details for a specific user,
   * sorted by the highest match score first.
   */
  @Get(':userId')
  async getUserMatches(@Param('userId') userId: string, @Req() req: any) {
    // Security check: ensure the requesting user is fetching their own matches
    if (req.user?.id !== userId) {
      throw new UnauthorizedException('You can only view your own job matches.');
    }

    // Fetch user's matches joined with job details
    const matches = await this.db
      .select({
        matchScore: aiMatches.matchScore,
        matchReasoning: aiMatches.matchReasoning,
        jobId: jobs.id,
        title: jobs.title,
        company: jobs.company,
        description: jobs.description,
        url: jobs.url,
        platform: jobs.platform,
        createdAt: aiMatches.createdAt,
      })
      .from(aiMatches)
      .innerJoin(jobs, eq(aiMatches.jobId, jobs.id))
      .where(eq(aiMatches.userId, userId))
      .orderBy(desc(aiMatches.matchScore))
      .limit(100); // Return top 100 recent matches

    return matches;
  }
}
