import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { BillingModule } from './billing/billing.module';
import { PersonasModule } from './personas/personas.module';
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

    // Global Rate Limiting: Max 100 requests per minute (60000ms) by default
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

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

    BillingModule,
    PersonasModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Applies rate limiting globally across all routes
    },
  ],
})
export class AppModule {}
