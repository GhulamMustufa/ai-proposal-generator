import { Injectable, Inject, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { extractJobTextFromHtml } from '../utils/job-extractor';
import { jobs, aiMatches } from '../db/schema';
import { sql, lt, inArray } from 'drizzle-orm';
import * as cheerio from 'cheerio';
import { generateEmbeddings } from '../utils/embeddings';

/**
 * IngestionService
 * Handles the logic for scraping third-party job boards and safely inserting
 * new, unique jobs into the database.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  /**
   * Scrapes Remotive API for recent remote jobs.
   * Cleans descriptions and inserts into Drizzle DB avoiding duplicates.
   * Returns an array of newly inserted job IDs.
   */
  async scrapeRemotive(): Promise<string[]> {
    this.logger.log('Starting Remotive scraping...');
    const url = new URL('https://remotive.com/api/remote-jobs');
    url.searchParams.set('limit', '50'); // Adjust limit as needed

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        throw new Error(`Remotive returned ${response.status}`);
      }

      const data = await response.json();
      const fetchedJobs = data.jobs ?? [];

      this.logger.log(`Fetched ${fetchedJobs.length} jobs from Remotive.`);

      const newJobIds: string[] = [];

      for (const job of fetchedJobs) {
        // Create a unique external ID to prevent duplicates
        const externalId = `remotive_${job.id}`;

        // Clean the HTML description to plain text
        const cleanDesc = extractJobTextFromHtml(job.description || '');

        // Insert using ON CONFLICT DO NOTHING
        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'remotive',
            externalId,
            title: job.title,
            company: job.company_name,
            description: cleanDesc.slice(0, 7000), // Enforce length limits
            url: job.url,
          })
          .onConflictDoNothing({ target: jobs.externalId })
          .returning({ id: jobs.id });

        if (inserted.length > 0) {
          newJobIds.push(inserted[0].id);
        }
      }

      this.logger.log(
        `Successfully ingested ${newJobIds.length} new unique jobs.`,
      );
      return newJobIds;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to scrape Remotive: ${msg}`);
      throw error;
    }
  }

  /**
   * Deletes jobs older than 30 days to keep the database size small and highly relevant.
   */
  async cleanupOldJobs(): Promise<void> {
    this.logger.log('Starting cleanup of jobs older than 30 days...');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.db
        .delete(jobs)
        .where(lt(jobs.scrapedAt, thirtyDaysAgo))
        .returning({ id: jobs.id });

      // Also cleanup aiMatches directly (cascade should handle this if foreign key is set up, but let's be safe)
      await this.db
        .delete(aiMatches)
        .where(lt(aiMatches.createdAt, thirtyDaysAgo));

      this.logger.log(`Deleted ${result.length} old jobs.`);
    } catch (error) {
      this.logger.error(`Failed to cleanup old jobs: ${error}`);
    }
  }

  /**
   * Generates and stores embeddings for a list of job IDs.
   * This is called after scraping to avoid embedding duplicates.
   */
  async embedJobs(jobIds: string[]): Promise<void> {
    if (jobIds.length === 0) return;
    
    try {
      this.logger.log(`Generating embeddings for ${jobIds.length} jobs...`);
      const jobsToEmbed = await this.db.select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description
      }).from(jobs).where(inArray(jobs.id, jobIds));

      if (jobsToEmbed.length === 0) return;

      const texts = jobsToEmbed.map((j: any) => `${j.title} ${j.description}`);
      const embeddings = await generateEmbeddings(texts);

      // Update jobs with embeddings
      for (let i = 0; i < jobsToEmbed.length; i++) {
        await this.db.update(jobs)
          .set({ embedding: embeddings[i] })
          .where(sql`${jobs.id} = ${jobsToEmbed[i].id}`);
      }
      this.logger.log(`Successfully embedded ${jobsToEmbed.length} jobs.`);
    } catch (error) {
      this.logger.error(`Failed to embed jobs: ${error}`);
    }
  }

  /**
   * Scrapes Hacker News "Ask HN: Who is hiring?" mega-threads.
   * Gets the most recent thread, then fetches the top 100 comments.
   */
  async scrapeHackerNews(): Promise<string[]> {
    this.logger.log('Starting Hacker News scraping...');
    const newJobIds: string[] = [];

    try {
      // 1. Get the "whoishiring" user profile to find recent submissions
      const userRes = await fetch(
        'https://hacker-news.firebaseio.com/v0/user/whoishiring.json',
      );
      if (!userRes.ok) throw new Error('Failed to fetch HN user');
      const userData = await userRes.json();

      if (!userData || !userData.submitted || userData.submitted.length === 0) {
        return [];
      }

      // 2. Find the most recent "Who is hiring?" thread (check the first 3 submissions)
      let threadId = null;
      for (let i = 0; i < 3; i++) {
        const itemId = userData.submitted[i];
        const itemRes = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${itemId}.json`,
        );
        const itemData = await itemRes.json();
        if (
          itemData &&
          itemData.title &&
          itemData.title.includes('Ask HN: Who is hiring?')
        ) {
          threadId = itemId;
          break;
        }
      }

      if (!threadId) {
        this.logger.log('No recent "Who is hiring?" thread found.');
        return [];
      }

      // 3. Fetch the thread details to get comments (kids)
      const threadRes = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${threadId}.json`,
      );
      const threadData = await threadRes.json();
      const kids = threadData.kids || [];

      this.logger.log(
        `Found HN thread ${threadId} with ${kids.length} comments.`,
      );

      // 4. Fetch the top 100 comments
      const maxComments = Math.min(kids.length, 100);
      for (let i = 0; i < maxComments; i++) {
        const commentId = kids[i];
        const commentRes = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${commentId}.json`,
        );
        const commentData = await commentRes.json();

        if (
          !commentData ||
          commentData.deleted ||
          commentData.dead ||
          !commentData.text
        ) {
          continue;
        }

        const cleanDesc = extractJobTextFromHtml(commentData.text);
        if (cleanDesc.length < 50) continue; // Skip very short comments

        const externalId = `hn_${commentId}`;
        const title =
          cleanDesc.split('\n')[0].substring(0, 100).trim() ||
          'Hacker News Job';

        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'hackernews',
            externalId,
            title,
            company: 'YC/Startup (Hacker News)',
            description: cleanDesc.slice(0, 7000),
            url: `https://news.ycombinator.com/item?id=${commentId}`,
          })
          .onConflictDoNothing({ target: jobs.externalId })
          .returning({ id: jobs.id });

        if (inserted.length > 0) {
          newJobIds.push(inserted[0].id);
        }
      }

      this.logger.log(
        `Successfully ingested ${newJobIds.length} new unique jobs from Hacker News.`,
      );
      return newJobIds;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to scrape Hacker News: ${msg}`);
      throw error;
    }
  }

  /**
   * Scrapes We Work Remotely (WWR) RSS feed.
   */
  async scrapeWWR(): Promise<string[]> {
    this.logger.log('Starting WWR scraping...');
    const url = 'https://weworkremotely.com/remote-jobs.rss';

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`WWR returned ${response.status}`);

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const newJobIds: string[] = [];

      const items = $('item').toArray();
      this.logger.log(`Fetched ${items.length} jobs from WWR RSS.`);

      for (const el of items) {
        const guid = $(el).find('guid').text();
        const link = $(el).find('link').text();
        const rawTitle = $(el).find('title').text();
        const rawDesc = $(el).find('description').text();

        // WWR title format is usually "Company: Job Title"
        let company = 'Unknown';
        let title = rawTitle;
        if (rawTitle.includes(':')) {
          const parts = rawTitle.split(':');
          company = parts[0].trim();
          title = parts.slice(1).join(':').trim();
        }

        const externalId = `wwr_${guid || link}`;
        const cleanDesc = extractJobTextFromHtml(rawDesc || '');

        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'wwr',
            externalId,
            title,
            company,
            description: cleanDesc.slice(0, 7000),
            url: link,
          })
          .onConflictDoNothing({ target: jobs.externalId })
          .returning({ id: jobs.id });

        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }

      this.logger.log(
        `Successfully ingested ${newJobIds.length} new unique jobs from WWR.`,
      );
      return newJobIds;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to scrape WWR: ${msg}`);
      throw error;
    }
  }

  /**
   * Scrapes Remote OK JSON API.
   */
  async scrapeRemoteOk(): Promise<string[]> {
    this.logger.log('Starting Remote OK scraping...');
    const url = 'https://remoteok.com/api';

    try {
      // Remote OK requires a User-Agent, otherwise it blocks requests
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok)
        throw new Error(`Remote OK returned ${response.status}`);

      const data = await response.json();

      // Remote OK returns an array where the first item is usually legal/stat metadata
      const fetchedJobs = Array.isArray(data)
        ? data.filter((j) => j.id && j.company)
        : [];
      this.logger.log(`Fetched ${fetchedJobs.length} jobs from Remote OK.`);

      const newJobIds: string[] = [];

      for (const job of fetchedJobs) {
        const externalId = `remoteok_${job.id}`;
        const cleanDesc = extractJobTextFromHtml(job.description || '');

        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'remoteok',
            externalId,
            title: job.position || job.title || 'Untitled',
            company: job.company,
            description: cleanDesc.slice(0, 7000),
            url: job.url,
          })
          .onConflictDoNothing({ target: jobs.externalId })
          .returning({ id: jobs.id });

        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }

      this.logger.log(
        `Successfully ingested ${newJobIds.length} new unique jobs from Remote OK.`,
      );
      return newJobIds;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to scrape Remote OK: ${msg}`);
      throw error;
    }
  }

  /**
   * Scrapes Upwork RSS Feed for a specific search query.
   */
  async scrapeUpworkRss(feedUrl: string): Promise<string[]> {
    this.logger.warn(`Upwork scraping is deprecated (RSS feed 410 Gone). Skipping.`);
    return [];
  }

  /**
   * Scrapes Freelancer.com via their public REST API.
   */
  async scrapeFreelancerCom(): Promise<string[]> {
    this.logger.log('Starting Freelancer.com scraping...');
    // Fetch active generic projects
    const url =
      'https://www.freelancer.com/api/projects/0.1/projects/active?compact=true&languages[]=en&limit=50';

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok)
        throw new Error(`Freelancer returned ${response.status}`);

      const data = await response.json();
      const fetchedJobs = data?.result?.projects ?? [];

      this.logger.log(
        `Fetched ${fetchedJobs.length} jobs from Freelancer.com.`,
      );

      const newJobIds: string[] = [];

      for (const job of fetchedJobs) {
        const externalId = `freelancer_${job.id}`;
        // Construct the public URL from the seo_url
        const jobUrl = `https://www.freelancer.com/projects/${job.seo_url}`;
        const cleanDesc = extractJobTextFromHtml(job.description || '');

        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'freelancer',
            externalId,
            title: job.title,
            company: 'Freelancer Client', // Client data requires a separate API call usually
            description: cleanDesc.slice(0, 7000),
            url: jobUrl,
          })
          .onConflictDoNothing({ target: jobs.externalId })
          .returning({ id: jobs.id });

        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }

      this.logger.log(
        `Successfully ingested ${newJobIds.length} new unique jobs from Freelancer.com.`,
      );
      return newJobIds;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to scrape Freelancer.com: ${msg}`);
      throw error;
    }
  }

  async scrapeWorkingNomads(): Promise<string[]> {
    this.logger.log('Starting Working Nomads scraping...');
    const url = 'https://www.workingnomads.co/api/exposed_jobs';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok)
        throw new Error(`Working Nomads returned ${response.status}`);
      const data = await response.json();
      const newJobIds: string[] = [];
      for (const job of data || []) {
        const externalId = `workingnomads_${job.id || job.slug}`;
        const cleanDesc = extractJobTextFromHtml(job.description || '');
        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'workingnomads',
            externalId,
            title: job.title,
            company: job.company_name || 'Working Nomads',
            description: cleanDesc.slice(0, 7000),
            url: job.url,
          })
          .onConflictDoNothing()
          .returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Working Nomads.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Working Nomads: ${error}`);
      throw error;
    }
  }

  async scrapeHimalayas(): Promise<string[]> {
    this.logger.log('Starting Himalayas scraping...');
    const url = 'https://himalayas.app/jobs/api';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok)
        throw new Error(`Himalayas returned ${response.status}`);
      const data = await response.json();
      const newJobIds: string[] = [];
      for (const job of data?.jobs || []) {
        const externalId = `himalayas_${job.id}`;
        const cleanDesc = extractJobTextFromHtml(job.description || '');
        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'himalayas',
            externalId,
            title: job.title,
            company: job.companyName || 'Himalayas',
            description: cleanDesc.slice(0, 7000),
            url: job.applicationLink || job.url,
          })
          .onConflictDoNothing()
          .returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Himalayas.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Himalayas: ${error}`);
      throw error;
    }
  }

  async scrapeJobicy(): Promise<string[]> {
    this.logger.log('Starting Jobicy scraping...');
    const url = 'https://jobicy.com/api/v2/remote-jobs';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Jobicy returned ${response.status}`);
      const data = await response.json();
      const newJobIds: string[] = [];
      for (const job of data?.jobs || []) {
        const externalId = `jobicy_${job.id}`;
        const cleanDesc = extractJobTextFromHtml(job.jobDescription || '');
        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'jobicy',
            externalId,
            title: job.jobTitle,
            company: job.companyName || 'Jobicy',
            description: cleanDesc.slice(0, 7000),
            url: job.url,
          })
          .onConflictDoNothing()
          .returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Jobicy.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Jobicy: ${error}`);
      throw error;
    }
  }

  async scrapeArbeitnow(): Promise<string[]> {
    this.logger.log('Starting Arbeitnow scraping...');
    const url = 'https://www.arbeitnow.com/api/job-board-api';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok)
        throw new Error(`Arbeitnow returned ${response.status}`);
      const data = await response.json();
      const newJobIds: string[] = [];
      for (const job of data?.data || []) {
        const externalId = `arbeitnow_${job.slug}`;
        const cleanDesc = extractJobTextFromHtml(job.description || '');
        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'arbeitnow',
            externalId,
            title: job.title,
            company: job.company_name || 'Arbeitnow',
            description: cleanDesc.slice(0, 7000),
            url: job.url,
          })
          .onConflictDoNothing()
          .returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Arbeitnow.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Arbeitnow: ${error}`);
      throw error;
    }
  }

  async scrapeRemoteCo(): Promise<string[]> {
    this.logger.warn('Remote.co scraping is disabled (403 Forbidden). Skipping.');
    return [];
  }

  async scrapeDribbbleJobs(): Promise<string[]> {
    this.logger.log('Starting Dribbble Jobs scraping...');
    const url = 'https://dribbble.com/jobs.rss';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Dribbble returned ${response.status}`);
      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const newJobIds: string[] = [];
      const items = $('item').toArray();
      for (const el of items) {
        const guid = $(el).find('guid').text();
        const link = $(el).find('link').text();
        const title = $(el).find('title').text();
        const rawDesc = $(el).find('description').text();
        const externalId = `dribbble_${guid || link}`;
        const cleanDesc = extractJobTextFromHtml(rawDesc || '');
        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'dribbble',
            externalId,
            title,
            company: 'Dribbble Client',
            description: cleanDesc.slice(0, 7000),
            url: link,
          })
          .onConflictDoNothing()
          .returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Dribbble.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Dribbble: ${error}`);
      throw error;
    }
  }

  async scrapeRelocateMe(): Promise<string[]> {
    this.logger.warn('Relocate.me scraping is disabled (404 Not Found). Skipping.');
    return [];
  }

  /**
   * Scrapes JobCity.my RSS feed for Malaysia jobs.
   */
  async scrapeJobcity(): Promise<string[]> {
    this.logger.log('Starting Jobcity.my scraping...');
    const url = 'https://www.jobcity.my/rss/';

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        throw new Error(`Jobcity returned ${response.status}`);
      }

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const items = $('item');

      this.logger.log(`Fetched ${items.length} jobs from Jobcity.my.`);

      const actuallyInsertedIds: string[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = $(items[i]);
        const title = item.children('title').text().trim();
        const link = item.children('link').text().trim();
        const descriptionHtml = item.children('description').text().trim();
        const guid = item.children('guid').text().trim() || link;

        if (!title || !link) continue;
        const externalId = `jobcity_${Buffer.from(guid).toString('base64').substring(0, 30)}`;
        const $desc = cheerio.load(descriptionHtml);
        const description = $desc
          .text()
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 7000);

        try {
          const inserted = await this.db
            .insert(jobs)
            .values({
              platform: 'jobcity',
              externalId,
              title,
              company: 'JobCity Agency',
              description,
              url: link,
            })
            .onConflictDoNothing()
            .returning({ id: jobs.id });

          if (inserted.length > 0) {
            actuallyInsertedIds.push(inserted[0].id);
          }
        } catch (error) {
          this.logger.error(
            `Error inserting Jobcity job ${externalId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(
        `Ingested ${actuallyInsertedIds.length} new jobs from Jobcity.my.`,
      );
      return actuallyInsertedIds;
    } catch (error) {
      this.logger.error(
        `Failed to scrape Jobcity: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  async scrapePythonOrg(): Promise<string[]> {
    this.logger.log('Starting Python.org Jobs scraping...');
    const url = 'https://www.python.org/jobs/feed/rss/';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Python.org returned ${response.status}`);
      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const newJobIds: string[] = [];
      const items = $('item').toArray();
      
      for (const el of items) {
        const guid = $(el).find('guid').text();
        const link = $(el).find('link').text();
        const title = $(el).find('title').text();
        const rawDesc = $(el).find('description').text();
        const externalId = `pythonorg_${guid || link}`;
        const cleanDesc = extractJobTextFromHtml(rawDesc || '');
        
        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'pythonorg',
            externalId,
            title,
            company: 'Python.org',
            description: cleanDesc.slice(0, 7000),
            url: link,
          })
          .onConflictDoNothing()
          .returning({ id: jobs.id });
          
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Python.org.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Python.org: ${error}`);
      return [];
    }
  }

  async scrapeVueJobs(): Promise<string[]> {
    this.logger.log('Starting VueJobs scraping...');
    const url = 'https://app.vuejobs.com/feed/posts';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`VueJobs returned ${response.status}`);
      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const newJobIds: string[] = [];
      const items = $('item').toArray();
      
      for (const el of items) {
        const guid = $(el).find('guid').text();
        const link = $(el).find('link').text();
        const title = $(el).find('title').text();
        const rawDesc = $(el).find('description').text();
        const externalId = `vuejobs_${guid || link}`;
        const cleanDesc = extractJobTextFromHtml(rawDesc || '');
        
        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'vuejobs',
            externalId,
            title,
            company: 'VueJobs',
            description: cleanDesc.slice(0, 7000),
            url: link,
          })
          .onConflictDoNothing()
          .returning({ id: jobs.id });
          
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from VueJobs.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape VueJobs: ${error}`);
      return [];
    }
  }

  async scrapeLaraJobs(): Promise<string[]> {
    this.logger.log('Starting LaraJobs scraping...');
    const url = 'https://larajobs.com/feed';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`LaraJobs returned ${response.status}`);
      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const newJobIds: string[] = [];
      const items = $('item').toArray();
      
      for (const el of items) {
        const guid = $(el).find('guid').text();
        const link = $(el).find('link').text();
        const title = $(el).find('title').text();
        const rawDesc = $(el).find('description').text();
        const externalId = `larajobs_${guid || link}`;
        const cleanDesc = extractJobTextFromHtml(rawDesc || '');
        
        const inserted = await this.db
          .insert(jobs)
          .values({
            platform: 'larajobs',
            externalId,
            title,
            company: 'LaraJobs',
            description: cleanDesc.slice(0, 7000),
            url: link,
          })
          .onConflictDoNothing()
          .returning({ id: jobs.id });
          
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from LaraJobs.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape LaraJobs: ${error}`);
      return [];
    }
  }
}
