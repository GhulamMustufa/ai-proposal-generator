import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { RedisService } from '../redis/redis.service';
import { DB_CONNECTION } from '../db/db.module';
import { eq, and, gte, sql } from 'drizzle-orm';
import { users, userProfiles, applications } from '../db/schema';
import { resolveJobDescription } from '../utils/job-extractor';
import OpenAI from 'openai';
import { createHash } from 'node:crypto';
import { Subject } from 'rxjs';
import puppeteer from 'puppeteer';

const MODEL = 'gpt-4o-mini';
const TEMPERATURE = 0.5;
const MAX_OUTPUT_TOKENS = 400;
const MAX_VOICE_SAMPLES = 3;
const MAX_VOICE_SAMPLE_CHARS = 600;
const MAX_JOB_DESCRIPTION_CHARS = 7000;
const OPENAI_TIMEOUT_MS = 25000;
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const PLAN_LIMITS = {
  free: { rateUser10m: 10, rateIp10m: 20, daily: 30, monthly: 300 },
  pro: { rateUser10m: 60, rateIp10m: 120, daily: 500, monthly: 5000 },
};
type PlanName = keyof typeof PLAN_LIMITS;

const PROPOSAL_SYSTEM_MESSAGE = `You are a senior freelance copywriter who writes winning proposals for freelancers and agencies. Your proposals consistently get hired because they lead with the client's problem, not the freelancer's credentials, and they feel written by a real human who read the job carefully.

WRITING RULES — follow every rule without exception:

Opening:
- Never start the proposal with the word "I". Lead with the client's situation, goal, or problem.
- Never open with "Dear", "Hello", "Hi", or any salutation.
- The first sentence must be specific to this job — not a generic confidence statement.

Voice and tone:
- Write in active voice. Avoid passive constructions.
- No em dashes. Use commas or short sentences instead.
- No buzzwords: "passionate", "dedicated", "results-driven", "detail-oriented", "synergy", "leverage", "innovative", "guru", "ninja", "rockstar".
- No robotic filler: "I am excited to apply", "I am a perfect fit", "I would love the opportunity", "hardworking", "team player".
- No bullet points or numbered lists in the output. Write in flowing paragraphs.

Content rules:
- Infer the client's top 1-2 unstated priorities from the job description, then address those directly.
- Mention only the skills and tools genuinely relevant to this specific role.
- Include one concrete outcome or implementation signal that builds credibility (a past result, a specific technical approach, or a question that proves you understand the problem).
- Do not mention the platform by name (not "Upwork", "Freelancer.com", "this platform").

Format and length:
- Plain prose only. No headings, no lists, no JSON, no preamble, no labels.
- Target 150-180 words. Hard ceiling: 200 words. Do not truncate mid-sentence — if approaching the limit, wrap up the current thought cleanly.
- End with a single low-friction call to action: a brief question, an offer of a quick call, or a clear next step. One sentence maximum.
- Return only the proposal text. Nothing else.`;

const COLD_EMAIL_SYSTEM_MESSAGE = `You are a highly effective B2B sales professional writing a concise, value-driven cold outreach email to a Hiring Manager or Founder.

WRITING RULES:
- Lead with value. Don't waste time on pleasantries.
- Subject line is NOT needed (we just want the body).
- Keep it under 150 words.
- Be highly personalized to the company and their stated problem in the job description.
- End with a low-friction call to action, like asking for a quick 10-minute chat.
- Return only the email body text.`;

@Injectable()
export class ProposalsService {
  private readonly openai: OpenAI;
  public readonly jobStatusEvents = new Subject<{ userId: string; jobId: string; status: string }>();

  constructor(
    private readonly redisService: RedisService,
    @Inject(DB_CONNECTION) private readonly db: any
  ) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  private cleanText(text: string) {
    return text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
  }

  private hashRequest(input: object) {
    return createHash('sha256').update(JSON.stringify(input)).digest('hex');
  }

  private errorResponse(res: Response, status: number, code: string, message: string, details?: any) {
    return res.status(status).json({ error: { code, message, ...(details ?? {}) } });
  }

