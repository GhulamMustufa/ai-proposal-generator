import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatcherService } from './matcher.service';
import { MatcherProcessor } from './matcher.processor';
import { MatcherController } from './matcher.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'matcher-queue',
    }),
  ],
  providers: [MatcherService, MatcherProcessor],
  exports: [BullModule],
  controllers: [MatcherController], // Export so others can inject the matcher-queue
})
export class MatcherModule {}
