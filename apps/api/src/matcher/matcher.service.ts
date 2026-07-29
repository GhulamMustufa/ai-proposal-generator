import { Injectable, Inject, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { personas, jobs, aiMatches } from '../db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import OpenAI from 'openai';
import { TARGET_COMPANIES } from '../workers/target-companies.config';

/**
 * MatcherService
 *
 * Fetches user personas and uses OpenAI to score them against new jobs.
 * Saves the resulting match score and reasoning to the Drizzle database.
 */
@Injectable()
export class MatcherService {
  private readonly logger = new Logger(MatcherService.name);
  private readonly openai: OpenAI;

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }


  private async evaluatePersonaForJob(
    persona: any,
    job: typeof jobs.$inferSelect,
  ) {
    const skillsText = Array.isArray(persona.skills)
      ? persona.skills.join(', ')
      : JSON.stringify(persona.skills);

    const prompt = `
You are an expert technical recruiter AI. 
Evaluate how well the user's Persona matches the job description.

PERSONA DETAILS:
Role Name: ${persona.name}
Years of Experience: ${persona.yearsOfExperience || 'Not specified'}

USER SKILLS:
${skillsText}

USER RESUME EXTRACT:
${persona.resumeText || 'No resume text provided.'}

JOB FILTERS (STRICT REQUIREMENTS):
${persona.jobFilters ? JSON.stringify(persona.jobFilters, null, 2) : 'No strict filters specified.'}

JOB DESCRIPTION:
Title: ${job.title}
${job.description}

Analyze the Job Description against the Persona's skills, experience, and resume.
Determine a match score from 0 to 100 based on how qualified this persona is for this job.

CRITICAL INSTRUCTIONS:
- Give a very high score (85-100) if the core skills and role match closely. Do not penalize heavily for a slight seniority mismatch (e.g., Mid-level applying to Senior).
- Give a moderate-to-high score (70-84) if they meet the core requirements but lack some secondary or 'nice-to-have' skills. Be forgiving to encourage a diverse pool of job options.
- Give a low score (0-69) ONLY if the persona is completely unqualified and lacks the core framework/skill required for the job.

Output MUST be exactly in this JSON format:
{
  "match_score": number (0 to 100),
  "match_reasoning": "A concise 1-2 sentence explanation of why this score was given. Be specific about matching or missing skills."
}
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const outputStr = response.choices[0]?.message?.content;
    if (!outputStr) throw new Error('OpenAI returned empty response');

    const result = JSON.parse(outputStr);

    if (
      typeof result.match_score !== 'number' ||
      typeof result.match_reasoning !== 'string'
    ) {
      throw new Error(`Invalid JSON schema returned by OpenAI: ${outputStr}`);
    }

    let finalScore = result.match_score;
    let finalReasoning = result.match_reasoning;

    if (finalScore >= 75) {
      const companyStr = job.company?.toLowerCase() || '';
      const titleStr = job.title?.toLowerCase() || '';
      
      const dreamCompanies = Array.isArray(persona.dreamCompanies) ? persona.dreamCompanies : [];
      let isTargetCompany = false;
      
      for (const tc of dreamCompanies) {
        if (!tc || typeof tc !== 'string') continue;
        const tcStr = tc.toLowerCase();
        // Use word boundary regex to avoid matching "Pineapple" when searching for "Apple"
        let pattern = tcStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = pattern.replace(/[- ]/g, '[- ]?');
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        
        if (regex.test(companyStr) || regex.test(titleStr)) {
          isTargetCompany = true;
          break;
        }
      }

      if (isTargetCompany) {
        finalScore = Math.min(100, finalScore + 15);
        finalReasoning +=
          ' [Target Company Boost applied due to strong skills match]';
      }
    }

    await this.db.insert(aiMatches).values({
      userId: persona.userId,
      personaId: persona.personaId,
      jobId: job.id,
      matchScore: finalScore,
      matchReasoning: finalReasoning,
    });

    this.logger.debug(
      `Saved match score ${finalScore} for persona ${persona.personaId} and job ${job.id}`,
    );
  }

  /**
   * Syncs new jobs for a specific persona.
   * If fullBackfill is true, it deletes old matches and evaluates all jobs.
   * Otherwise, it only evaluates jobs scraped after the persona's lastSyncedAt.
   */
  async syncPersonaJobs(personaId: string, fullBackfill: boolean = false) {
    this.logger.log(`Starting sync for persona ${personaId} (fullBackfill=${fullBackfill})`);

    const [persona] = await this.db
      .select({
        personaId: personas.id,
        userId: personas.userId,
        name: personas.name,
        skills: personas.skills,
        yearsOfExperience: personas.yearsOfExperience,
        resumeText: personas.resumeText,
        jobFilters: personas.jobFilters,
        dreamCompanies: personas.dreamCompanies,
        lastSyncedAt: personas.lastSyncedAt,
        embedding: personas.embedding,
      })
      .from(personas)
      .where(eq(personas.id, personaId))
      .limit(1);

    if (
      !persona ||
      !persona.skills ||
      (Array.isArray(persona.skills) && persona.skills.length === 0)
    ) {
      this.logger.warn(
        `Persona ${personaId} has no skills configured. Skipping matching.`,
      );
      return;
    }

    let jobsToEvaluate: any[] = [];

    if (fullBackfill) {
      // Delete existing matches for this persona
      await this.db.delete(aiMatches).where(eq(aiMatches.personaId, personaId));
      this.logger.log(`Deleted old matches for persona ${personaId}`);
    }

    const { gt, and, asc } = require('drizzle-orm');
    const { cosineDistance } = require('drizzle-orm');

    let queryConditions = [isNotNull(jobs.embedding)];
    if (!fullBackfill && persona.lastSyncedAt) {
      queryConditions.push(gt(jobs.scrapedAt, persona.lastSyncedAt));
    }

    if (!persona.embedding) {
      this.logger.warn(`Persona ${personaId} has no embedding. Skipping vector search.`);
      return;
    }

    jobsToEvaluate = await this.db
      .select()
      .from(jobs)
      .where(and(...queryConditions))
      .orderBy(asc(cosineDistance(jobs.embedding, persona.embedding)))
      .limit(100);

    this.logger.log(
      `Re-evaluating Top ${jobsToEvaluate.length} matching jobs for persona ${personaId}...`,
    );

    // Process in batches to massively speed up OpenAI evaluation while respecting rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < jobsToEvaluate.length; i += BATCH_SIZE) {
      const batch = jobsToEvaluate.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (job) => {
          try {
            await this.evaluatePersonaForJob(persona, job);
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Failed to evaluate persona ${personaId} for job ${job.id}: ${msg}`,
            );
          }
        })
      );
    }
    
    // Update lastSyncedAt
    await this.db.update(personas).set({ lastSyncedAt: new Date() }).where(eq(personas.id, personaId));

    this.logger.log(`Completed sync for persona ${personaId}`);
  }
}
