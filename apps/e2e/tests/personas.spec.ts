import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

test.describe('Personas Flow', () => {
  // Sign in before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clerk.signIn({
      page,
      emailAddress: 'ghulammustafa.mf@gmail.com', // Fake or real dev user
    });
  });

  test('should create a persona and show it in the dashboard dropdown', async ({ page }) => {
    // 1. Navigate to Personas page
    await page.goto('/personas');
    await expect(page.locator('h1', { hasText: 'Personas' })).toBeVisible();

    // 2. Click "+ New Persona" button
    await page.getByRole('button', { name: '+ New Persona' }).click();

    // 3. Fill out the form
    const uniquePersonaName = `Playwright E2E Persona ${Date.now()}`;
    await page.getByLabel(/Persona Name/i).fill(uniquePersonaName);
    await page.getByLabel(/Skills/i).fill('Playwright, E2E Testing, Automation');
    await page.getByLabel(/Ideal Salary/i).fill('$150,000/yr');
    await page.getByLabel(/Years of Experience/i).fill('5');
    await page.getByLabel(/Resume Details/i).fill('I am a bot testing this flow.');

    // 4. Submit the form
    await page.getByRole('button', { name: 'Save Persona' }).click();

    // 5. Verify it appears in the list
    await expect(page.locator('h3', { hasText: uniquePersonaName })).toBeVisible();

    // 6. Navigate to Dashboard
    await page.goto('/dashboard');
    await expect(page.locator('h1', { hasText: 'Your Match Dashboard' })).toBeVisible();

    // 7. Open the Manual Job Entry form (if it's an accordion or always visible)
    // Looking at ManualJobEntry, it renders the select if personas.length > 0
    // Wait for the dropdown to appear
    const personaSelect = page.locator('select').first();
    await expect(personaSelect).toBeVisible();

    // Verify our new persona is an option
    const options = await personaSelect.locator('option').allInnerTexts();
    expect(options).toContain(uniquePersonaName);

    // 8. Clean up (Optional, but good practice so the list doesn't grow infinitely)
    // Go back to personas and delete it
    await page.goto('/personas');
    
    // Playwright handles window.confirm dialogs automatically by accepting them.
    page.on('dialog', dialog => dialog.accept());
    
    // Click the delete button on the card we created.
    const personaCard = page.locator('.relative.bg-white').filter({ has: page.locator(`h3:has-text("${uniquePersonaName}")`) }).first();
    const deleteBtn = personaCard.locator('button').last(); // The 2nd button in the card is delete
    await deleteBtn.click();
    
    // Verify it's gone
    await expect(page.locator('h3', { hasText: uniquePersonaName })).toHaveCount(0);
  });
});
