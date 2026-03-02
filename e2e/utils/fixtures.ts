import { test as base } from '@playwright/test';
import {
  launchElectronApp,
  closeElectronApp,
  waitForAppReady,
  ElectronTestContext,
} from './electron-helpers';

/**
 * Custom Playwright fixtures for Electron testing
 *
 * These fixtures automatically handle app lifecycle, so you don't need
 * to manually launch/close the app in every test.
 *
 * Usage:
 * ```typescript
 * import { test, expect } from './utils/fixtures';
 *
 * test('my test', async ({ electronApp }) => {
 *   const { window } = electronApp;
 *   await expect(window.locator('#root')).toBeVisible();
 * });
 * ```
 */

type ElectronFixtures = {
  electronApp: ElectronTestContext;
};

/**
 * Extended test with Electron fixtures
 *
 * Automatically launches and closes the Electron app for each test
 */
export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    // Setup: Launch the app
    const context = await launchElectronApp();

    // Wait for app to be ready
    await waitForAppReady(context.window);

    // Make the context available to the test
    await use(context);

    // Teardown: Close the app
    await closeElectronApp(context.app);
  },
});

/**
 * Re-export expect for convenience
 */
export { expect } from '@playwright/test';

/**
 * Custom fixture for tests that don't need the app to auto-launch
 *
 * Use this when you need manual control over app lifecycle
 */
export const testManual = base;
