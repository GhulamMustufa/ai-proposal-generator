import { Injectable, Inject, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { extractJobTextFromHtml } from '../utils/job-extractor';
import { jobs } from '../db/schema';

/**
 * GraphqlIngestionService
 * Handles the logic for scraping undocumented GraphQL or JSON APIs
 * (Braintrust, Otta, Cord, Arc).
 */
@Injectable()
export class GraphqlIngestionService {
  private readonly logger = new Logger(GraphqlIngestionService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  /**
   * Scrapes Braintrust via their public JSON API.
   * Fetches the job list, then fetches descriptions for new jobs.
   */
  async scrapeBraintrust(): Promise<string[]> {
    this.logger.log('Starting Braintrust scraping...');
    const newJobIds: string[] = [];

    try {
      // 1. Fetch recent jobs
      const res = await fetch('https://app.usebraintrust.com/api/jobs');
      if (!res.ok) throw new Error(`Braintrust API returned ${res.status}`);
      const data = await res.json();
      
      const results = data.results || [];
      this.logger.log(`Fetched ${results.length} jobs from Braintrust.`);

      for (const job of results) {
        const externalId = `braintrust_${job.id}`;
        
        // 2. Fetch the detailed description for this job
        // (The list API does not contain the description)
        let descriptionHtml = '';
        try {
          const detailRes = await fetch(`https://app.usebraintrust.com/api/jobs/${job.id}/`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            descriptionHtml = detailData.description || '';
          }
        } catch (e) {
          this.logger.warn(`Failed to fetch details for Braintrust job ${job.id}`);
        }

        const cleanDesc = extractJobTextFromHtml(descriptionHtml);
        if (cleanDesc.length < 50) continue; // Skip if no description

        // 3. Insert using ON CONFLICT DO NOTHING
        const inserted = await this.db.insert(jobs)
          .values({
            platform: 'braintrust',
            externalId,
            title: job.title || 'Braintrust Role',
            company: job.employer?.name || 'Braintrust Client',
            description: cleanDesc.slice(0, 7000),
            url: `https://app.usebraintrust.com/jobs/${job.id}`,
          })
          .onConflictDoNothing({ target: jobs.externalId })
          .returning({ id: jobs.id });

        if (inserted.length > 0) {
          newJobIds.push(inserted[0].id);
        }
      }

      this.logger.log(`Successfully ingested ${newJobIds.length} new unique jobs from Braintrust.`);
      return newJobIds;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to scrape Braintrust: ${msg}`);
      throw error;
    }
  }
}
