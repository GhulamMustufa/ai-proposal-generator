import { Module } from '@nestjs/common';
import { PersonasController } from './personas.controller';
import { PersonasService } from './personas.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [PersonasController],
  providers: [PersonasService],
})
export class PersonasModule {}
