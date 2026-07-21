import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * RedisModule
 * 
 * We mark this module as @Global() so that RedisService is available
 * everywhere without needing to import RedisModule in every feature module.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
