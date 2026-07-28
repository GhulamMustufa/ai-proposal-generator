import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { userProfiles, users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  /**
   * Fetches the user profile by user ID.
   */
  async getProfile(userId: string) {
    try {
      const profile = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      return profile[0] || {};
    } catch (error) {
      this.logger.error(`Failed to fetch profile: ${error}`);
      throw new HttpException(
        'Failed to fetch profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetches the user's subscription plan and usage.
   */
  async getPlan(userId: string) {
    try {
      // JIT user provisioning
      try {
        await this.db
          .insert(users)
          .values({ id: userId, email: `${userId}@placeholder.local` })
          .onConflictDoNothing();
      } catch (e) {}

      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length > 0) {
        return {
          subscriptionStatus: user[0].subscriptionStatus,
          generationsCount: user[0].generationsCount,
          monthlyLimit: user[0].subscriptionStatus === 'pro' ? 'unlimited' : 5,
        };
      }
      return { subscriptionStatus: 'free', generationsCount: 0, monthlyLimit: 5 };
    } catch (error) {
      this.logger.error(`Failed to fetch plan: ${error}`);
      throw new HttpException(
        'Failed to fetch plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Updates or creates the user's API keys in their profile.
   */
  async updateApiKeys(userId: string, apiKeys: any) {
    try {
      const existing = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      try {
        await this.db
          .insert(require('../db/schema').users)
          .values({ id: userId, email: `${userId}@placeholder.local` })
          .onConflictDoNothing();
      } catch (e) {}

      if (existing.length > 0) {
        await this.db
          .update(userProfiles)
          .set({ apiKeys, updatedAt: new Date() })
          .where(eq(userProfiles.userId, userId));
      } else {
        await this.db.insert(userProfiles).values({
          userId,
          apiKeys,
        });
      }

      return { success: true, apiKeys };
    } catch (error) {
      this.logger.error(`Failed to update API keys: ${error}`);
      throw new HttpException(
        'Failed to update API keys',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Updates the user's default persona.
   */
  async updateDefaultPersona(userId: string, defaultPersonaId: string) {
    try {
      const existing = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      try {
        await this.db
          .insert(require('../db/schema').users)
          .values({ id: userId, email: `${userId}@placeholder.local` })
          .onConflictDoNothing();
      } catch (e) {}

      if (existing.length > 0) {
        await this.db
          .update(userProfiles)
          .set({ defaultPersonaId, updatedAt: new Date() })
          .where(eq(userProfiles.userId, userId));
      } else {
        await this.db.insert(userProfiles).values({
          userId,
          defaultPersonaId,
        });
      }

      return { success: true, defaultPersonaId };
    } catch (error) {
      this.logger.error(`Failed to update default persona: ${error}`);
      throw new HttpException(
        'Failed to update default persona',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
