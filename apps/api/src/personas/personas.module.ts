import { Module } from '@nestjs/common';
import { PersonasController } from './personas.controller';
import { PersonasService } from './personas.service';
import { DbModule } from '../db/db.module';

import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    DbModule,
    BullModule.registerQueue({
      name: 'matcher-queue',
    }),
  ],
  controllers: [PersonasController],
  providers: [PersonasService],
})
export class PersonasModule {}
