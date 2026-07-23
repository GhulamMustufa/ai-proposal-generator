import { Injectable, Inject, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { applications, userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { chromium } from 'playwright';

@Injectable()
export class SubmitterService {
  private readonly logger = new Logger(SubmitterService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  /**
   * Automates the submission of a job application on Lever.
   * Fetches the generated PDF from the Cloudinary URL and uploads it via Playwright.
   */
  async submitApplication(
    applicationId: string,
    userId: string,
    jobId: string,
  ) {
    this.logger.log(
      `Starting automated submission for application ${applicationId}`,
    );

    const logs: string[] = [];
    const addLog = (msg: string) => {
      this.logger.log(msg);
      logs.push(`[${new Date().toISOString()}] ${msg}`);
    };

    try {
      // 1. Fetch Application and Contact Details
      const [app] = await this.db
        .select()
        .from(applications)
        .where(eq(applications.id, applicationId))
        .limit(1);
      if (!app) throw new Error('Application not found');
      if (!app.jobLink) throw new Error('Application missing job link');
      if (!app.pdfUrl) throw new Error('Application missing PDF URL');

      const [profile] = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      if (!profile || !profile.contactDetails)
        throw new Error('User profile missing contact details');

      const contact = profile.contactDetails;
      const fullName =
        `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      if (!fullName || !contact.email)
        throw new Error('First Name, Last Name, and Email are required');

      // 2. Fetch PDF Buffer from Cloudinary (remote URL)
      addLog(`Fetching PDF from ${app.pdfUrl}`);
      const pdfRes = await fetch(app.pdfUrl);
      if (!pdfRes.ok)
        throw new Error(`Failed to fetch PDF: ${pdfRes.statusText}`);
      const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

      // 3. Launch Playwright
      addLog('Launching headless Chromium...');
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        let applyUrl = app.jobLink;
        if (!applyUrl.endsWith('/apply')) {
          applyUrl = applyUrl.endsWith('/')
            ? `${applyUrl}apply`
            : `${applyUrl}/apply`;
        }

        addLog(`Navigating to Lever apply page: ${applyUrl}`);
        await page.goto(applyUrl, { waitUntil: 'domcontentloaded' });

        // 4. Fill Form Fields
        addLog('Filling contact details...');
        // Standard Lever inputs
        await page
          .fill('input[name="name"]', fullName)
          .catch(() => addLog('Name field not found'));
        await page
          .fill('input[name="email"]', contact.email)
          .catch(() => addLog('Email field not found'));

        if (contact.phone) {
          await page
            .fill('input[name="phone"]', contact.phone)
            .catch(() => addLog('Phone field not found'));
        }

        if (contact.linkedin) {
          await page
            .fill('input[name="urls[LinkedIn]"]', contact.linkedin)
            .catch(() => addLog('LinkedIn field not found'));
        }

        // 5. Upload Resume
        addLog('Injecting PDF resume buffer into file input...');
        const fileInput = page.locator('input[type="file"][name="resume"]');
        await fileInput.setInputFiles({
          name: `Resume_${contact.firstName || 'Candidate'}.pdf`,
          mimeType: 'application/pdf',
          buffer: pdfBuffer,
        });

        // 6. Submit Application
        addLog('Clicking submit button...');
        const submitBtn = page.locator(
          'button.postings-btn.template-btn-submit',
        );
        await submitBtn
          .click()
          .catch(() => addLog('Submit button not clicked'));

        // Wait for potential redirect or success message
        addLog('Waiting for success confirmation network idle...');
        await page
          .waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 })
          .catch(() =>
            addLog(
              'No navigation detected after submit (this may be normal depending on the ATS).',
            ),
          );

        addLog('Application successfully submitted via Playwright.');

        // Update status in Drizzle
        await this.db
          .update(applications)
          .set({ status: 'submitted', submissionLogs: logs })
          .where(eq(applications.id, applicationId));
      } finally {
        await browser.close();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addLog(`ERROR: ${msg}`);

      // Update status to failed
      await this.db
        .update(applications)
        .set({ status: 'failed', submissionLogs: logs })
        .where(eq(applications.id, applicationId));

      // Re-throw so BullMQ knows the job failed and can retry if configured
      throw error;
    }
  }
}
