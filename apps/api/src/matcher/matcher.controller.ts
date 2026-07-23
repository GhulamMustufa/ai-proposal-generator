import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Inject,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { DB_CONNECTION } from '../db/db.module';
import { aiMatches, jobs } from '../db/schema';
import { eq, desc, gte, and } from 'drizzle-orm';

@Controller('api/matches')
@UseGuards(ClerkAuthGuard)
export class MatcherController {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: any,
    @InjectQueue('matcher-queue') private readonly matcherQueue: Queue,
  ) {}

  @Post('re-evaluate')
  async triggerReEvaluation(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User ID not found');

    await this.matcherQueue.add('match-user', { userId });
    return {
      success: true,
      message: 'Re-evaluation enqueued. Matches will update in the background.',
    };
  }

  /**
   * Retrieves the AI match scores and job details for a specific user,
   * sorted by the highest match score first.
   */
  @Get(':userId')
  async getUserMatches(@Param('userId') userId: string, @Req() req: any) {
    // Security check: ensure the requesting user is fetching their own matches
    if (req.user?.id !== userId) {
      throw new UnauthorizedException(
        'You can only view your own job matches.',
      );
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
      .where(
        and(
          eq(aiMatches.userId, userId),
          gte(aiMatches.createdAt, thirtyDaysAgo),
        ),
      )
      .orderBy(desc(aiMatches.matchScore), desc(aiMatches.createdAt))
      .limit(100); // Return top 100 recent matches

    return matches;
  }
}
