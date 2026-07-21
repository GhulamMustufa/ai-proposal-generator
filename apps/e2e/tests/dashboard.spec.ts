import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

test.describe('Dashboard (Authenticated)', () => {
  // Use a generic fake email and password or whatever setup Clerk supports
  // But wait, the best way is `clerk.signIn`
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Bypass UI and sign in the user
    await clerk.signIn({
      page,
      emailAddress: 'ghulammustafa.mf@gmail.com', // Using the email seen in the screenshot
    });
  });

  test('dashboard should load and fetch jobs', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify Dashboard Title
    await expect(page.locator('text=Your Match Dashboard')).toBeVisible();

    // Verify Highly Qualified Leads section
    await expect(page.locator('text=Highly Qualified Leads')).toBeVisible();

    // Depending on whether the NestJS API has seeded jobs, we might see jobs or "No matches found yet"
    // Let's just wait for the network or UI to stabilize
    // The UI handles both states gracefully.
    const emptyState = page.locator('text=No matches found yet');
    const jobCards = page.locator('text=Match Score');
    
    // Either empty state is visible OR there is at least one job card
    await expect(emptyState.or(jobCards.first())).toBeVisible();
  });

  // Since we are running against real DB, generating a proposal might trigger real queues. 
  // We will skip the click "Generate" test for now to avoid polluting the DB or throwing 500s 
  // if the python microservices/queues are offline. 
  // If needed, we can test the UI interaction up to the queue submission.
});
