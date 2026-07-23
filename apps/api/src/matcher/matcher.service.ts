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

  /**
   * Evaluates all active personas against a single incoming job.
   * Processes sequentially to avoid OpenAI rate limits.
   */
  async evaluateJob(jobId: string) {
    this.logger.log(`Starting AI matching evaluation for job ${jobId}`);

    // Fetch the target job
    const [job] = await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      this.logger.warn(`Job ${jobId} not found in DB`);
      return;
    }

    // Fetch all active personas with parsed skills
    const allPersonas = await this.db
      .select({
        personaId: personas.id,
        userId: personas.userId,
        name: personas.name,
        skills: personas.skills,
        idealSalary: personas.idealSalary,
        yearsOfExperience: personas.yearsOfExperience,
        resumeText: personas.resumeText,
      })
      .from(personas)
      .where(isNotNull(personas.skills));

    this.logger.log(
      `Evaluating job against ${allPersonas.length} personas with skills...`,
    );

    for (const persona of allPersonas) {
      try {
        const personaSkills = Array.isArray(persona.skills) ? persona.skills : [];
        const jobText = `${job.title} ${job.description}`.toLowerCase();

        let hasKeywordMatch = true;

        if (personaSkills.length > 0) {
          const matchedSkills = personaSkills.filter((skill: any) => {
            const skillStr = String(skill).toLowerCase();
            let pattern = skillStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            pattern = pattern.replace(/\\\.(js)/g, '(?:\\.js|js|\\sjs)');
            pattern = pattern.replace(/[- ]/g, '[- ]?');

            const regex = new RegExp(`\\b${pattern}\\b`, 'i');
            return regex.test(jobText);
          });

          if (matchedSkills.length < 3) {
            hasKeywordMatch = false;
            this.logger.debug(
              `Job ${job.id} filtered out for persona ${persona.personaId}. Only matched ${matchedSkills.length} skills. Skipping OpenAI.`,
            );

            await this.db.insert(aiMatches).values({
              userId: persona.userId,
              personaId: persona.personaId,
              jobId: job.id,
              matchScore: 0,
              matchReasoning:
                'Filtered out by keyword check. Job description does not contain at least 3 of your core skills.',
            });
            continue;
          }
        }

        await this.evaluatePersonaForJob(persona, job);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to evaluate persona ${persona.personaId} for job ${job.id}: ${msg}`,
        );
      }
    }

    this.logger.log(`Completed matching evaluation for job ${jobId}`);
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
Ideal Salary: ${persona.idealSalary || 'Not specified'}

USER SKILLS:
${skillsText}

USER RESUME EXTRACT:
${persona.resumeText || 'No resume text provided.'}

JOB DESCRIPTION:
Title: ${job.title}
${job.description}

Analyze the Job Description against the Persona's skills, experience, and resume.
Determine a match score from 0 to 100 based on how qualified this persona is for this job.

CRITICAL INSTRUCTIONS:
- Give a very high score (85-100) if the core skills, experience level, and role match closely.
- Give a moderate score (50-84) if they meet the basic requirements but lack some desired skills.
- Give a low score (0-49) if the persona is clearly unqualified, lacks core required skills, or if the seniority level is a complete mismatch.

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
      const isTargetCompany = TARGET_COMPANIES.some(
        (tc) =>
          companyStr.includes(tc.toLowerCase()) ||
          titleStr.includes(tc.toLowerCase()),
      );

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
   * Re-evaluates a specific persona against all existing jobs.
   */
  async reEvaluatePersona(personaId: string) {
    this.logger.log(`Starting full re-evaluation for persona ${personaId}`);

    const [persona] = await this.db
      .select({
        personaId: personas.id,
        userId: personas.userId,
        name: personas.name,
        skills: personas.skills,
        idealSalary: personas.idealSalary,
        yearsOfExperience: personas.yearsOfExperience,
        resumeText: personas.resumeText,
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

    // Delete existing matches for this persona
    await this.db.delete(aiMatches).where(eq(aiMatches.personaId, personaId));
    this.logger.log(`Deleted old matches for persona ${personaId}`);

    const allJobs = await this.db.select().from(jobs);
    this.logger.log(
      `Re-evaluating ${allJobs.length} jobs for persona ${personaId}...`,
    );

    for (const job of allJobs) {
      try {
        const personaSkills = Array.isArray(persona.skills) ? persona.skills : [];
        const jobText = `${job.title} ${job.description}`.toLowerCase();

        let hasKeywordMatch = true;

        if (personaSkills.length > 0) {
          const matchedSkills = personaSkills.filter((skill: any) => {
            const skillStr = String(skill).toLowerCase();
            let pattern = skillStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            pattern = pattern.replace(/\\\.(js)/g, '(?:\\.js|js|\\sjs)');
            pattern = pattern.replace(/[- ]/g, '[- ]?');

            const regex = new RegExp(`\\b${pattern}\\b`, 'i');
            return regex.test(jobText);
          });

          if (matchedSkills.length < 3) {
            hasKeywordMatch = false;
          }
        }

        if (!hasKeywordMatch) {
          await this.db.insert(aiMatches).values({
            userId: persona.userId,
            personaId: persona.personaId,
            jobId: job.id,
            matchScore: 0,
            matchReasoning:
              'Filtered out by keyword check. Job description does not contain at least 3 of your core skills.',
          });
          continue;
        }

        await this.evaluatePersonaForJob(persona, job);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to evaluate persona ${personaId} for job ${job.id}: ${msg}`,
        );
      }
    }

    this.logger.log(`Completed full re-evaluation for persona ${personaId}`);
  }
}
