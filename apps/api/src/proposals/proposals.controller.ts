import { Controller, Post, Body, UseGuards, Req, HttpCode, Res, Sse, Param, MessageEvent } from '@nestjs/common';
import { Response } from 'express';
import { ProposalsService } from './proposals.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

/**
 * ProposalsController
 * Handles incoming POST requests to generate AI proposals and SSE status updates.
 */
@Controller('api/proposals')
export class ProposalsController {
  constructor(
    private readonly proposalsService: ProposalsService,
    @InjectQueue('proposals') private readonly proposalsQueue: Queue
  ) {}

  @Post('generate')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(200)
  async generateProposal(
    @Req() req: any,
    @Body() body: any,
    @Res() res: Response
  ) {
    const userId = req.user.id;
    
    // Extract IP for rate limiting
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
      || req.socket.remoteAddress 
      || 'unknown';
      
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

    // Hand over control of the response stream to the service
    await this.proposalsService.generate(
      userId,
      ipAddress,
      idempotencyKey,
      body,
      res
    );
  }

  @Post('enqueue')
  @UseGuards(ClerkAuthGuard)
  async enqueueProposal(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;
    const { jobId, jobTitle, jobDescription, company, generationType } = body;
    
    // Place job in the queue
    const job = await this.proposalsQueue.add('generate', {
      userId,
      jobId,
      jobTitle,
      jobDescription,
      company,
      generationType: generationType || 'proposal'
    });
    
    return { success: true, queueJobId: job.id };
  }

  @Sse('status/:userId')
  statusEvents(@Param('userId') userId: string): Observable<MessageEvent> {
    // Returns an observable that streams events for this specific user
    return this.proposalsService.jobStatusEvents.asObservable().pipe(
      filter(event => event.userId === userId),
      map(event => ({
        data: event,
      }))
    );
  }

  @Post(':id') // wait, it's PUT usually, let's use PUT
  @UseGuards(ClerkAuthGuard)
  async updateProposal(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const userId = req.user.id;
    const { text } = body;
    
    if (!text) {
      return { success: false, error: 'Text is required' };
    }
    
    const updated = await this.proposalsService.updateProposal(userId, id, text);
    return { success: true, data: updated };
  }

  @Post(':id/pdf')
  @UseGuards(ClerkAuthGuard)
  async generatePdf(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const userId = req.user.id;
    await this.proposalsService.generatePdf(userId, id, res);
  }

  @Post(':id/get')
  @UseGuards(ClerkAuthGuard)
  async getProposal(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const proposal = await this.proposalsService.getProposal(userId, id);
    if (!proposal) {
      return { success: false, error: 'Not found' };
    }
    return { success: true, data: proposal };
  }
}

