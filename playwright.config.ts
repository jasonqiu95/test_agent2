import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Electron E2E testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directories - include e2e, tests/e2e, and tests/integration folders
  testMatch: ['e2e/**/*.spec.ts', 'tests/e2e/**/*.spec.ts', 'tests/integration/**/*.spec.ts'],

  // Maximum time one test can run for
  timeout: 60 * 1000,

  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },

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

    // Screenshot settings - capture on failure and include in reports
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },

    // Video settings - retain videos for all tests to aid in debugging
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 },
    },

    // Viewport size for consistent screenshots
    viewport: { width: 1280, height: 720 },

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

  // Global setup/teardown (optional)
  // globalSetup: require.resolve('./e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});
