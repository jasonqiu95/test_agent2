import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Electron E2E testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    // Base URL for the Electron app (adjust if needed)
    baseURL: 'file://' + path.resolve(__dirname, 'dist/index.html'),

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

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
  },

  // Configure projects for different Electron scenarios
  projects: [
    {
      name: 'electron',
      use: {
        ...devices['Desktop Chrome'],
        // Electron-specific launch options
        launchOptions: {
          executablePath: require('electron'),
          args: [
            path.resolve(__dirname, 'dist-electron/main.js'),
          ],
        },
      },
    },
  ],

  // Output folders
  outputDir: 'test-results/',
});
