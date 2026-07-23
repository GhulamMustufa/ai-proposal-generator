import { Injectable, Logger, Inject } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { jobs } from '../db/schema';
import OpenAI from 'openai';
import { DORK_QUERIES } from '../workers/dork.config';
import * as crypto from 'crypto';

@Injectable()
export class DorkIngestionService {
  private readonly logger = new Logger(DorkIngestionService.name);
  private readonly openai: OpenAI;

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async scrapeGoogleDorks(): Promise<string[]> {
    this.logger.log('Starting Google Dork Ingestion via Serper.dev...');

    if (!process.env.SERPER_API_KEY) {
      this.logger.error(
        'SERPER_API_KEY is not set in the environment variables.',
      );
      return [];
    }

    const newJobIds: string[] = [];

    for (let i = 0; i < DORK_QUERIES.length; i++) {
      const query = DORK_QUERIES[i];
      this.logger.log(
        `Executing Dork Query ${i + 1}/${DORK_QUERIES.length}: ${query}`,
      );

      try {
        const url = 'https://google.serper.dev/search';

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-API-KEY': process.env.SERPER_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: query,
            tbs: 'qdr:d', // past 24 hours
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          this.logger.warn(
            `Serper.dev responded with status ${response.status} for query ${i + 1}`,
          );
          continue;
        }

        const data = await response.json();
        const organicResults = data.organic_results || [];

        this.logger.log(
          `Found ${organicResults.length} organic results for query ${i + 1}`,
        );

        for (const result of organicResults) {
          const externalId =
            'dork_' +
            crypto
              .createHash('md5')
              .update(result.link || '')
              .digest('hex');

          const prompt = `
You are an expert technical recruiter AI.
Is this Google search snippet a legitimate freelance, contract, or full-time tech job posting? 
(Ignore profiles, generic company pages, or unrelated articles).

Title: ${result.title}
Snippet: ${result.snippet}
Link: ${result.link}

Extract the company name, job title, and platform. 
Return exactly this JSON:
{ 
  "isJob": true or false,
  "title": "string or null",
  "company": "string or null",
  "platform": "string or null"
}
          `;

          try {
            const aiResponse = await this.openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_object' },
              temperature: 0.1,
            });

            const outputStr = aiResponse.choices[0]?.message?.content;
            if (!outputStr) continue;

            const validation = JSON.parse(outputStr);

            if (validation.isJob && validation.title) {
              const platformName = validation.platform || 'Google Dork';

              const inserted = await this.db
                .insert(jobs)
                .values({
                  platform: platformName
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, ''),
                  externalId,
                  title: validation.title,
                  company: validation.company,
                  description: `Sourced via Google Dork.\\n\\nSnippet: ${result.snippet}\\nApply at: ${result.link}`,
                  url: result.link,
                })
                .onConflictDoNothing()
                .returning({ id: jobs.id });

              if (inserted.length > 0) {
                newJobIds.push(inserted[0].id);
                this.logger.debug(`Saved new Dork Job: ${validation.title}`);
              }
            } else {
              this.logger.debug(`Filtered out non-job result: ${result.title}`);
            }
          } catch (aiError) {
            this.logger.error(
              `AI validation failed for result: ${result.link}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(`Failed to execute Dork Query ${i + 1}`, error);
      }
    }

    this.logger.log(
      `Ingested ${newJobIds.length} total jobs from Google Dorks.`,
    );
    return newJobIds;
  }
}
