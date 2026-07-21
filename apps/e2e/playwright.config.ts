import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars from web workspace for Clerk keys
dotenv.config({ path: path.resolve(__dirname, '../web/.env.local') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  // Set global setup to obtain Clerk testing token
  globalSetup: require.resolve('./global.setup'),

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // We can add Firefox/WebKit later, keeping it simple for now
  ],

  // Run the Next.js and NestJS servers before the tests
  webServer: [
    {
      command: 'npm run dev:api',
      url: 'http://localhost:3001/api/profile', // wait for API to be responsive
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      cwd: '../../', // Run from monorepo root
    },
    {
      command: 'npm run dev:web',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      cwd: '../../', // Run from monorepo root
    }
  ],
});
