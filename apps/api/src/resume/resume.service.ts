import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { userProfiles, personas, jobs, applications } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import OpenAI from 'openai';
import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);
  private readonly openai: OpenAI;

  constructor(
    @Inject(DB_CONNECTION) private readonly db: any,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({ apiKey: configService.get('OPENAI_API_KEY') });

    // Cloudinary reads process.env.CLOUDINARY_URL automatically if configured like this
    const cloudinaryUrl = configService.get('CLOUDINARY_URL');
    if (cloudinaryUrl) {
      cloudinary.config(true);
    }
  }

  async generateResume(userId: string, jobId: string, personaId?: string): Promise<string> {
    this.logger.log(
      `Generating tailored resume for user ${userId} and job ${jobId}`,
    );

    // 1. Fetch Job and User Profile
    const [job] = await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);
    if (!job) throw new NotFoundException('Job not found');

    let profileContext: any = null;
    
    if (personaId) {
      const [persona] = await this.db
        .select()
        .from(personas)
        .where(and(eq(personas.id, personaId), eq(personas.userId, userId)))
        .limit(1);
      
      if (persona && persona.resumeText) {
        profileContext = persona;
      }
    }

    if (!profileContext) {
      const [profile] = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
        
      if (!profile || !profile.resumeText) {
        throw new BadRequestException('User does not have a base resume on file');
      }
      profileContext = profile;
    }

    // 2. OpenAI Tailoring
    this.logger.log('Tailoring resume with OpenAI...');
    const resumeData = await this.tailorResumeWithAI(profileContext, job);

    // 3. Generate PDF Buffer via Puppeteer
    this.logger.log('Rendering HTML to PDF buffer...');
    const pdfBuffer = await this.renderPdfBuffer(resumeData);

    // 4. Upload to Cloudinary
    this.logger.log('Uploading PDF to Cloudinary...');
    const publicId = `resume_${userId}_${job.id}_${Date.now()}`;
    const pdfUrl = await this.uploadToCloudinary(pdfBuffer, publicId);

    // 5. Save to Applications table
    this.logger.log('Saving application record...');
    await this.db.insert(applications).values({
      userId,
      jobId: job.id,
      pdfUrl,
      status: 'generated', // Indicates resume generated, pending submission
    });

    this.logger.log(`Successfully generated resume PDF: ${pdfUrl}`);
    return pdfUrl;
  }

  private async tailorResumeWithAI(
    profile: any,
    job: typeof jobs.$inferSelect,
  ) {
    const prompt = `
You are an expert resume writer.
Rewrite the user's base resume to be highly tailored for the following job description.
Keep the formatting professional and ATS-friendly. Focus the bullet points on achievements relevant to the job.

USER'S BASE RESUME:
${profile.resumeText}

USER CONTACT INFO:
${JSON.stringify(profile.contactDetails || {})}

TARGET JOB DESCRIPTION:
Title: ${job.title}
Company: ${job.company}
${job.description}

Output MUST be exactly in this JSON format:
{
  "name": "Full Name",
  "contact": "Email | Phone | LinkedIn",
  "summary": "A 2-3 sentence professional summary tailored to the job.",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "dates": "Start Date - End Date",
      "bullets": ["Bullet 1", "Bullet 2"]
    }
  ],
  "skills": ["Skill 1", "Skill 2"]
}
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o as requested for complex resume rewriting
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Low temperature for consistent formatting
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Failed to generate tailored resume');
    return JSON.parse(content);
  }

  private generateHtmlTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #222;
            margin: 0;
            padding: 0;
          }
          h1 {
            font-size: 24pt;
            margin-bottom: 5px;
            color: #000;
            text-align: center;
          }
          .contact-info {
            font-size: 10pt;
            color: #555;
            margin-bottom: 20px;
            text-align: center;
          }
          .section-title {
            font-size: 13pt;
            font-weight: bold;
            color: #111;
            margin-top: 15px;
            margin-bottom: 5px;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            text-transform: uppercase;
          }
          .job-title {
            font-weight: bold;
            font-size: 11.5pt;
          }
          .company {
            font-style: italic;
            color: #333;
          }
          .dates {
            float: right;
            color: #555;
            font-size: 10pt;
          }
          .exp-header {
            margin-bottom: 3px;
            margin-top: 10px;
          }
          ul {
            margin-top: 3px;
            padding-left: 18px;
          }
          li {
            margin-bottom: 4px;
            text-align: justify;
          }
          p {
            margin-top: 5px;
            text-align: justify;
          }
        </style>
      </head>
      <body>
        <h1>${data.name || 'Professional Resume'}</h1>
        <div class="contact-info">
          ${data.contact || ''}
        </div>
        
        <div class="section-title">Professional Summary</div>
        <p>${data.summary || ''}</p>

        <div class="section-title">Experience</div>
        ${(data.experience || [])
          .map(
            (exp: any) => `
          <div class="exp-header">
            <span class="job-title">${exp.title}</span>, <span class="company">${exp.company}</span>
            <span class="dates">${exp.dates}</span>
          </div>
          <ul>
            ${(exp.bullets || []).map((bullet: string) => `<li>${bullet}</li>`).join('')}
          </ul>
        `,
          )
          .join('')}
        
        <div class="section-title">Technical Skills</div>
        <p>${(data.skills || []).join(' • ')}</p>
      </body>
      </html>
    `;
  }

  private async renderPdfBuffer(resumeData: any): Promise<Buffer> {
    const html = this.generateHtmlTemplate(resumeData);

    // Launch headless Chromium via Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.75in',
          right: '0.75in',
          bottom: '0.75in',
          left: '0.75in',
        },
      });

      return Buffer.from(pdfUint8Array);
    } finally {
      await browser.close();
    }
  }

  private uploadToCloudinary(
    buffer: Buffer,
    publicId: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Cloudinary upload stream for raw buffers (like PDF)
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'ai-resumes',
          public_id: publicId,
          format: 'pdf',
          resource_type: 'raw', // 'raw' is appropriate for standard PDF downloads
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('No result from Cloudinary'));
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }
}
