import { test, expect } from '@playwright/test';
import {
  launchElectronApp,
  closeElectronApp,
  waitForAppReady,
  getAppVersion,
  getUserDataPath,
  ElectronTestContext,
} from './utils/electron-helpers';

/**
 * Electron App E2E Tests
 *
 * These tests demonstrate best practices for testing Electron applications:
 * - Proper app lifecycle management
 * - Using helper utilities
 * - Testing UI interactions
 * - Verifying app state
 */

test.describe('Electron App Lifecycle', () => {
  let context: ElectronTestContext;

  test.beforeEach(async () => {
    // Launch the app before each test
    context = await launchElectronApp();
  });

  test.afterEach(async () => {
    // Always close the app after each test
    if (context?.app) {
      await closeElectronApp(context.app);
    }
  });

  test('should launch the application successfully', async () => {
    const { app, window } = context;

    // Verify app launched
    expect(app).toBeTruthy();
    expect(window).toBeTruthy();

    // Verify window is not closed
    expect(window.isClosed()).toBe(false);

    // Get window title
    const title = await window.title();
    expect(title).toBeTruthy();
  });

  test('should display the main application UI', async () => {
    const { window } = context;

    // Wait for app to be ready
    await waitForAppReady(window);

    // Check if the root element exists and is visible
    const root = window.locator('#root');
    await expect(root).toBeVisible();

    // Verify window dimensions are reasonable
    const size = await window.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    expect(size.width).toBeGreaterThan(800);
    expect(size.height).toBeGreaterThan(600);
  });

  test('should have correct app version', async () => {
    const { app } = context;

    const version = await getAppVersion(app);
    expect(version).toBeTruthy();
    expect(typeof version).toBe('string');
  });

  test('should have user data path configured', async () => {
    const { app } = context;

    const userDataPath = await getUserDataPath(app);
    expect(userDataPath).toBeTruthy();
    expect(userDataPath).toContain('electron-book-publishing-app');
  });
});

test.describe('Application UI', () => {
  let context: ElectronTestContext;

  test.beforeEach(async () => {
    context = await launchElectronApp();
    await waitForAppReady(context.window);
  });

  test.afterEach(async () => {
    if (context?.app) {
      await closeElectronApp(context.app);
    }
  });

  test('should render the main application container', async () => {
    const { window } = context;

    // Check for main application container
    const root = window.locator('#root');
    await expect(root).toBeVisible();

    // Verify the root has content
    const hasContent = await root.evaluate((el) => {
      return el.children.length > 0;
    });
    expect(hasContent).toBe(true);
  });

  test('should handle window resize', async () => {
    const { window } = context;

    // Get initial size
    const initialSize = await window.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    // Resize window
    await window.setViewportSize({ width: 1024, height: 768 });

    // Wait a bit for resize to take effect
    await window.waitForTimeout(500);

    // Get new size
    const newSize = await window.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    // Sizes should be different
    expect(newSize.width).not.toBe(initialSize.width);
  });

  test('should take screenshot on test', async () => {
    const { window } = context;

    // Take a screenshot for visual verification
    await window.screenshot({
      path: 'test-results/app-ui-screenshot.png',
      fullPage: true,
    });

    // Verify screenshot was created (implicitly passes if no error)
    expect(true).toBe(true);
  });
});

test.describe('Application State', () => {
  test('should maintain state during window lifecycle', async () => {
    // Launch app
    const context = await launchElectronApp();
    const { app, window } = context;

    await waitForAppReady(window);

    // Verify window is open
    expect(window.isClosed()).toBe(false);

    // Check that we can get windows
    const windows = app.windows();
    expect(windows.length).toBeGreaterThan(0);

    // Close the app
    await closeElectronApp(app);

    // Verify all windows are closed after app close
    const windowsAfterClose = app.windows();
    expect(windowsAfterClose.length).toBe(0);
  });

  test('should handle multiple window operations', async () => {
    const context = await launchElectronApp();
    const { window } = context;

    await waitForAppReady(window);

    // Perform multiple operations
    await window.evaluate(() => document.title);
    await window.locator('#root').isVisible();
    await window.screenshot({ path: 'test-results/multi-op-test.png' });

    // App should still be responsive
    expect(window.isClosed()).toBe(false);

    await closeElectronApp(context.app);
  });
});
