import { test, expect } from './extension.fixture';
import * as path from 'path';

// Define the 20 websites and their mock HTML payloads
const SITES = [
  { name: 'Upwork', url: 'https://www.upwork.com/jobs/fake', titleSelector: 'h1[data-test="job-title"]', descSelector: 'div[data-test="description"]' },
  { name: 'SmartRecruiters', url: 'https://jobs.smartrecruiters.com/fake/123', titleSelector: 'h1', descSelector: '.job-description' },
  { name: 'Jobstreet', url: 'https://www.jobstreet.com/job/fake', titleSelector: 'h1[data-automation="job-detail-title"]', descSelector: '[data-automation="jobDescription"]' },
  { name: 'Greenhouse', url: 'https://boards.greenhouse.io/fake', titleSelector: 'h1', descSelector: '#content' },
  { name: 'Lever', url: 'https://jobs.lever.co/fake', titleSelector: 'h1', descSelector: '.content' },
  { name: 'Workable', url: 'https://apply.workable.com/fake', titleSelector: 'h1', descSelector: '.job-description' },
  { name: 'Breezy HR', url: 'https://fake.breezy.hr/p/123', titleSelector: 'h1', descSelector: '.description' },
  { name: 'Ashby HQ', url: 'https://jobs.ashbyhq.com/fake', titleSelector: 'h1', descSelector: '.description' },
  { name: 'AngelList', url: 'https://wellfound.com/jobs/fake', titleSelector: 'h1', descSelector: '.styles_description__b0b_q' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/view/123', titleSelector: '.top-card-layout__title', descSelector: '.description__text' },
  { name: 'Indeed', url: 'https://www.indeed.com/viewjob?jk=123', titleSelector: '.jobsearch-JobInfoHeader-title', descSelector: '#jobDescriptionText' },
  { name: 'ZipRecruiter', url: 'https://www.ziprecruiter.com/jobs/fake', titleSelector: 'h1', descSelector: '.jobDescription' },
  { name: 'Monster', url: 'https://www.monster.com/job/fake', titleSelector: 'h1', descSelector: '.description' },
  { name: 'Glassdoor', url: 'https://www.glassdoor.com/job/fake', titleSelector: 'h1', descSelector: '.desc' },
  { name: 'Dice', url: 'https://www.dice.com/job/fake', titleSelector: 'h1', descSelector: '.description' },
  { name: 'Fiverr', url: 'https://www.fiverr.com/gig/fake', titleSelector: 'h1', descSelector: '.description' },
  { name: 'Freelancer', url: 'https://www.freelancer.com/projects/fake', titleSelector: '.ProjectView-projectTitle', descSelector: '.ProjectView-description' },
  { name: 'Toptal', url: 'https://www.toptal.com/jobs/fake', titleSelector: 'h1.job-title', descSelector: '.job-description' },
  { name: 'Remote.co', url: 'https://remote.co/job/fake', titleSelector: 'h1', descSelector: '.job_description' },
  { name: 'We Work Remotely', url: 'https://weworkremotely.com/remote-jobs/fake', titleSelector: '.listing-header h1', descSelector: '.listing-container' }
];

test.describe('PitchPilot Extension E2E (20 Websites)', () => {
  // Use a longer timeout because extensions take time to load and OpenAI takes time to generate
  test.setTimeout(60000);

  for (const site of SITES) {
    test(`Generates proposal on ${site.name}`, async ({ page, extensionId }) => {
      // Intercept the request to avoid hitting real job boards and getting blocked
      await page.route(site.url, async (route) => {
        const titleClassAttr = site.titleSelector.includes('.') ? `class="${site.titleSelector.replace('.', '')}"` : '';
        const titleDataAttr = site.titleSelector.includes('[') ? site.titleSelector.match(/\\[(.*?)\\]/)?.[1] || '' : '';
        
        const descClassAttr = site.descSelector.includes('.') ? `class="${site.descSelector.replace('.', '')}"` : '';
        const descDataAttr = site.descSelector.includes('[') ? site.descSelector.match(/\\[(.*?)\\]/)?.[1] || '' : '';
        const descIdAttr = site.descSelector.includes('#') ? `id="${site.descSelector.replace('#', '')}"` : '';

        const mockHTML = `
          <!DOCTYPE html>
          <html>
            <head><title>${site.name} Mock Job</title></head>
            <body>
              <!-- Using raw tags for Universal Fallback support if specific extractors fail -->
              <h1 ${titleClassAttr} ${titleDataAttr}>Senior ${site.name} Developer</h1>
              <div ${descClassAttr} ${descDataAttr} ${descIdAttr} class="job-description">
                We are looking for an experienced developer for ${site.name}. 
                Must have 5+ years of experience with TypeScript and Node.js.
                Please apply with your cover letter.
                This is a remote position with flexible working hours. We value strong communication skills and the ability to work independently. 
                You will be responsible for architecting and building highly scalable web applications, integrating with various third-party APIs, and collaborating closely with our design and product teams to deliver exceptional user experiences.
              </div>
              <textarea name="cover_letter" id="cover" placeholder="Cover Letter"></textarea>
            </body>
          </html>
        `;
        await route.fulfill({ contentType: 'text/html', body: mockHTML });
      });

      // 1. Navigate to the intercepted URL
      await page.goto(site.url);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000); // Give content script time to run at document_idle

      // 2. Open the extension popup
      const popupPage = await page.context().newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

      // 3. Verify it detects the job
      await expect(popupPage.locator('#job-badge')).toBeVisible({ timeout: 5000 });
      
      // 4. Click generate
      await popupPage.locator('#btn-generate').click();

      // 5. Verify the API generates a response (Proposal ready)
      await expect(popupPage.locator('.badge-green')).toBeVisible({ timeout: 30000 });
      
      // 6. Verify text was populated in the popup
      const generatedText = await popupPage.locator('#result-text').innerText();
      expect(generatedText.length).toBeGreaterThan(50);
      
      await popupPage.close();
    });
  }
});
