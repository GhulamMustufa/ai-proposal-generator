import { test, expect } from '@playwright/test';

test.describe('Public Navigation', () => {
  test('homepage should load and display core marketing copy', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/PitchPilot/);

    // Check Hero Header
    await expect(page.locator('text=The AI platform that applies to jobs')).toBeVisible();
    await expect(page.locator('text=A hybrid automation engine')).toBeVisible();

    // Check Call to Action
    const ctaButtons = page.locator('text=Deploy your agent');
    await expect(ctaButtons.first()).toBeVisible();
  });

  test('navigation should contain auth buttons', async ({ page }) => {
    await page.goto('/');
    
    // Auth buttons are inside a Clerk <Show when="signed-out"> component
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });
});
