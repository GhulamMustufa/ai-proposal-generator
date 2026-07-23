import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  Res,
  Sse,
  Param,
  MessageEvent,
  HttpException,
  HttpStatus,
  Inject,
  Get,
  Put,
  Patch,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProposalsService } from './proposals.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DB_CONNECTION } from '../db/db.module';
import { users, applications } from '../db/schema';
import { eq, sql, desc } from 'drizzle-orm';

/**
 * ProposalsController
 * Handles incoming POST requests to generate AI proposals and SSE status updates.
 */
@Controller('api/proposals')
export class ProposalsController {
  constructor(
    private readonly proposalsService: ProposalsService,
    @InjectQueue('proposals') private readonly proposalsQueue: Queue,
    @Inject(DB_CONNECTION) private readonly db: any,
  ) {}

  @Get('history')
  @UseGuards(ClerkAuthGuard)
  async getHistory(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) return [];

    return await this.db.query.applications.findMany({
      where: eq(applications.userId, userId),
      orderBy: [desc(applications.createdAt)],
    });
  }

  @Post('generate')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(200)
  async generateProposal(
    @Req() req: any,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const userId = req.user.id;

    // Extract IP for rate limiting
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

    // Hand over control of the response stream to the service
    await this.proposalsService.generate(
      userId,
      ipAddress,
      idempotencyKey,
      body,
      res,
    );
  }

  @Post('enqueue')
  @UseGuards(ClerkAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // Limit: 5 requests per hour (3,600,000ms) to protect OpenAI credits
  async enqueueProposal(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;
    const { jobId, jobTitle, jobDescription, company, generationType } = body;

    // Check Freemium Paywall
    const userRecord = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (userRecord?.subscriptionStatus === 'free') {
      if ((userRecord?.generationsCount || 0) >= 3) {
        throw new HttpException('PAYWALL_LIMIT_REACHED', HttpStatus.FORBIDDEN);
      }

      // Increment free usage count
      await this.db
        .update(users)
        .set({ generationsCount: sql`${users.generationsCount} + 1` })
        .where(eq(users.id, userId));
    }

    // Place job in the queue
    const job = await this.proposalsQueue.add('generate', {
      userId,
      jobId,
      jobTitle,
      jobDescription,
      company,
      generationType: generationType || 'proposal',
    });

    return { success: true, queueJobId: job.id };
  }

  @Sse('status/:userId')
  statusEvents(@Param('userId') userId: string): Observable<MessageEvent> {
    // Returns an observable that streams events for this specific user
    return this.proposalsService.jobStatusEvents.asObservable().pipe(
      filter((event) => event.userId === userId),
      map((event) => ({
        data: event,
      })),
    );
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  async updateProposal(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = req.user.id;
    const { text } = body;

    if (!text) {
      return { success: false, error: 'Text is required' };
    }

    const updated = await this.proposalsService.updateProposal(
      userId,
      id,
      text,
    );
    return { success: true, data: updated };
  }

  @Get(':id/pdf')
  @UseGuards(ClerkAuthGuard)
  async generatePdf(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    await this.proposalsService.generatePdf(userId, id, res);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  async getProposal(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const proposal = await this.proposalsService.getProposal(userId, id);
    if (!proposal) {
      return { success: false, error: 'Not found' };
    }
    return { success: true, data: proposal };
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard)
  async updateProposalStatus(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const userId = req.user.id;
    const { status } = body;
    
    if (!status) {
      return { success: false, error: 'Status is required' };
    }
    
    const updated = await this.proposalsService.updateProposalStatus(userId, id, status);
    return { success: true, data: updated };
  }
}
