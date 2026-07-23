import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * RedisService
 *
 * This service encapsulates our ioredis connection and provides methods for caching,
 * idempotency, and rate limiting. Using a central service makes it easily injectable.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      throw new Error('REDIS_URL is not defined in environment variables.');
    }
    this.redis = new Redis(url);
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  /**
   * Simple rate limiter using Redis INCR and EXPIRE.
   * @param key The unique key (e.g. rate_limit:generate-proposal:user_123)
   * @param limit The maximum number of allowed requests
   * @param windowSeconds The time window in seconds
   * @returns true if allowed, false if the rate limit is exceeded
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    return current <= limit;
  }
}
