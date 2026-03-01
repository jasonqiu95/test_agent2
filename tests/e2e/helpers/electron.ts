import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

/**
 * Helper functions for Electron app lifecycle management in E2E tests
 */

export interface ElectronTestContext {
  app: ElectronApplication;
  window: Page;
}

/**
 * Launch the Electron application
 * @returns Promise containing the ElectronApplication and first window
 */
export async function launchElectronApp(): Promise<ElectronTestContext> {
  const app = await electron.launch({
    args: [path.resolve(__dirname, '../../../dist-electron/main.js')],
    // Additional Electron launch options
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  // Wait for the first window to open
  const window = await app.firstWindow();

  // Wait for the page to be fully loaded
  await window.waitForLoadState('domcontentloaded');

  return { app, window };
}

/**
 * Close the Electron application gracefully
 * @param app - The ElectronApplication instance to close
 */
export async function closeElectronApp(app: ElectronApplication): Promise<void> {
  await app.close();
}

/**
 * Restart the Electron application
 * Useful for testing app state persistence
 */
export async function restartElectronApp(
  currentApp: ElectronApplication
): Promise<ElectronTestContext> {
  await closeElectronApp(currentApp);
  return launchElectronApp();
}

/**
 * Wait for the main window to be ready
 * @param window - The Page instance representing the main window
 */
export async function waitForAppReady(window: Page): Promise<void> {
  await window.waitForLoadState('networkidle');
  // Wait for the root element to be visible
  await window.locator('#root').waitFor({ state: 'visible' });
}

/**
 * Get the Electron app path
 * Useful for file system operations during tests
 */
export async function getAppPath(app: ElectronApplication): Promise<string> {
  return app.evaluate(async ({ app }) => {
    return app.getAppPath();
  });
}

/**
 * Get user data path
 * Useful for testing settings persistence
 */
export async function getUserDataPath(app: ElectronApplication): Promise<string> {
  return app.evaluate(async ({ app }) => {
    return app.getPath('userData');
  });
}
