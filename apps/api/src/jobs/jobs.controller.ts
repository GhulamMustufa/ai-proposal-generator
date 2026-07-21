import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

/**
 * JobsController
 * Handles incoming HTTP requests for job fetching.
 * Route: /api/jobs
 */
@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @UseGuards(ClerkAuthGuard) // Protects the endpoint requiring a valid Clerk JWT
  async getJobs(@Req() req: any) {
    const userId = req.user.id;
    return this.jobsService.fetchMatchedJobs(userId);
  }
}
