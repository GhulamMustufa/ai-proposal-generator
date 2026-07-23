import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DB_CONNECTION } from '../db/db.module';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  lemonSqueezySetup,
  createCheckout,
} from '@lemonsqueezy/lemonsqueezy.js';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private configService: ConfigService,
    @Inject(DB_CONNECTION) private readonly db: any,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('LEMON_SQUEEZY_API_KEY');
    if (apiKey) {
      lemonSqueezySetup({ apiKey });
      this.logger.log('Lemon Squeezy SDK initialized');
    } else {
      this.logger.warn(
        'LEMON_SQUEEZY_API_KEY not found. Billing features will not work.',
      );
    }
  }

  async getCheckoutUrl(userId: string): Promise<string> {
    const storeId = this.configService.get<string>('LEMON_SQUEEZY_STORE_ID');
    const variantId = this.configService.get<string>(
      'LEMON_SQUEEZY_VARIANT_ID',
    );

    if (!storeId || !variantId) {
      throw new Error(
        'Lemon Squeezy Store ID or Variant ID is missing in environment.',
      );
    }

    // We pass the userId as custom_data so we can identify the user in the webhook
    const { error, data } = await createCheckout(storeId, variantId, {
      checkoutData: {
        custom: {
          userId,
        },
      },
    });

    if (error) {
      this.logger.error('Failed to create checkout:', error);
      throw new Error('Could not create checkout URL');
    }

    return data?.data?.attributes?.url || '';
  }

  verifySignature(rawBody: string, signature: string): boolean {
    const secret = this.configService.get<string>(
      'LEMON_SQUEEZY_WEBHOOK_SECRET',
    );
    if (!secret) return false;

    // The @lemonsqueezy/lemonsqueezy.js doesn't actually have a synchronous verifyWebhookSignature that works directly with raw strings in all versions,
    // but typically you use crypto.createHmac. Let's do it manually just in case.
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    try {
      return crypto.timingSafeEqual(digest, signatureBuffer);
    } catch {
      return false;
    }
  }

  async handleWebhook(eventName: string, payload: any) {
    this.logger.log(`Received Lemon Squeezy webhook event: ${eventName}`);

    const customData = payload.meta?.custom_data;
    const userId = customData?.userId || customData?.user_id; // accommodate naming

    if (!userId) {
      this.logger.warn(`No userId found in custom_data for event ${eventName}`);
      return;
    }

    const customerId = payload.data?.attributes?.customer_id?.toString();
    const subscriptionId = payload.data?.id?.toString();

    if (
      eventName === 'subscription_created' ||
      eventName === 'subscription_updated'
    ) {
      const status = payload.data?.attributes?.status;
      // In Lemon Squeezy, 'active' or 'on_trial' means they have access
      if (status === 'active' || status === 'on_trial') {
        await this.db
          .update(users)
          .set({
            subscriptionStatus: 'pro',
            lemonsqueezyCustomerId: customerId,
            lemonsqueezySubscriptionId: subscriptionId,
          })
          .where(eq(users.id, userId));
        this.logger.log(`Upgraded user ${userId} to pro`);
      } else {
        await this.db
          .update(users)
          .set({ subscriptionStatus: 'free' })
          .where(eq(users.id, userId));
        this.logger.log(
          `Downgraded user ${userId} to free due to status ${status}`,
        );
      }
    } else if (
      eventName === 'subscription_cancelled' ||
      eventName === 'subscription_expired'
    ) {
      await this.db
        .update(users)
        .set({ subscriptionStatus: 'free' })
        .where(eq(users.id, userId));
      this.logger.log(`Downgraded user ${userId} to free (cancelled/expired)`);
    }
  }
}
