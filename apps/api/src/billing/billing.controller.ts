import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('api/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('checkout')
  @UseGuards(ClerkAuthGuard)
  async getCheckoutUrl(@Req() req: any) {
    const userId = req.user.id;
    try {
      const url = await this.billingService.getCheckoutUrl(userId);
      return { url };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error generating checkout',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Webhooks are public and hit by Lemon Squeezy, so no Auth Guard.
  @Post('webhook')
  @SkipThrottle()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    // Lemon Squeezy sends a signature in the X-Signature header
    const signature = req.headers['x-signature'] as string;

    if (!signature) {
      throw new UnauthorizedException('No signature provided');
    }

    // We need the raw body to verify the signature.
    // NestJS by default parses JSON, so req.body is an object.
    // For proper webhook verification, we need access to the raw string.
    // NestJS can be configured to keep rawBody on req, assuming standard setup.
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const isValid = this.billingService.verifySignature(rawBody, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    const eventName = req.body.meta?.event_name;

    // Process asynchronously so we can quickly return a 200 OK to Lemon Squeezy
    this.billingService.handleWebhook(eventName, req.body).catch((err) => {
      console.error('Error handling webhook in background:', err);
    });

    return res.status(200).send('OK');
  }
}
