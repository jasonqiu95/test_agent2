import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Electron E2E testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Global setup and teardown
  globalSetup: undefined,
  globalTeardown: undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Collect trace when retrying the failed test
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 15 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for Electron testing
  projects: [
    {
      name: 'electron',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Viewport settings for Electron window
        viewport: { width: 1280, height: 720 },
        // Slow down operations for better reliability in CI
        ...(process.env.CI && {
          launchOptions: {
            slowMo: 100,
          },
        }),
      },
    },
  ],

  // Output folders
  outputDir: 'test-results/',

  // Expect options
  expect: {
    // Default timeout for expect assertions
    timeout: 10 * 1000,
  },
});
