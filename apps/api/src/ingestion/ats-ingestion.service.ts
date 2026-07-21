import { Injectable, Logger } from '@nestjs/common';
import { db } from '../db';
import { jobs, targetCompanies } from '../db/schema';
import { eq } from 'drizzle-orm';
import { extractJobTextFromHtml } from '../utils/html-parser';

@Injectable()
export class AtsIngestionService {
  private readonly logger = new Logger(AtsIngestionService.name);

  async scrapeGreenhouse(): Promise<string[]> {
    this.logger.log('Starting Universal Greenhouse ATS scraping...');
    const companies = await db.select().from(targetCompanies).where(eq(targetCompanies.atsProvider, 'greenhouse'));
    this.logger.log(`Found ${companies.length} Greenhouse companies to scrape.`);
    
    const newJobIds: string[] = [];

    for (const company of companies) {
      const url = `https://boards-api.greenhouse.io/v1/boards/${company.atsBoardToken}/jobs`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue; // Skip if board is offline or private
        const data = await response.json();
        
        for (const job of data?.jobs || []) {
          // Some roles might not be remote, filter by location if possible
          const location = job.location?.name?.toLowerCase() || '';
          if (!location.includes('remote') && !location.includes('anywhere')) {
             // We can strictly filter here if we want, but let's ingest and let AI Matcher decide
          }

          const externalId = `greenhouse_${company.atsBoardToken}_${job.id}`;
          
          // Greenhouse requires fetching the individual job for the full description, but we can do it if needed.
          // Or just save the URL for the frontend scraper
          // For now, we will fetch the detail endpoint to get the description
          let description = '';
          try {
             const detailRes = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company.atsBoardToken}/jobs/${job.id}`);
             if (detailRes.ok) {
                const detailData = await detailRes.json();
                description = extractJobTextFromHtml(detailData.content || decodeURIComponent(detailData.content || ''));
             }
          } catch(e) {}
          
          if (!description) description = `Job title: ${job.title}. Apply at ${job.absolute_url}`;

          const inserted = await db.insert(jobs).values({
            platform: 'greenhouse',
            externalId,
            title: job.title,
            company: company.name,
            description: description.slice(0, 7000),
            url: job.absolute_url,
          }).onConflictDoNothing().returning({ id: jobs.id });
          
          if (inserted.length > 0) newJobIds.push(inserted[0].id);
        }
      } catch (error) {
        this.logger.error(`Failed to scrape Greenhouse board ${company.atsBoardToken}`);
      }
    }
    
    this.logger.log(`Ingested ${newJobIds.length} total jobs from all Greenhouse boards.`);
    return newJobIds;
  }

  async scrapeLever(): Promise<string[]> {
    this.logger.log('Starting Universal Lever ATS scraping...');
    const companies = await db.select().from(targetCompanies).where(eq(targetCompanies.atsProvider, 'lever'));
    this.logger.log(`Found ${companies.length} Lever companies to scrape.`);
    
    const newJobIds: string[] = [];

    for (const company of companies) {
      const url = `https://api.lever.co/v0/postings/${company.atsBoardToken}?mode=json`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue; 
        const jobsList = await response.json();
        
        for (const job of jobsList || []) {
          const externalId = `lever_${company.atsBoardToken}_${job.id}`;
          const description = extractJobTextFromHtml(job.descriptionPlain || job.description || '');

          const inserted = await db.insert(jobs).values({
            platform: 'lever',
            externalId,
            title: job.text,
            company: company.name,
            description: description.slice(0, 7000),
            url: job.hostedUrl,
          }).onConflictDoNothing().returning({ id: jobs.id });
          
          if (inserted.length > 0) newJobIds.push(inserted[0].id);
        }
      } catch (error) {
        this.logger.error(`Failed to scrape Lever board ${company.atsBoardToken}`);
      }
    }
    
    this.logger.log(`Ingested ${newJobIds.length} total jobs from all Lever boards.`);
    return newJobIds;
  }
}
