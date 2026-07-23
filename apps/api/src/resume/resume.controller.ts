import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { ResumeService } from './resume.service';

@Controller('api/resume')
@UseGuards(ClerkAuthGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  /**
   * POST /api/resume/generate
   * Generates a tailored PDF resume using OpenAI and Puppeteer,
   * stores it in Cloudinary, and returns the URL.
   */
  @Post('generate')
  async generateResume(@Body() body: { jobId?: string }, @Req() req: any) {
    const userId = req.user?.id;
    const jobId = body.jobId;

    if (!jobId) {
      throw new BadRequestException('jobId is required');
    }

    const pdfUrl = await this.resumeService.generateResume(userId, jobId);

    return { pdfUrl };
  }
}
