import { Injectable, Logger, Inject } from '@nestjs/common';
import { cleanDescription } from '../utils/clean-description';
import { DB_CONNECTION } from '../db/db.module';
import { jobs, targetCompanies } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AtsIngestionService {
  private readonly logger = new Logger(AtsIngestionService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  async scrapeGreenhouse(): Promise<string[]> {
    this.logger.log('Starting Universal Greenhouse ATS scraping...');
    const companies = await this.db
      .select()
      .from(targetCompanies)
      .where(eq(targetCompanies.atsProvider, 'greenhouse'));
    this.logger.log(
      `Found ${companies.length} Greenhouse companies to scrape.`,
    );

    const newJobIds: string[] = [];

    for (const company of companies) {
      const url = `https://boards-api.greenhouse.io/v1/boards/${company.atsBoardToken}/jobs?content=true`;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) continue; // Skip if board is offline or private
        const data = await response.json();

        for (const job of data?.jobs || []) {
          // Some roles might not be remote, filter by location if possible
          const location = job.location?.name?.toLowerCase() || '';
          if (!location.includes('remote') && !location.includes('anywhere')) {
            // We can strictly filter here if we want, but let's ingest and let AI Matcher decide
          }

          const externalId = `greenhouse_${company.atsBoardToken}_${job.id}`;
          
          let description = job.content ? cleanDescription(
                job.content ||
                  decodeURIComponent(job.content || ''),
              ) : '';

          if (!description)
            description = `Job title: ${job.title}. Apply at ${job.absolute_url}`;

          const inserted = await this.db
            .insert(jobs)
            .values({
              platform: 'greenhouse',
              externalId,
              title: job.title,
              company: company.name,
              description: description.slice(0, 7000),
              url: job.absolute_url,
            })
            .onConflictDoNothing()
            .returning({ id: jobs.id });

          if (inserted.length > 0) newJobIds.push(inserted[0].id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to scrape Greenhouse board ${company.atsBoardToken}`,
        );
      }
    }

    this.logger.log(
      `Ingested ${newJobIds.length} total jobs from all Greenhouse boards.`,
    );
    return newJobIds;
  }

  async scrapeLever(): Promise<string[]> {
    this.logger.log('Starting Universal Lever ATS scraping...');
    const companies = await this.db
      .select()
      .from(targetCompanies)
      .where(eq(targetCompanies.atsProvider, 'lever'));
    this.logger.log(`Found ${companies.length} Lever companies to scrape.`);

    const newJobIds: string[] = [];

    for (const company of companies) {
      const url = `https://api.lever.co/v0/postings/${company.atsBoardToken}?mode=json`;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) continue;
        const jobsList = await response.json();

        for (const job of jobsList || []) {
          const externalId = `lever_${company.atsBoardToken}_${job.id}`;
          const description = cleanDescription(
            job.descriptionPlain || job.description || '',
          );

          const inserted = await this.db
            .insert(jobs)
            .values({
              platform: 'lever',
              externalId,
              title: job.text,
              company: company.name,
              description: description.slice(0, 7000),
              url: job.hostedUrl,
            })
            .onConflictDoNothing()
            .returning({ id: jobs.id });

          if (inserted.length > 0) newJobIds.push(inserted[0].id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to scrape Lever board ${company.atsBoardToken}`,
        );
      }
    }

    this.logger.log(
      `Ingested ${newJobIds.length} total jobs from all Lever boards.`,
    );
    return newJobIds;
  }

  async scrapeSmartRecruiters(): Promise<string[]> {
    this.logger.log('Starting Universal SmartRecruiters ATS scraping...');
    const companies = await this.db
      .select()
      .from(targetCompanies)
      .where(eq(targetCompanies.atsProvider, 'smartrecruiters'));
    this.logger.log(
      `Found ${companies.length} SmartRecruiters companies to scrape.`,
    );

    const newJobIds: string[] = [];

    for (const company of companies) {
      const url = `https://api.smartrecruiters.com/v1/companies/${company.atsBoardToken}/postings`;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) continue;
        const data = await response.json();

        for (const job of data?.content || []) {
          const externalId = `smartrecruiters_${company.atsBoardToken}_${job.id}`;

          let description = '';
          try {
            const detailRes = await fetch(
              `https://api.smartrecruiters.com/v1/companies/${company.atsBoardToken}/postings/${job.id}`,
            );
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              description = cleanDescription(
                detailData.jobAd?.sections?.jobDescription?.text || '',
              );
            }
          } catch (e) {}

          if (!description)
            description = `Job title: ${job.name}. Apply at ${job.ref}`;

          const inserted = await this.db
            .insert(jobs)
            .values({
              platform: 'smartrecruiters',
              externalId,
              title: job.name,
              company: company.name,
              description: description.slice(0, 7000),
              url:
                job.ref ||
                `https://jobs.smartrecruiters.com/${company.atsBoardToken}/${job.id}`,
            })
            .onConflictDoNothing()
            .returning({ id: jobs.id });

          if (inserted.length > 0) newJobIds.push(inserted[0].id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to scrape SmartRecruiters board ${company.atsBoardToken}`,
        );
      }
    }

    this.logger.log(
      `Ingested ${newJobIds.length} total jobs from all SmartRecruiters boards.`,
    );
    return newJobIds;
  }

  async scrapeWorkable(): Promise<string[]> {
    this.logger.log('Starting Universal Workable ATS scraping...');
    const companies = await this.db
      .select()
      .from(targetCompanies)
      .where(eq(targetCompanies.atsProvider, 'workable'));
    this.logger.log(`Found ${companies.length} Workable companies to scrape.`);

    const newJobIds: string[] = [];

    for (const company of companies) {
      const url = `https://apply.workable.com/api/v3/accounts/${company.atsBoardToken}/jobs`;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) continue;
        const data = await response.json();

        for (const job of data?.results || []) {
          const externalId = `workable_${company.atsBoardToken}_${job.shortcode}`;

          const inserted = await this.db
            .insert(jobs)
            .values({
              platform: 'workable',
              externalId,
              title: job.title,
              company: company.name,
              description: `Job title: ${job.title}. Apply at https://apply.workable.com/${company.atsBoardToken}/j/${job.shortcode}`,
              url: `https://apply.workable.com/${company.atsBoardToken}/j/${job.shortcode}`,
            })
            .onConflictDoNothing()
            .returning({ id: jobs.id });

          if (inserted.length > 0) newJobIds.push(inserted[0].id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to scrape Workable board ${company.atsBoardToken}`,
        );
      }
    }

    this.logger.log(
      `Ingested ${newJobIds.length} total jobs from all Workable boards.`,
    );
    return newJobIds;
  }

  async scrapeBreezy(): Promise<string[]> {
    this.logger.log('Starting Universal Breezy HR ATS scraping...');
    const companies = await this.db
      .select()
      .from(targetCompanies)
      .where(eq(targetCompanies.atsProvider, 'breezy'));
    this.logger.log(`Found ${companies.length} Breezy companies to scrape.`);

    const newJobIds: string[] = [];

    for (const company of companies) {
      const url = `https://breezy.hr/v3/companies/${company.atsBoardToken}/positions`;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) continue;
        const jobsList = await response.json();

        for (const job of jobsList || []) {
          if (job.state !== 'published') continue;
          const externalId = `breezy_${company.atsBoardToken}_${job._id}`;

          const inserted = await this.db
            .insert(jobs)
            .values({
              platform: 'breezy',
              externalId,
              title: job.name,
              company: company.name,
              description: cleanDescription(job.description || ''),
              url:
                job.url ||
                `https://${company.atsBoardToken}.breezy.hr/p/${job._id}`,
            })
            .onConflictDoNothing()
            .returning({ id: jobs.id });

          if (inserted.length > 0) newJobIds.push(inserted[0].id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to scrape Breezy board ${company.atsBoardToken}`,
        );
      }
    }

    this.logger.log(
      `Ingested ${newJobIds.length} total jobs from all Breezy boards.`,
    );
    return newJobIds;
  }

  async scrapeAshby(): Promise<string[]> {
    this.logger.log('Starting Universal Ashby HQ ATS scraping...');
    const companies = await this.db
      .select()
      .from(targetCompanies)
      .where(eq(targetCompanies.atsProvider, 'ashby'));
    this.logger.log(`Found ${companies.length} Ashby companies to scrape.`);

    const newJobIds: string[] = [];

    for (const company of companies) {
      const url = `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operationName: 'ApiJobBoardWithTeams',
            variables: {
              organizationHostedJobsPageName: company.atsBoardToken,
            },
            query: `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) { jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) { jobPostings { id title descriptionHtml jobPageUrl } } }`,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) continue;
        const data = await response.json();
        const postings = data?.data?.jobBoard?.jobPostings || [];

        for (const job of postings) {
          const externalId = `ashby_${company.atsBoardToken}_${job.id}`;

          const inserted = await this.db
            .insert(jobs)
            .values({
              platform: 'ashby',
              externalId,
              title: job.title,
              company: company.name,
              description: cleanDescription(job.descriptionHtml || ''),
              url:
                job.jobPageUrl ||
                `https://jobs.ashbyhq.com/${company.atsBoardToken}/${job.id}`,
            })
            .onConflictDoNothing()
            .returning({ id: jobs.id });

          if (inserted.length > 0) newJobIds.push(inserted[0].id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to scrape Ashby board ${company.atsBoardToken}`,
        );
      }
    }

    this.logger.log(
      `Ingested ${newJobIds.length} total jobs from all Ashby boards.`,
    );
    return newJobIds;
  }
}
