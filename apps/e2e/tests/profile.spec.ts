import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

test.describe('Profile Settings (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clerk.signIn({
      page,
      emailAddress: 'ghulammustafa.mf@gmail.com',
    });
  });

  test('should allow toggling filters and saving', async ({ page }) => {
    await page.goto('/profile');
    
    // Verify Profile page
    await expect(page.locator('text=Job Matching Filters')).toBeVisible();

    // Toggle a region
    const usRegionCheckbox = page.locator('text=United States');
    await usRegionCheckbox.click();

    // Toggle an employment type
    const contractTypeCheckbox = page.getByText('Contract', { exact: true });
    await contractTypeCheckbox.click();

    // Enter salary floor
    const salaryInput = page.getByPlaceholder('e.g., $150k annually or $80/hr');
    await salaryInput.fill('$160k');

    // Click Save Preferences
    const savePromise = page.waitForResponse(response => response.url().includes('/api/profile/filters') && response.status() === 200);
    const saveButton = page.getByRole('button', { name: 'Save Preferences' });
    await saveButton.click();

    await savePromise;

    // Look for the toast success message.
    const toastMessage = page.locator('text=Job filters successfully updated.');
    await expect(toastMessage).toBeVisible();
  });
});
