import { Injectable, Inject, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { extractJobTextFromHtml } from '../utils/job-extractor';
import { jobs } from '../db/schema';
import { sql } from 'drizzle-orm';
import * as cheerio from 'cheerio';

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
        const inserted = await this.db.insert(jobs)
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

      this.logger.log(`Successfully ingested ${newJobIds.length} new unique jobs.`);
      return newJobIds;

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to scrape Remotive: ${msg}`);
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

        const inserted = await this.db.insert(jobs)
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

      this.logger.log(`Successfully ingested ${newJobIds.length} new unique jobs from WWR.`);
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
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) throw new Error(`Remote OK returned ${response.status}`);
      
      const data = await response.json();
      
      // Remote OK returns an array where the first item is usually legal/stat metadata
      const fetchedJobs = Array.isArray(data) ? data.filter(j => j.id && j.company) : [];
      this.logger.log(`Fetched ${fetchedJobs.length} jobs from Remote OK.`);

      const newJobIds: string[] = [];

      for (const job of fetchedJobs) {
        const externalId = `remoteok_${job.id}`;
        const cleanDesc = extractJobTextFromHtml(job.description || '');

        const inserted = await this.db.insert(jobs)
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

      this.logger.log(`Successfully ingested ${newJobIds.length} new unique jobs from Remote OK.`);
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
    this.logger.log(`Starting Upwork scraping for feed: ${feedUrl}`);

    try {
      const response = await fetch(feedUrl, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Upwork RSS returned ${response.status}`);
      
      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const newJobIds: string[] = [];

      const items = $('item').toArray();
      this.logger.log(`Fetched ${items.length} jobs from Upwork RSS.`);

      for (const el of items) {
        const guid = $(el).find('guid').text();
        const link = $(el).find('link').text();
        const title = $(el).find('title').text();
        const rawDesc = $(el).find('description').text();

        const externalId = `upwork_${guid || link}`;
        const cleanDesc = extractJobTextFromHtml(rawDesc || '');

        const inserted = await this.db.insert(jobs)
          .values({
            platform: 'upwork',
            externalId,
            title,
            company: 'Upwork Client', // Upwork hides exact client names in RSS
            description: cleanDesc.slice(0, 7000),
            url: link,
          })
          .onConflictDoNothing({ target: jobs.externalId })
          .returning({ id: jobs.id });

        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }

      this.logger.log(`Successfully ingested ${newJobIds.length} new unique jobs from Upwork.`);
      return newJobIds;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to scrape Upwork: ${msg}`);
      throw error;
    }
  }

  /**
   * Scrapes Freelancer.com via their public REST API.
   */
  async scrapeFreelancerCom(): Promise<string[]> {
    this.logger.log('Starting Freelancer.com scraping...');
    // Hardcoding a generic 'javascript' query for now; can be parameterized later
    const url = 'https://www.freelancer.com/api/projects/0.1/projects/active?query=javascript&compact=true&languages[]=en&limit=50';

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Freelancer returned ${response.status}`);
      
      const data = await response.json();
      const fetchedJobs = data?.result?.projects ?? [];
      
      this.logger.log(`Fetched ${fetchedJobs.length} jobs from Freelancer.com.`);

      const newJobIds: string[] = [];

      for (const job of fetchedJobs) {
        const externalId = `freelancer_${job.id}`;
        // Construct the public URL from the seo_url
        const jobUrl = `https://www.freelancer.com/projects/${job.seo_url}`;
        const cleanDesc = extractJobTextFromHtml(job.description || '');

        const inserted = await this.db.insert(jobs)
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

      this.logger.log(`Successfully ingested ${newJobIds.length} new unique jobs from Freelancer.com.`);
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
      if (!response.ok) throw new Error(`Working Nomads returned ${response.status}`);
      const data = await response.json();
      const newJobIds: string[] = [];
      for (const job of data || []) {
        const externalId = `workingnomads_${job.id || job.slug}`;
        const cleanDesc = extractJobTextFromHtml(job.description || '');
        const inserted = await this.db.insert(jobs).values({
          platform: 'workingnomads', externalId, title: job.title, company: job.company_name || 'Working Nomads',
          description: cleanDesc.slice(0, 7000), url: job.url,
        }).onConflictDoNothing().returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Working Nomads.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Working Nomads: ${error}`); throw error;
    }
  }

  async scrapeHimalayas(): Promise<string[]> {
    this.logger.log('Starting Himalayas scraping...');
    const url = 'https://himalayas.app/jobs/api';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Himalayas returned ${response.status}`);
      const data = await response.json();
      const newJobIds: string[] = [];
      for (const job of data?.jobs || []) {
        const externalId = `himalayas_${job.id}`;
        const cleanDesc = extractJobTextFromHtml(job.description || '');
        const inserted = await this.db.insert(jobs).values({
          platform: 'himalayas', externalId, title: job.title, company: job.companyName || 'Himalayas',
          description: cleanDesc.slice(0, 7000), url: job.applicationLink || job.url,
        }).onConflictDoNothing().returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Himalayas.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Himalayas: ${error}`); throw error;
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
        const inserted = await this.db.insert(jobs).values({
          platform: 'jobicy', externalId, title: job.jobTitle, company: job.companyName || 'Jobicy',
          description: cleanDesc.slice(0, 7000), url: job.url,
        }).onConflictDoNothing().returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Jobicy.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Jobicy: ${error}`); throw error;
    }
  }

  async scrapeArbeitnow(): Promise<string[]> {
    this.logger.log('Starting Arbeitnow scraping...');
    const url = 'https://www.arbeitnow.com/api/job-board-api';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Arbeitnow returned ${response.status}`);
      const data = await response.json();
      const newJobIds: string[] = [];
      for (const job of data?.data || []) {
        const externalId = `arbeitnow_${job.slug}`;
        const cleanDesc = extractJobTextFromHtml(job.description || '');
        const inserted = await this.db.insert(jobs).values({
          platform: 'arbeitnow', externalId, title: job.title, company: job.company_name || 'Arbeitnow',
          description: cleanDesc.slice(0, 7000), url: job.url,
        }).onConflictDoNothing().returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Arbeitnow.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Arbeitnow: ${error}`); throw error;
    }
  }

  async scrapeRemoteCo(): Promise<string[]> {
    this.logger.log('Starting Remote.co scraping...');
    const url = 'https://remote.co/remote-jobs/feed/';
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(20000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });
      if (!response.ok) throw new Error(`Remote.co returned ${response.status}`);
      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const newJobIds: string[] = [];
      const items = $('item').toArray();
      for (const el of items) {
        const guid = $(el).find('guid').text();
        const link = $(el).find('link').text();
        const title = $(el).find('title').text();
        const rawDesc = $(el).find('content\\:encoded').text() || $(el).find('description').text();
        const externalId = `remoteco_${guid || link}`;
        const cleanDesc = extractJobTextFromHtml(rawDesc || '');
        const inserted = await this.db.insert(jobs).values({
          platform: 'remoteco', externalId, title, company: 'Remote.co Client',
          description: cleanDesc.slice(0, 7000), url: link,
        }).onConflictDoNothing().returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Remote.co.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Remote.co: ${error}`); throw error;
    }
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
        const inserted = await this.db.insert(jobs).values({
          platform: 'dribbble', externalId, title, company: 'Dribbble Client',
          description: cleanDesc.slice(0, 7000), url: link,
        }).onConflictDoNothing().returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Dribbble.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Dribbble: ${error}`); throw error;
    }
  }

  async scrapeRelocateMe(): Promise<string[]> {
    this.logger.log('Starting Relocate.me scraping...');
    const url = 'https://relocate.me/jobs.rss';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Relocate.me returned ${response.status}`);
      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const newJobIds: string[] = [];
      const items = $('item').toArray();
      for (const el of items) {
        const guid = $(el).find('guid').text();
        const link = $(el).find('link').text();
        const title = $(el).find('title').text();
        const rawDesc = $(el).find('description').text();
        const externalId = `relocateme_${guid || link}`;
        const cleanDesc = extractJobTextFromHtml(rawDesc || '');
        const inserted = await this.db.insert(jobs).values({
          platform: 'relocateme', externalId, title, company: 'Relocate.me Client',
          description: cleanDesc.slice(0, 7000), url: link,
        }).onConflictDoNothing().returning({ id: jobs.id });
        if (inserted.length > 0) newJobIds.push(inserted[0].id);
      }
      this.logger.log(`Ingested ${newJobIds.length} jobs from Relocate.me.`);
      return newJobIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Relocate.me: ${error}`); throw error;
    }
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
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
        const description = $desc.text().replace(/\s+/g, ' ').trim().slice(0, 7000);

        try {
          const inserted = await this.db.insert(jobs).values({
            platform: 'jobcity',
            externalId,
            title,
            company: 'JobCity Agency',
            description,
            url: link,
          }).onConflictDoNothing().returning({ id: jobs.id });

          if (inserted.length > 0) {
            actuallyInsertedIds.push(inserted[0].id);
          }
        } catch (error) {
          this.logger.error(`Error inserting Jobcity job ${externalId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      this.logger.log(`Ingested ${actuallyInsertedIds.length} new jobs from Jobcity.my.`);
      return actuallyInsertedIds;
    } catch (error) {
      this.logger.error(`Failed to scrape Jobcity: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
}
