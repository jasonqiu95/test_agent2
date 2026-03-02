import { test, expect, _electron as electron } from '@playwright/test';
import * as path from 'path';

/**
 * Example E2E test for the Electron application
 *
 * This test demonstrates how to:
 * - Launch the Electron app
 * - Get the main window
 * - Perform basic UI interactions
 * - Clean up after the test
 */
test.describe('Electron App', () => {
  test('should launch the application', async () => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.resolve(__dirname, '../../dist-electron/main.js')],
    });

    // Wait for the first window to open
    const window = await electronApp.firstWindow();

    // Check that the window was created
    expect(window).toBeTruthy();

    // Get the window title
    const title = await window.title();
    expect(title).toBeTruthy();

    // Take a screenshot (helpful for debugging)
    await window.screenshot({ path: 'test-results/app-launch.png' });

    // Close the app
    await electronApp.close();
  });

  test('should display the main application content', async () => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.resolve(__dirname, '../../dist-electron/main.js')],
    });

    // Wait for the first window
    const window = await electronApp.firstWindow();

    // Wait for the app to load
    await window.waitForLoadState('domcontentloaded');

    // Check if the root element exists
    const root = await window.locator('#root');
    await expect(root).toBeVisible();

    // Close the app
    await electronApp.close();
  });

  test('should handle window lifecycle', async () => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.resolve(__dirname, '../../dist-electron/main.js')],
    });

    // Get the main window
    const window = await electronApp.firstWindow();

    // Verify window is not closed
    expect(window.isClosed()).toBe(false);

    // Get window dimensions
    const size = await window.evaluate(() => {
      return {
        width: (window as any).innerWidth,
        height: (window as any).innerHeight,
      };
    });

    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);

    // Close the app
    await electronApp.close();

    // Verify all windows are closed
    const windows = electronApp.windows();
    expect(windows.length).toBe(0);
  });
});
