import { Injectable, Inject, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { userProfiles, jobs, aiMatches } from '../db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import OpenAI from 'openai';

/**
 * MatcherService
 * 
 * Fetches user profiles and uses OpenAI to score them against new jobs.
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
   * Evaluates all active users against a single incoming job.
   * Processes sequentially to avoid OpenAI rate limits.
   */
  async evaluateJob(jobId: string) {
    this.logger.log(`Starting AI matching evaluation for job ${jobId}`);

    // Fetch the target job
    const [job] = await this.db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    
    if (!job) {
      this.logger.warn(`Job ${jobId} not found in DB`);
      return;
    }

    // Fetch all active users with parsed skills
    const usersWithSkills = await this.db
      .select({ userId: userProfiles.userId, skills: userProfiles.skills, jobFilters: userProfiles.jobFilters })
      .from(userProfiles)
      .where(isNotNull(userProfiles.skills));

    this.logger.log(`Evaluating job against ${usersWithSkills.length} users with skills...`);

    // Process all users sequentially as per the user's instructions
    for (const user of usersWithSkills) {
      try {
        const userSkills = Array.isArray(user.skills) ? user.skills : [];
        const jobText = `${job.title} ${job.description}`.toLowerCase();
        
        // Cost-Reduction: Only send to OpenAI if at least 70% of the user's skills are found in the job description
        let hasKeywordMatch = true;
        
        if (userSkills.length > 0) {
          const matchedSkills = userSkills.filter((skill: any) => jobText.includes(String(skill).toLowerCase()));
          const matchPercentage = matchedSkills.length / userSkills.length;
          
          if (matchPercentage < 0.70) {
            hasKeywordMatch = false;
            this.logger.debug(`Job ${job.id} filtered out. Only ${Math.round(matchPercentage * 100)}% of skills matched (Requires 70%). Skipping OpenAI.`);
          }
        }

        if (!hasKeywordMatch) {
          // Save a 0 score without calling OpenAI
          await this.db.insert(aiMatches).values({
            userId: user.userId,
            jobId: job.id,
            matchScore: 0,
            matchReasoning: 'Filtered out by keyword check to save AI costs. Job description does not contain at least 70% of your core skills.',
          });
          continue; // Move to the next user
        }

        await this.evaluateUserForJob(user.userId, user.skills, user.jobFilters, job);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to evaluate user ${user.userId} for job ${job.id}: ${msg}`);
      }
    }

    this.logger.log(`Completed matching evaluation for job ${jobId}`);
  }

  private async evaluateUserForJob(userId: string, skills: any, jobFilters: any, job: typeof jobs.$inferSelect) {
    const skillsText = Array.isArray(skills) ? skills.join(', ') : JSON.stringify(skills);
    
    // Convert strict user preferences into explicit constraints for the AI
    let filterConstraints = '';
    if (jobFilters) {
      filterConstraints = `
STRICT JOB PREFERENCES (MUST OBEY):
The user has provided strict filters for the jobs they will accept. 
You MUST critically evaluate the job description against these rules.
If the job violates ANY of these constraints, you MUST give a match_score of 0 and explain which constraint it failed.
Do not penalize the job if a constraint (like salary) is simply hidden or not mentioned. Only penalize if it explicitly violates the rule (e.g. states a salary lower than the minimum, or states it requires US citizenship when user doesn't have it).

USER'S HARD CONSTRAINTS:
${JSON.stringify(jobFilters, null, 2)}
      `;
    }

    const prompt = `
You are an expert technical recruiter AI. 
Evaluate how well the user's skills match the job description.

${filterConstraints}

USER SKILLS:
${skillsText}

JOB DESCRIPTION:
Title: ${job.title}
${job.description}

Output MUST be exactly in this JSON format:
{
  "match_score": number (0 to 100),
  "match_reasoning": "A concise 1-2 sentence explanation of why this score was given. If it was rejected due to a strict preference violation, state that clearly."
}
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }, // Guarantee JSON output
      temperature: 0.1, // Keep it deterministic
    });

    const outputStr = response.choices[0]?.message?.content;
    if (!outputStr) throw new Error('OpenAI returned empty response');

    const result = JSON.parse(outputStr);
    
    if (typeof result.match_score !== 'number' || typeof result.match_reasoning !== 'string') {
      throw new Error(`Invalid JSON schema returned by OpenAI: ${outputStr}`);
    }

    // Save into aiMatches table
    await this.db.insert(aiMatches).values({
      userId,
      jobId: job.id,
      matchScore: result.match_score,
      matchReasoning: result.match_reasoning,
    });

    this.logger.debug(`Saved match score ${result.match_score} for user ${userId} and job ${job.id}`);
  }
}
