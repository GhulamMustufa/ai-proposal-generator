import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';
import { ProposalsProcessor } from './proposals.processor';
import { DbModule } from '../db/db.module';

@Module({
  imports: [
    DbModule,
    BullModule.registerQueue({
      name: 'proposals',
    }),
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalsProcessor],
})
export class ProposalsModule {}
