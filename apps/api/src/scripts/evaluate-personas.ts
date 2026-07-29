import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DB_CONNECTION } from '../db/db.module';
import { personas, jobs } from '../db/schema';
import { MatcherService } from '../matcher/matcher.service';
import { BUILT_IN_PERSONAS } from '../../../web/src/lib/built-in-personas';
import OpenAI from 'openai';
import * as crypto from 'crypto';
import { isNotNull, desc } from 'drizzle-orm';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const db = app.get(DB_CONNECTION);
  const matcherService = app.get(MatcherService);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  console.log('Starting Persona Evaluation Script...');
  const results = [];

  // 1. Fetch some jobs to evaluate against (e.g. top 20 latest jobs)
  console.log('Fetching latest jobs from DB...');
  const latestJobs = await db.select().from(jobs).where(isNotNull(jobs.description)).orderBy(desc(jobs.scrapedAt)).limit(20);
  
  if (latestJobs.length === 0) {
      console.log('No jobs found in the database. Please run the scrapers first.');
      process.exit(1);
  }
  
  console.log(`Evaluating against ${latestJobs.length} jobs.`);

  for (const template of BUILT_IN_PERSONAS) {
    console.log(`\n================================`);
    console.log(`Evaluating Persona: ${template.name}`);
    console.log(`================================`);
    
    // Evaluate the persona against the latest jobs using the same prompt logic from MatcherService
    // Since we don't want to actually spam the database with dummy matches, we'll just run the prompt directly here.
    
    const skillsText = Array.isArray(template.skills) ? template.skills.join(', ') : JSON.stringify(template.skills);
    
    let totalScore = 0;
    let highMatches = 0;
    const scores = [];
    
    for (const job of latestJobs) {
      const prompt = `
You are an expert technical recruiter AI. 
Evaluate how well the user's Persona matches the job description.

PERSONA DETAILS:
Role Name: ${template.name}
Years of Experience: ${template.yearsOfExperience || 'Not specified'}

USER SKILLS:
${skillsText}

USER RESUME EXTRACT:
${template.resumeText || 'No resume text provided.'}

JOB DESCRIPTION:
Title: ${job.title}
Company: ${job.company}
${job.description.substring(0, 2000)} // Truncated to save tokens for test

Analyze the Job Description against the Persona's skills, experience, and resume.
Determine a match score from 0 to 100 based on how qualified this persona is for this job.

CRITICAL INSTRUCTIONS:
- Give a very high score (85-100) if the core skills, experience level, and role match closely.
- Give a moderate score (50-84) if they meet the basic requirements but lack some desired skills.
- Give a low score (0-49) if the persona is clearly unqualified, lacks core required skills, or if the seniority level is a complete mismatch.

Output MUST be exactly in this JSON format:
{
  "match_score": number (0 to 100),
  "match_reasoning": "A concise 1-2 sentence explanation of why this score was given."
}
`;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });
        
        const outputStr = response.choices[0]?.message?.content;
        const result = JSON.parse(outputStr || '{}');
        
        const score = result.match_score || 0;
        scores.push({ jobTitle: job.title, score, reason: result.match_reasoning });
        
        totalScore += score;
        if (score >= 75) highMatches++;
        
        console.log(`- Job: ${job.title} | Score: ${score}`);
        
      } catch (err) {
        console.error(`Error scoring job ${job.title}:`, err.message);
      }
    }
    
    const avgScore = totalScore / latestJobs.length;
    console.log(`\nResults for ${template.name}:`);
    console.log(`Average Score: ${avgScore.toFixed(2)}`);
    console.log(`High Matches (>=75): ${highMatches} / ${latestJobs.length}`);
    
    results.push({
      persona: template.name,
      avgScore: avgScore.toFixed(2),
      highMatches,
      sampleMatch: scores.sort((a,b) => b.score - a.score)[0] // Best match
    });
  }
  
  // Write report
  const reportPath = 'persona_evaluation_report.md';
  let reportMd = `# Persona AI Matching Evaluation Report\n\n`;
  reportMd += `Evaluated ${BUILT_IN_PERSONAS.length} personas against the latest ${latestJobs.length} jobs in the database using GPT-4o-mini.\n\n`;
  
  for (const r of results) {
      reportMd += `## ${r.persona}\n`;
      reportMd += `- **Average Score:** ${r.avgScore}\n`;
      reportMd += `- **High Matches (>=75):** ${r.highMatches}\n`;
      if (r.sampleMatch) {
          reportMd += `- **Best Match:** ${r.sampleMatch.jobTitle} (Score: ${r.sampleMatch.score})\n`;
          reportMd += `  - *Reasoning:* ${r.sampleMatch.reason}\n`;
      }
      reportMd += `\n`;
  }
  
  fs.writeFileSync(reportPath, reportMd);
  console.log(`\nEvaluation complete! Report saved to ${reportPath}`);
  
  await app.close();
  process.exit(0);
}

bootstrap();
