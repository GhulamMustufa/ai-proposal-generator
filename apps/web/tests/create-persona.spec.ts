import { test, expect } from '@playwright/test';

// Make sure to replace these with your actual test account credentials for Clerk
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

test('create backend developer persona', async ({ page }) => {
  // 1. Navigate to the application
  await page.goto('http://localhost:3000/sign-in');

  // 2. Login via Clerk
  // Note: If you are using Clerk's bot protection, this might require @clerk/testing setup.
  // Assuming a standard development environment login flow:
  await page.waitForSelector('input[type="email"]', { state: 'visible' });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button:has-text("Continue")');
  
  await page.waitForSelector('input[type="password"]', { state: 'visible' });
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("Continue")');

  // 3. Wait for redirect to dashboard
  await page.waitForURL('**/dashboard');

  // 4. Navigate to Personas page
  await page.goto('http://localhost:3000/personas');

  // 5. Click "Create Persona" button (assuming there's a button to open the form)
  await page.click('text="Create Persona"');
  
  // Wait for the form to load
  await page.waitForSelector('#persona-name', { state: 'visible' });

  // 6. Fill out the Backend Developer Persona form
  await page.fill('#persona-name', 'Senior Backend Developer');
  
  // Fill out skills
  await page.fill('#persona-skills', 'Node.js, NestJS, PostgreSQL, Redis, TypeScript, Docker, AWS');

  // Fill out years of experience
  await page.fill('#persona-experience', '5');

  // Fill out ideal salary
  await page.fill('#persona-ideal-salary', '150000');

  // Fill out resume text
  await page.fill('#persona-resume', 'Experienced Backend Engineer with 5+ years of experience building scalable microservices in Node.js and NestJS. Expert in database design with PostgreSQL and caching with Redis.');

  // 7. Submit the form
  await page.click('button[type="submit"]');

  // 8. Verify it was created (e.g. check for success toast or redirection)
  await expect(page.locator('text=Persona created successfully').first()).toBeVisible({ timeout: 5000 });
});
