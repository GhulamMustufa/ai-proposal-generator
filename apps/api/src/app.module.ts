import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { JobsModule } from './jobs/jobs.module';
import { ProposalsModule } from './proposals/proposals.module';
import { RedisModule } from './redis/redis.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { MatcherModule } from './matcher/matcher.module';
import { ResumeModule } from './resume/resume.module';
import { SubmitterModule } from './submitter/submitter.module';
import { ProfileModule } from './profile/profile.module';
/**
 * Root AppModule
 * 
 * NestJS uses Modules to organize the application structure. Every application has at least one module, 
 * the root module (this file). We use it to configure global providers and external integrations.
 */
@Module({
  imports: [
    // ConfigModule loads environment variables from .env files or the system environment.
    // By setting `isGlobal: true`, we make the `ConfigService` available in every other module 
    // without needing to explicitly import ConfigModule everywhere.
    ConfigModule.forRoot({
      isGlobal: true, 
    }),

    // BullModule configures our Redis connection for BullMQ.
    // We use `forRootAsync` so we can inject the ConfigService and dynamically read the REDIS_URL.
    BullModule.forRootAsync({
      imports: [ConfigModule], // Provide access to the ConfigService
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL'),
        },
      }),
      inject: [ConfigService], // Tell Nest to pass ConfigService into the useFactory function (Dependency Injection)
    }),

    // Global Database Module for Drizzle ORM
    DbModule,

    JobsModule,

    ProposalsModule,

    RedisModule,

    IngestionModule,

    MatcherModule,

    ResumeModule,

    SubmitterModule,

    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
