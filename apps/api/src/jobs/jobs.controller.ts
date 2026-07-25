import { Controller, Get, UseGuards, Req, Query, Patch, Param, Body } from '@nestjs/common';
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
  async getJobs(
    @Req() req: any, 
    @Query('personaId') personaId?: string,
    @Query('statuses') statuses?: string
  ) {
    const userId = req.user.id;
    const statusArray = statuses ? statuses.split(',') : undefined;
    return this.jobsService.fetchMatchedJobs(userId, personaId, statusArray);
  }

  @Patch(':id/status')
  @UseGuards(ClerkAuthGuard)
  async updateJobStatus(
    @Req() req: any,
    @Param('id') jobId: string,
    @Body('status') status: string,
    @Body('personaId') personaId?: string,
  ) {
    const userId = req.user.id;
    return this.jobsService.updateMatchStatus(userId, jobId, status, personaId);
  }

  @Patch(':id/reject')
  @UseGuards(ClerkAuthGuard)
  async rejectJob(
    @Req() req: any,
    @Param('id') jobId: string,
    @Body('personaId') personaId?: string,
  ) {
    const userId = req.user.id;
    return this.jobsService.rejectMatch(userId, jobId, personaId);
  }
}
