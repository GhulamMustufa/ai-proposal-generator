import { Injectable, Inject, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { users, jobs, personas, aiMatches } from '../db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: any,
    @InjectQueue('ingestion-queue') private readonly ingestionQueue: Queue,
    @InjectQueue('matcher-queue') private readonly matcherQueue: Queue,
  ) {}

  async getStats() {
    const [totalUsers, totalJobs, totalPersonas, totalMatches] = await Promise.all([
      this.db.select({ count: count() }).from(users),
      this.db.select({ count: count() }).from(jobs),
      this.db.select({ count: count() }).from(personas),
      this.db.select({ count: count() }).from(aiMatches),
    ]);

    return {
      totalUsers: totalUsers[0].count,
      totalJobs: totalJobs[0].count,
      totalPersonas: totalPersonas[0].count,
      totalMatches: totalMatches[0].count,
    };
  }

  async getQueuesStatus() {
    const [ingestionCounts, matcherCounts] = await Promise.all([
      this.ingestionQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
      this.matcherQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
    ]);

    return {
      ingestionQueue: ingestionCounts,
      matcherQueue: matcherCounts,
    };
  }

  async getFailedJobs(queueName: string) {
    let queue: Queue;
    if (queueName === 'ingestion-queue' || queueName === 'ingestionQueue') queue = this.ingestionQueue;
    else if (queueName === 'matcher-queue' || queueName === 'matcherQueue') queue = this.matcherQueue;
    else throw new Error('Invalid queue name');

    const failedJobs = await queue.getFailed();
    return failedJobs.map(j => ({
      id: j.id,
      name: j.name,
      failedReason: j.failedReason,
      data: j.data,
      stacktrace: j.stacktrace,
      timestamp: j.timestamp
    }));
  }

  async getActiveJobs(queueName: string) {
    let queue: Queue;
    if (queueName === 'ingestion-queue' || queueName === 'ingestionQueue') queue = this.ingestionQueue;
    else if (queueName === 'matcher-queue' || queueName === 'matcherQueue') queue = this.matcherQueue;
    else throw new Error('Invalid queue name');

    const activeJobs = await queue.getActive();
    return activeJobs.map(j => ({
      id: j.id,
      name: j.name,
      progress: j.progress,
      timestamp: j.timestamp,
      data: j.data
    }));
  }

  async getCompletedJobs(queueName: string) {
    let queue: Queue;
    if (queueName === 'ingestion-queue' || queueName === 'ingestionQueue') queue = this.ingestionQueue;
    else if (queueName === 'matcher-queue' || queueName === 'matcherQueue') queue = this.matcherQueue;
    else throw new Error('Invalid queue name');

    const completedJobs = await queue.getCompleted();
    return completedJobs.map(j => ({
      id: j.id,
      name: j.name,
      timestamp: j.finishedOn || j.timestamp,
      returnvalue: j.returnvalue
    })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }

  async getWaitingJobs(queueName: string) {
    let queue: Queue;
    if (queueName === 'ingestion-queue' || queueName === 'ingestionQueue') queue = this.ingestionQueue;
    else if (queueName === 'matcher-queue' || queueName === 'matcherQueue') queue = this.matcherQueue;
    else throw new Error('Invalid queue name');

    const waitingJobs = await queue.getWaiting();
    return waitingJobs.map(j => ({
      id: j.id,
      name: j.name,
      timestamp: j.timestamp,
      data: j.data
    })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }

  async getRepeatableJobs(queueName: string) {
    let queue: Queue;
    if (queueName === 'ingestion-queue' || queueName === 'ingestionQueue') queue = this.ingestionQueue;
    else if (queueName === 'matcher-queue' || queueName === 'matcherQueue') queue = this.matcherQueue;
    else throw new Error('Invalid queue name');

    const repeatableJobs = await queue.getRepeatableJobs();
    return repeatableJobs;
  }

  async triggerAllScrapers() {
    const sources = [
      'scrape-remotive', 'scrape-wwr', 'scrape-remoteok', 'scrape-upwork', 'scrape-freelancer',
      'scrape-workingnomads', 'scrape-himalayas', 'scrape-jobicy', 'scrape-arbeitnow', 'scrape-remoteco',
      'scrape-dribbble', 'scrape-relocateme', 'scrape-ats-greenhouse', 'scrape-ats-lever', 'scrape-ats-smartrecruiters',
      'scrape-ats-workable', 'scrape-ats-breezy', 'scrape-ats-ashby', 'scrape-dorks', 'scrape-jobcity',
      'scrape-hackernews', 'scrape-braintrust', 'scrape-pythonorg', 'scrape-vuejobs', 'scrape-larajobs',
      'scrape-devto', 'scrape-remotepython'
    ];

    for (const source of sources) {
      await this.ingestionQueue.add(source, { manual: true }, {
        jobId: `manual-${source}`
      });
    }
    return { success: true, message: `Triggered ${sources.length} scrapers` };
  }

  async triggerScraper(scraperName: string) {
    await this.ingestionQueue.add(scraperName, { manual: true }, {
      jobId: `manual-${scraperName}`
    });
    return { success: true, message: `Triggered scraper: ${scraperName}` };
  }

  async clearQueues() {
    await this.ingestionQueue.pause();
    await this.ingestionQueue.obliterate({ force: true });
    await this.ingestionQueue.resume();
    
    await this.matcherQueue.pause();
    await this.matcherQueue.obliterate({ force: true });
    await this.matcherQueue.resume();

    return { success: true, message: 'All queues cleared successfully' };
  }

  async getUsers() {
    return this.db.select().from(users).orderBy(desc(users.createdAt)).limit(100);
  }

  async updateUserSubscription(userId: string, subscriptionStatus: string) {
    await this.db.update(users).set({ subscriptionStatus }).where(eq(users.id, userId));
    return { success: true };
  }

  async getRecentJobs(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;

    const [totalCountResult] = await this.db.select({ count: count() }).from(jobs);
    const totalCount = totalCountResult.count;

    const data = await this.db.select().from(jobs).orderBy(desc(jobs.scrapedAt)).limit(limit).offset(offset);

    return {
      data,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  }

  async getRecentMatches() {
    return this.db.select().from(aiMatches).orderBy(desc(aiMatches.createdAt)).limit(100);
  }
}
