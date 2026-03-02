import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Electron E2E testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory - using root-level e2e folder
  testDir: './e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Shared settings for all projects
  use: {
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 10000,
  },

  // Configure projects for Electron testing
  projects: [
    {
      name: 'electron',
      testMatch: '**/*.spec.ts',
      use: {
        // Note: For Electron, we don't use standard browser launch
        // Tests should use the electron-helpers utility to launch the app
        viewport: null, // Electron controls its own viewport
      },
    },
  ],

  // Output folders
  outputDir: 'test-results/',

  // Global setup/teardown (optional)
  // globalSetup: require.resolve('./e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});
