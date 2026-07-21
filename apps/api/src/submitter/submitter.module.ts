import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SubmitterService } from './submitter.service';
import { SubmitterProcessor } from './submitter.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'submitter-queue',
    }),
  ],
  providers: [SubmitterService, SubmitterProcessor],
  exports: [BullModule], // Export so other modules can inject 'submitter-queue' to add jobs
})
export class SubmitterModule {}
