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
        
        // Cost-Reduction: Only send to OpenAI if at least 3 of the user's skills are found in the job description
        let hasKeywordMatch = true;
        
        if (userSkills.length > 0) {
          const matchedSkills = userSkills.filter((skill: any) => {
            const skillStr = String(skill).toLowerCase();
            // Escape regex characters
            let pattern = skillStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Make .js suffixes interchangeable with 'js' and ' js'
            pattern = pattern.replace(/\\\.(js)/g, '(?:\\.js|js|\\sjs)');
            // Allow spaces or dashes to be interchangeable
            pattern = pattern.replace(/[- ]/g, '[- ]?');
            
            const regex = new RegExp(`\\b${pattern}\\b`, 'i');
            return regex.test(jobText);
          });
          
          if (matchedSkills.length < 3) {
            hasKeywordMatch = false;
            this.logger.debug(`Job ${job.id} filtered out. Only matched ${matchedSkills.length} skills (Requires at least 3). Skipping OpenAI.`);
            
            await this.db.insert(aiMatches).values({
              userId: user.userId,
              jobId: job.id,
              matchScore: 0,
              matchReasoning: 'Filtered out by keyword check. Job description does not contain at least 3 of your core skills.',
            });
            continue; // Move to the next user
          }
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
    
    // Convert user preferences into preferred criteria for the AI (instead of strict constraints)
    let filterConstraints = '';
    if (jobFilters) {
      filterConstraints = `
USER PREFERENCES (BONUS POINTS):
The user has provided preferences for the jobs they want (e.g., equity, specific salary). 
Treat these as "Nice to Haves". If the job mentions these, boost the match_score higher!
Do NOT penalize or reject the job (do not give a 0) if a preference is simply not mentioned. Most job descriptions hide these details.
Only reduce the score slightly if the job explicitly contradicts a preference (e.g., states a salary significantly lower than requested).

USER'S PREFERENCES:
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

  /**
   * Re-evaluates a specific user against all existing jobs.
   * Useful when a user updates their skills or job preferences.
   */
  async reEvaluateUser(userId: string) {
    this.logger.log(`Starting full re-evaluation for user ${userId}`);

    // Fetch user profile
    const [user] = await this.db
      .select({ skills: userProfiles.skills, jobFilters: userProfiles.jobFilters })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!user || !user.skills || (Array.isArray(user.skills) && user.skills.length === 0)) {
      this.logger.warn(`User ${userId} has no skills configured. Skipping matching.`);
      return;
    }

    // Delete existing matches to prevent duplicates
    await this.db.delete(aiMatches).where(eq(aiMatches.userId, userId));
    this.logger.log(`Deleted old matches for user ${userId}`);

    // Fetch all jobs
    const allJobs = await this.db.select().from(jobs);
    this.logger.log(`Re-evaluating ${allJobs.length} jobs for user ${userId}...`);

    for (const job of allJobs) {
      try {
        const userSkills = Array.isArray(user.skills) ? user.skills : [];
        const jobText = `${job.title} ${job.description}`.toLowerCase();
        
        let hasKeywordMatch = true;
        
        if (userSkills.length > 0) {
          const matchedSkills = userSkills.filter((skill: any) => {
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
            userId,
            jobId: job.id,
            matchScore: 0,
            matchReasoning: 'Filtered out by keyword check. Job description does not contain at least 3 of your core skills.',
          });
          continue;
        }

        await this.evaluateUserForJob(userId, user.skills, user.jobFilters, job);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to evaluate user ${userId} for job ${job.id}: ${msg}`);
      }
    }

    this.logger.log(`Completed full re-evaluation for user ${userId}`);
  }
}