  private buildMessages(jobDescription: string, voiceSamples: string[], profileText?: string, generationType: 'proposal' | 'cold_email' = 'proposal') {
    const parts: string[] = [];

    if (profileText) {
      parts.push(`FREELANCER PROFILE\n${profileText}`);
    }

    if (voiceSamples.length > 0) {
      const samplesText = voiceSamples
        .map((sample, i) => `[Sample ${i + 1}]\n${sample}`)
        .join('\n\n');
      parts.push(
        `VOICE AND STYLE REFERENCE\nThe samples below are from proposals this freelancer has written and been hired from. Study them to extract: sentence length patterns, how formal or casual the tone is, how they open paragraphs, and any distinctive phrasing habits. Mirror those stylistic qualities in the proposal you write. Do not copy sentences verbatim.\n\n${samplesText}`
      );
    }

    parts.push(`JOB DESCRIPTION\n${jobDescription}`);
    
    const sysMsg = generationType === 'cold_email' ? COLD_EMAIL_SYSTEM_MESSAGE : PROPOSAL_SYSTEM_MESSAGE;

    return [
      { role: 'system' as const, content: sysMsg },
      { role: 'user' as const, content: parts.join('\n\n---\n\n') },
    ];
  }

  async generateBackground(userId: string, jobDescription: string, generationType: 'proposal' | 'cold_email' = 'proposal') {
    const [profileRecord] = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    let profileText: string | undefined;
    if (profileRecord) {
      const parts: string[] = [];
      if (profileRecord.contactDetails) parts.push(`Contact: ${JSON.stringify(profileRecord.contactDetails)}`);
      if (profileRecord.skills) parts.push(`Skills: ${JSON.stringify(profileRecord.skills)}`);
      if (profileRecord.resumeText) parts.push(`Resume: ${profileRecord.resumeText}`);
      if (parts.length) profileText = parts.join('\n');
    }
    
    const messages = this.buildMessages(jobDescription, [], profileText, generationType);
    
    const response = await this.openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: TEMPERATURE,
      max_tokens: MAX_OUTPUT_TOKENS,
    });
    
    return response.choices[0]?.message?.content?.trim() ?? '';
  }

  async generate(userId: string, ipAddress: string, idempotencyKey: string | undefined, body: any, res: Response) {
    const jobDescriptionInput = body.job_description?.trim();
    const twoVariations = Boolean(body.two_variations);
    const wantsStream = Boolean(body.stream) && !twoVariations;

    if (!jobDescriptionInput) {
      return this.errorResponse(res, 400, 'BAD_REQUEST', 'job_description is required');
    }

    // Prepare voice samples
    const voiceSamples = (body.voice_samples ?? [])
      .filter((sample: any): sample is string => typeof sample === 'string')
      .map((sample: string) => this.cleanText(sample).slice(0, MAX_VOICE_SAMPLE_CHARS))
      .filter(Boolean)
      .slice(0, MAX_VOICE_SAMPLES);

    let jobDescription = '';
    try {
      const resolved = await resolveJobDescription(jobDescriptionInput, MAX_JOB_DESCRIPTION_CHARS);
      jobDescription = resolved.text;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process job description input';
      return this.errorResponse(res, 400, 'BAD_REQUEST', message);
    }

    // 1. Database Queries: Get user profile and current plan
    const [userRecord] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRecord) {
      // User must exist in the users table
      return this.errorResponse(res, 401, 'UNAUTHORIZED', 'User not found in database');
    }

    const plan: PlanName = userRecord.subscriptionStatus === 'pro' ? 'pro' : 'free';
    const planLimits = PLAN_LIMITS[plan];

    const [profileRecord] = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    let profileText: string | undefined;
    if (profileRecord) {
      const parts: string[] = [];
      if (profileRecord.contactDetails) parts.push(`Contact: ${JSON.stringify(profileRecord.contactDetails)}`);
      if (profileRecord.skills) parts.push(`Skills: ${JSON.stringify(profileRecord.skills)}`);
      if (profileRecord.resumeText) parts.push(`Resume: ${profileRecord.resumeText}`);
      if (parts.length) profileText = parts.join('\n');
    }

    // 2. Rate Limiting via Redis
    const userRateKey = `rate:user:${userId}`;
    const ipRateKey = `rate:ip:${ipAddress}`;
    
    // Check 10 minute windows (600 seconds)
    const [userAllowed, ipAllowed] = await Promise.all([
      this.redisService.checkRateLimit(userRateKey, planLimits.rateUser10m, 600),
      this.redisService.checkRateLimit(ipRateKey, planLimits.rateIp10m, 600)
    ]);

    if (!userAllowed || !ipAllowed) {
      return this.errorResponse(res, 429, 'RATE_LIMITED', 'Rate limit exceeded', {
        limit_user_10m: planLimits.rateUser10m,
        limit_ip_10m: planLimits.rateIp10m,
      });
    }

    // 3. Check Quotas via Postgres Applications table
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyUsage] = await this.db.select({ count: sql<number>\`cast(count(*) as integer)\` })
      .from(applications)
      .where(and(eq(applications.userId, userId), gte(applications.createdAt, dayStart)));

    const [monthlyUsage] = await this.db.select({ count: sql<number>\`cast(count(*) as integer)\` })
      .from(applications)
      .where(and(eq(applications.userId, userId), gte(applications.createdAt, monthStart)));

    const dailyCount = dailyUsage?.count ?? 0;
    const monthlyCount = monthlyUsage?.count ?? 0;

    if (dailyCount >= planLimits.daily || monthlyCount >= planLimits.monthly) {
      return this.errorResponse(res, 402, 'PLAN_QUOTA_EXCEEDED', 'Daily or monthly usage cap reached', {
        daily_limit: planLimits.daily,
        monthly_limit: planLimits.monthly,
        daily_used: dailyCount,
        monthly_used: monthlyCount,
      });
    }

    // 4. Check Redis Caches (Idempotency and Request Hash)
    const cacheInput = {
      prompt_version: 5,
      job_description: jobDescription,
      voice_samples: voiceSamples,
      two_variations: twoVariations,
      model: MODEL,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
    };
    const requestHash = this.hashRequest(cacheInput);

    if (idempotencyKey) {
      const idemCacheStr = await this.redisService.get(`idem:${idempotencyKey}:${userId}`);
      if (idemCacheStr) {
        const idemCache = JSON.parse(idemCacheStr);
        return res.json({
          generated_proposal: idemCache.generated_proposal,
          proposal_id: idemCache.proposal_id,
          user_profile: profileRecord,
          cached: true,
          cache_type: 'idempotency',
        });
      }
    }

    const hashCacheStr = await this.redisService.get(`hash:${requestHash}:${userId}`);
    if (hashCacheStr) {
      const hashCache = JSON.parse(hashCacheStr);
      return res.json({
        generated_proposal: hashCache.generated_proposal,
        proposal_id: hashCache.proposal_id,
        user_profile: profileRecord,
        cached: true,
        cache_type: 'request_hash',
      });
    }

    const messages = this.buildMessages(jobDescription, voiceSamples, profileText);
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), OPENAI_TIMEOUT_MS);

    // 5. Streaming Path
    if (wantsStream) {
      let openaiStream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      try {
        openaiStream = await this.openai.chat.completions.create(
          {
            model: MODEL,
            messages,
            temperature: TEMPERATURE,
            max_tokens: MAX_OUTPUT_TOKENS,
            stream: true,
          },
          { signal: abortController.signal }
        );
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          return this.errorResponse(res, 503, 'UPSTREAM_TIMEOUT', 'Generation timed out. Please retry.');
        }
        return this.errorResponse(res, 503, 'UPSTREAM_FAILURE', 'OpenAI request failed');
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('X-Accel-Buffering', 'no');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders();

      let fullText = '';
      try {
        for await (const chunk of openaiStream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) {
            fullText += text;
            res.write(text);
          }
        }
      } catch (error) {
        // Stream interrupted
        res.end();
        return;
      } finally {
        clearTimeout(timeoutId);
      }

      const finalText = fullText.trim();

      // Save to Drizzle Applications table
      try {
        const [savedApp] = await this.db.insert(applications).values({
          userId,
          jobDescription,
          jobTitle: body.job_title?.trim() || null,
          jobLink: body.job_link?.trim() || null,
          generatedProposal: finalText,
          status: 'generated',
        }).returning({ id: applications.id });

        if (savedApp) {
          const cacheData = JSON.stringify({ generated_proposal: finalText, proposal_id: savedApp.id });
          await Promise.all([
            this.redisService.set(`hash:${requestHash}:${userId}`, cacheData, CACHE_TTL_SECONDS),
            idempotencyKey ? this.redisService.set(`idem:${idempotencyKey}:${userId}`, cacheData, CACHE_TTL_SECONDS) : Promise.resolve()
          ]);
          res.write(\`\\n\\n[DONE:\${JSON.stringify({ proposal_id: savedApp.id })}]\`);
        }
      } catch (e) {
        // Ignore DB save errors to not break the successful stream
      }

      res.end();
      return;
    }

    // 6. Non-Streaming Path (two variations)
    let generatedProposal = '';
    try {
      if (twoVariations) {
        const [variationA, variationB] = await Promise.all([
          this.generateSingleProposal(messages, abortController.signal, "Write in a direct, confident register. Lead immediately with the core value you bring to this specific problem. Tone: professional but not stiff — like an expert who doesn't need to oversell."),
          this.generateSingleProposal(messages, abortController.signal, "Write in a warmer, more conversational register. Acknowledge the client's situation first before pivoting to your approach. Tone: collegial — like a trusted colleague who gets the problem and has done this before.")
        ]);
        generatedProposal = \`Variation A (Direct):\\n\${variationA}\\n\\nVariation B (Conversational):\\n\${variationB}\`;
      } else {
        generatedProposal = await this.generateSingleProposal(messages, abortController.signal);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return this.errorResponse(res, 503, 'UPSTREAM_TIMEOUT', 'Generation timed out. Please retry.');
      }
      return this.errorResponse(res, 503, 'UPSTREAM_FAILURE', 'OpenAI request failed');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!generatedProposal) {
      return this.errorResponse(res, 503, 'UPSTREAM_FAILURE', 'Failed to generate proposal');
    }

    try {
      const [savedApp] = await this.db.insert(applications).values({
        userId,
        jobDescription,
        jobTitle: body.job_title?.trim() || null,
        jobLink: body.job_link?.trim() || null,
        generatedProposal,
        status: 'generated',
      }).returning({ id: applications.id });

      const cacheData = JSON.stringify({ generated_proposal: generatedProposal, proposal_id: savedApp.id });
      await Promise.all([
        this.redisService.set(`hash:${requestHash}:${userId}`, cacheData, CACHE_TTL_SECONDS),
        idempotencyKey ? this.redisService.set(`idem:${idempotencyKey}:${userId}`, cacheData, CACHE_TTL_SECONDS) : Promise.resolve()
      ]);

      return res.json({
        generated_proposal: generatedProposal,
        proposal_id: savedApp.id,
        user_profile: profileRecord,
        cached: false,
        meta: { model: MODEL, plan }
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return this.errorResponse(res, 503, 'STORAGE_FAILURE', \`Failed to save proposal: \${message}\`);
    }
  }

  private async generateSingleProposal(messages: any[], signal: AbortSignal, variationInstruction?: string) {
    const finalMessages = variationInstruction 
      ? messages.map((m, i) => i === messages.length - 1 ? { ...m, content: \`\${m.content}\\n\\n\${variationInstruction}\` } : m) 
      : messages;

    const response = await this.openai.chat.completions.create(
      {
        model: MODEL,
        messages: finalMessages,
        temperature: TEMPERATURE,
        max_tokens: MAX_OUTPUT_TOKENS,
      },
      { signal }
    );
    return response.choices[0]?.message?.content?.trim() ?? '';
  }

  async getProposal(userId: string, proposalId: string) {
    const [proposal] = await this.db
      .select()
      .from(applications)
      .where(and(eq(applications.id, proposalId), eq(applications.userId, userId)))
      .limit(1);
    return proposal;
  }

  async updateProposal(userId: string, proposalId: string, updatedText: string) {
    const [updated] = await this.db
      .update(applications)
      .set({ generatedProposal: updatedText })
      .where(and(eq(applications.id, proposalId), eq(applications.userId, userId)))
      .returning();
    return updated;
  }

  async generatePdf(userId: string, proposalId: string, res: Response) {
    const proposal = await this.getProposal(userId, proposalId);
    if (!proposal || !proposal.generatedProposal) {
      return this.errorResponse(res, 404, 'NOT_FOUND', 'Proposal not found');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Proposal - ${proposal.jobTitle || 'Job'}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
          }
          h1 {
            color: #1a202c;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            font-size: 24px;
          }
          .content {
            margin-top: 30px;
            font-size: 14px;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 50px;
            font-size: 10px;
            color: #718096;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Proposal for ${proposal.jobTitle || 'Confidential Role'}</h1>
        <div class="content">${proposal.generatedProposal}</div>
        <div class="footer">Generated via AI Proposal Generator</div>
      </body>
      </html>
    `;

    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      });
      
      await browser.close();

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposal-${proposalId}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      return this.errorResponse(res, 500, 'PDF_ERROR', 'Failed to generate PDF');
    }
  }
}
