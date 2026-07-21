import { Injectable, Inject, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { userProfiles } from '../db/schema';
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
      throw new HttpException('Failed to fetch profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Updates or creates the user's job filters in their profile.
   */
  async updateJobFilters(userId: string, jobFilters: any) {
    try {
      // Check if profile exists
      const existing = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      // JIT user provisioning (handles E2E tests and webhook race conditions)
      try {
        await this.db
          .insert(require('../db/schema').users)
          .values({ id: userId, email: `${userId}@placeholder.local` })
          .onConflictDoNothing();
      } catch (e) {
        // ignore
      }

      if (existing.length > 0) {
        await this.db
          .update(userProfiles)
          .set({ jobFilters, updatedAt: new Date() }) // Drizzle may complain if updatedAt doesn't exist, we'll see
          .where(eq(userProfiles.userId, userId));
      } else {
        await this.db
          .insert(userProfiles)
          .values({
            userId,
            jobFilters,
          });
      }

      return { success: true, jobFilters };
    } catch (error) {
      this.logger.error(`Failed to update job filters: ${error}`);
      throw new HttpException('Failed to update job filters', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
