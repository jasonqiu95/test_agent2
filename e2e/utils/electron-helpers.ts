import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

/**
 * Electron E2E Test Utilities
 *
 * This module provides helper functions for managing Electron app lifecycle
 * in E2E tests, including launching, closing, and interacting with the app.
 */

export interface ElectronTestContext {
  app: ElectronApplication;
  window: Page;
}

export interface LaunchOptions {
  /** Custom environment variables */
  env?: Record<string, string>;
  /** Path to the main.js file (defaults to dist-electron/main.js) */
  mainPath?: string;
  /** Additional Electron command-line arguments */
  args?: string[];
  /** Timeout for app launch in milliseconds */
  timeout?: number;
}

/**
 * Launch the Electron application in test mode
 *
 * @param options - Launch configuration options
 * @returns Promise containing the ElectronApplication and first window
 */
export async function launchElectronApp(
  options: LaunchOptions = {}
): Promise<ElectronTestContext> {
  const {
    env = {},
    mainPath = path.resolve(__dirname, '../../dist-electron/main.js'),
    args = [],
    timeout = 30000,
  } = options;

  const app = await electron.launch({
    args: [mainPath, ...args],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      ...env,
    },
    timeout,
  });

  // Wait for the first window to open
  const window = await app.firstWindow({ timeout });

  // Wait for the page to be fully loaded
  await window.waitForLoadState('domcontentloaded', { timeout });

  return { app, window };
}

/**
 * Close the Electron application gracefully
 *
 * @param app - The ElectronApplication instance to close
 */
export async function closeElectronApp(app: ElectronApplication): Promise<void> {
  try {
    await app.close();
  } catch (error) {
    console.warn('Error closing Electron app:', error);
    // Force kill if graceful close fails
    await app.process().kill();
  }
}

/**
 * Restart the Electron application
 * Useful for testing app state persistence and initialization
 *
 * @param currentApp - The current ElectronApplication instance
 * @param options - Launch options for the restarted app
 * @returns New ElectronTestContext
 */
export async function restartElectronApp(
  currentApp: ElectronApplication,
  options: LaunchOptions = {}
): Promise<ElectronTestContext> {
  await closeElectronApp(currentApp);
  // Small delay to ensure clean shutdown
  await new Promise(resolve => setTimeout(resolve, 1000));
  return launchElectronApp(options);
}

/**
 * Wait for the main window to be fully ready
 * This includes waiting for network idle and the root element to be visible
 *
 * @param window - The Page instance representing the main window
 * @param options - Wait options
 */
export async function waitForAppReady(
  window: Page,
  options: { timeout?: number; rootSelector?: string } = {}
): Promise<void> {
  const { timeout = 10000, rootSelector = '#root' } = options;

  // Wait for network to be idle
  await window.waitForLoadState('networkidle', { timeout });

  // Wait for the root element to be visible
  await window.locator(rootSelector).waitFor({
    state: 'visible',
    timeout,
  });
}

/**
 * Get the Electron app path
 * Useful for file system operations during tests
 *
 * @param app - The ElectronApplication instance
 * @returns The app path
 */
export async function getAppPath(app: ElectronApplication): Promise<string> {
  return app.evaluate(async ({ app }) => {
    return app.getAppPath();
  });
}

/**
 * Get user data path
 * Useful for testing settings persistence and data storage
 *
 * @param app - The ElectronApplication instance
 * @returns The user data path
 */
export async function getUserDataPath(app: ElectronApplication): Promise<string> {
  return app.evaluate(async ({ app }) => {
    return app.getPath('userData');
  });
}

/**
 * Get the Electron app version
 *
 * @param app - The ElectronApplication instance
 * @returns The app version
 */
export async function getAppVersion(app: ElectronApplication): Promise<string> {
  return app.evaluate(async ({ app }) => {
    return app.getVersion();
  });
}

/**
 * Wait for a specific IPC event
 * Useful for testing IPC communication between main and renderer processes
 *
 * @param window - The Page instance
 * @param eventName - The IPC event name to wait for
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves with the event data
 */
export async function waitForIpcEvent<T = any>(
  window: Page,
  eventName: string,
  timeout = 5000
): Promise<T> {
  return window.evaluate(
    ({ eventName, timeout }) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timeout waiting for IPC event: ${eventName}`));
        }, timeout);

        // Listen for the event once
        const handler = (_event: any, data: any) => {
          clearTimeout(timer);
          resolve(data);
        };

        // This assumes you have IPC exposed through preload
        // Adjust based on your actual IPC setup
        if (window.electron?.ipcRenderer) {
          window.electron.ipcRenderer.once(eventName, handler);
        } else {
          reject(new Error('IPC not available'));
        }
      });
    },
    { eventName, timeout }
  );
}

/**
 * Take a screenshot with a descriptive name
 *
 * @param window - The Page instance
 * @param name - Screenshot name (without extension)
 * @param options - Screenshot options
 */
export async function takeScreenshot(
  window: Page,
  name: string,
  options: { fullPage?: boolean } = {}
): Promise<void> {
  const { fullPage = true } = options;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-results/${name}-${timestamp}.png`;

  await window.screenshot({
    path: filename,
    fullPage,
  });

  console.log(`Screenshot saved: ${filename}`);
}

/**
 * Clear user data directory
 * Useful for ensuring clean state between test runs
 *
 * @param app - The ElectronApplication instance
 */
export async function clearUserData(app: ElectronApplication): Promise<void> {
  const userDataPath = await getUserDataPath(app);
  const fs = require('fs');
  const rimraf = require('util').promisify(require('fs').rm);

  try {
    if (fs.existsSync(userDataPath)) {
      await rimraf(userDataPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn('Error clearing user data:', error);
  }
}
