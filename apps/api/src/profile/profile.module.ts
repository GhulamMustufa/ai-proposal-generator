import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
