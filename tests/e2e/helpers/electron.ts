import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Helper functions for Electron app lifecycle management in E2E tests
 */

export interface ElectronTestContext {
  app: ElectronApplication;
  window: Page;
}

export interface LaunchOptions {
  /** Additional command line arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Custom timeout for launch */
  timeout?: number;
  /** Clear user data before launch */
  clearUserData?: boolean;
}

/**
 * Launch the Electron application
 * @returns Promise containing the ElectronApplication and first window
 */
export async function launchElectronApp(options: LaunchOptions = {}): Promise<ElectronTestContext> {
  const {
    args = [],
    env = {},
    timeout = 30000,
    clearUserData = false,
  } = options;

  // Clear user data if requested
  if (clearUserData) {
    const userDataPath = path.resolve(__dirname, '../../../test-user-data');
    try {
      await fs.rm(userDataPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  }

  const app = await electron.launch({
    args: [path.resolve(__dirname, '../../../dist-electron/main.js'), ...args],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      ...env,
    },
    timeout,
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
  currentApp: ElectronApplication,
  options?: LaunchOptions
): Promise<ElectronTestContext> {
  await closeElectronApp(currentApp);
  return launchElectronApp(options);
}

/**
 * Wait for the main window to be ready
 * @param window - The Page instance representing the main window
 */
export async function waitForAppReady(window: Page): Promise<void> {
  await window.waitForLoadState('networkidle', { timeout: 15000 });
  // Wait for the root element to be visible
  await window.locator('#root').waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Wait for UI to be in ready state (no loading indicators)
 */
export async function waitForUIReady(window: Page): Promise<void> {
  await waitForAppReady(window);

  // Wait for common loading indicators to disappear
  const loadingSelectors = [
    '.loading',
    '.loading-overlay',
    '.spinner',
    '[data-testid="loading"]',
  ];

  for (const selector of loadingSelectors) {
    try {
      await window.locator(selector).waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // Loading indicator might not exist, which is fine
    }
  }

  // Wait for any animations to complete
  await window.waitForTimeout(300);
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

/**
 * Load a test project from a file
 */
export async function loadTestProject(window: Page, filePath: string): Promise<void> {
  // Trigger file open through IPC or UI interaction
  // This is a placeholder - implement based on your app's file loading mechanism
  await window.evaluate((path) => {
    // Use electron IPC to load project
    (window as any).electronAPI?.loadProject?.(path);
  }, filePath);

  // Wait for project to load
  await waitForUIReady(window);
}

/**
 * Create a new blank project
 */
export async function createNewProject(window: Page): Promise<void> {
  // Look for "New Project" button or similar
  const newProjectButton = window.locator('button:has-text("New Project"), button:has-text("Create New")').first();

  if (await newProjectButton.isVisible({ timeout: 5000 })) {
    await newProjectButton.click();
    await waitForUIReady(window);
  } else {
    // Fallback: use keyboard shortcut
    await window.keyboard.press('Control+N');
    await waitForUIReady(window);
  }
}

/**
 * Get the current window title
 */
export async function getWindowTitle(window: Page): Promise<string> {
  return await window.title();
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(
  window: Page,
  name: string,
  options?: { fullPage?: boolean }
): Promise<string> {
  const screenshotPath = path.resolve(__dirname, `../../../test-results/${name}.png`);
  await window.screenshot({ path: screenshotPath, fullPage: options?.fullPage || false });
  return screenshotPath;
}

/**
 * Get application console logs
 */
export async function getConsoleLogs(window: Page): Promise<string[]> {
  const logs: string[] = [];

  window.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  return logs;
}

/**
 * Check if the app is in the welcome screen
 */
export async function isWelcomeScreen(window: Page): Promise<boolean> {
  try {
    await window.locator('.welcome-screen, [data-testid="welcome-screen"]').waitFor({
      state: 'visible',
      timeout: 2000
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the app is in the editor view
 */
export async function isEditorView(window: Page): Promise<boolean> {
  try {
    await window.locator('.editor-view, .main-layout, [data-testid="editor-view"]').waitFor({
      state: 'visible',
      timeout: 2000
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Simulate keyboard shortcut
 */
export async function pressShortcut(window: Page, shortcut: string): Promise<void> {
  // Parse shortcut like "Ctrl+S" or "Cmd+Shift+P"
  const keys = shortcut.split('+');
  const modifiers: string[] = [];
  let key = '';

  for (const k of keys) {
    const normalized = k.trim();
    if (['Ctrl', 'Control', 'Cmd', 'Command', 'Alt', 'Shift', 'Meta'].includes(normalized)) {
      modifiers.push(normalized);
    } else {
      key = normalized;
    }
  }

  // Press modifiers
  for (const mod of modifiers) {
    await window.keyboard.down(mod);
  }

  // Press main key
  await window.keyboard.press(key);

  // Release modifiers
  for (const mod of modifiers.reverse()) {
    await window.keyboard.up(mod);
  }
}

/**
 * Wait for a specific condition with custom timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Get memory usage information from the app
 */
export async function getMemoryUsage(app: ElectronApplication): Promise<any> {
  return app.evaluate(async ({ app }) => {
    const processMemory = process.memoryUsage();
    return {
      heapUsed: processMemory.heapUsed,
      heapTotal: processMemory.heapTotal,
      external: processMemory.external,
      rss: processMemory.rss,
    };
  });
}
